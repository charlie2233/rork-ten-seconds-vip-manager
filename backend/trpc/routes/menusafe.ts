import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

/**
 * MenuSafe (MS) API response - only member ID and balance needed
 * Other user data (name, tier, points, etc.) is managed in our app
 */
interface MenuSafeMember {
  CardNo: string;   // Member ID
  Balance: number;  // Current balance
}

// Mock MenuSafe database for demonstration
const mockMenuSafeMembers: MenuSafeMember[] = [
  { CardNo: 'VIP8888', Balance: 1250.50 },
  { CardNo: 'VIP9999', Balance: 88.00 },
  { CardNo: 'VIP1234', Balance: 520.00 },
];

/**
 * Fetch member balance from MenuSafe by member ID (CardNo)
 */
async function fetchMenuSafeBalance(memberId: string): Promise<MenuSafeMember | null> {
  const apiKey = process.env.MENUSAFE_API_KEY;
  const baseUrl = process.env.MENUSAFE_API_URL || 'https://api.menusafe.com/v1';

  // If no API key is configured, fallback to mock data
  if (!apiKey) {
    console.warn('[MenuSafe] No API key configured, using mock data.');
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMenuSafeMembers.find(m => m.CardNo === memberId) || null;
  }

  // Real API implementation
  try {
    const response = await fetch(`${baseUrl}/members/${memberId}/balance`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[MenuSafe] API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return { CardNo: memberId, Balance: data.balance ?? data.Balance };
  } catch (error) {
    console.error('[MenuSafe] Fetch failed:', error);
    return null;
  }
}

export const menusafeRouter = createTRPCRouter({
  /**
   * Get balance from MenuSafe by member ID
   * This is the primary sync endpoint - only fetches what we need
   */
  getBalance: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ input }: { input: { memberId: string } }) => {
      const member = await fetchMenuSafeBalance(input.memberId);
      if (!member) return null;
      
      return {
        memberId: member.CardNo,
        balance: member.Balance,
      };
    }),

  /**
   * Sync balance from MenuSafe and update local state
   * Returns the latest balance for the given member ID
   */
  syncBalance: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input }: { input: { memberId: string } }) => {
      const member = await fetchMenuSafeBalance(input.memberId);
      
      if (!member) {
        throw new Error("Member not found in MenuSafe");
      }

      console.log(`[MenuSafe] Synced balance for ${input.memberId}: ¥${member.Balance}`);

      return {
        memberId: member.CardNo,
        balance: member.Balance,
        lastSync: new Date().toISOString(),
      };
    }),

  /**
   * Validate if a member ID exists in MenuSafe
   * Used during registration/linking flow
   */
  validateMemberId: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ input }: { input: { memberId: string } }) => {
      const member = await fetchMenuSafeBalance(input.memberId);
      return {
        exists: member !== null,
        balance: member?.Balance ?? null,
      };
    }),
});
