import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

/**
 * MenuSafe (MS) API response structure (based on typical POS integrations)
 */
interface MenuSafeUser {
  CardNo: string;
  CustomerName: string;
  Mobile: string;
  Balance: number;
  Points: number;
  GradeName: string;
  CreateTime: string;
}

// Mock MenuSafe database for demonstration
const mockMenuSafeUsers: MenuSafeUser[] = [
  {
    CardNo: 'VIP8888',
    CustomerName: '张三',
    Mobile: '13800138000',
    Balance: 1250.50,
    Points: 500,
    GradeName: '黄金会员',
    CreateTime: '2024-05-20',
  },
  {
    CardNo: 'VIP9999',
    CustomerName: '李四',
    Mobile: '13912345678',
    Balance: 88.00,
    Points: 120,
    GradeName: '普通会员',
    CreateTime: '2025-01-01',
  }
];

/**
 * Helper to fetch from MenuSafe API if credentials exist
 */
async function fetchMenuSafeUser(params: { phone?: string; cardNo?: string }): Promise<MenuSafeUser | null> {
  const apiKey = process.env.MENUSAFE_API_KEY;
  const baseUrl = process.env.MENUSAFE_API_URL || 'https://api.menusafe.com/v1';

  // If no API key is configured, fallback to mock data
  if (!apiKey) {
    console.warn('[MenuSafe] No API key configured, using mock data.');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate latency
    
    if (params.phone) {
      return mockMenuSafeUsers.find(u => u.Mobile === params.phone) || null;
    }
    if (params.cardNo) {
      return mockMenuSafeUsers.find(u => u.CardNo === params.cardNo) || null;
    }
    return null;
  }

  // Real API implementation
  try {
    const query = new URLSearchParams();
    if (params.phone) query.append('mobile', params.phone);
    if (params.cardNo) query.append('cardNo', params.cardNo);

    const response = await fetch(`${baseUrl}/members?${query.toString()}`, {
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
    return data as MenuSafeUser;
  } catch (error) {
    console.error('[MenuSafe] Fetch failed:', error);
    return null;
  }
}

export const menusafeRouter = createTRPCRouter({
  /**
   * Search for a user in the legacy MenuSafe system.
   * This would typically call the MenuSafe API.
   */
  searchByPhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(async ({ input }: { input: { phone: string } }) => {
      const user = await fetchMenuSafeUser({ phone: input.phone });
      return user;
    }),

  /**
   * Import a user from MenuSafe into our current Rork system.
   */
  importUser: publicProcedure
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }: { input: { phone: string } }) => {
      // 1. Fetch from MenuSafe
      const menusafeUser = await fetchMenuSafeUser({ phone: input.phone });
      
      if (!menusafeUser) {
        throw new Error("User not found in MenuSafe system");
      }

      // 2. Map MenuSafe fields to Rork User fields
      const tierMap: Record<string, 'silver' | 'gold' | 'platinum' | 'diamond'> = {
        '普通会员': 'silver',
        '黄金会员': 'gold',
        '铂金会员': 'platinum',
        '钻石会员': 'diamond',
      };

      const importedUser = {
        id: `ms_${menusafeUser.CardNo}`,
        memberId: menusafeUser.CardNo,
        name: menusafeUser.CustomerName,
        phone: menusafeUser.Mobile,
        balance: menusafeUser.Balance,
        points: menusafeUser.Points,
        tier: tierMap[menusafeUser.GradeName] || 'silver',
        joinDate: menusafeUser.CreateTime,
      };

      // 3. Persist to our database (mocked for now)
      console.log('[Migration] Imported user from MenuSafe:', importedUser);

      // In a real scenario, you'd insert this into your main DB
      // and possibly invalidate caches.
      // Example with a hypothetical DB:
      // await db.users.upsert({ where: { phone: importedUser.phone }, update: importedUser, create: importedUser });

      return {
        success: true,
        user: importedUser,
      };
    }),

  /**
   * Batch import procedure (for admin use)
   * This can be called from a script or an admin dashboard.
   */
  batchImport: publicProcedure
    .input(z.object({ users: z.array(z.any()) }))
    .mutation(async ({ input }: { input: { users: any[] } }) => {
      console.log(`[Migration] Batch importing ${input.users.length} users...`);
      // Logic for batch insertion would go here
      return { importedCount: input.users.length };
    }),

  /**
   * Synchronize balance and points from MenuSafe for an existing user.
   */
  syncData: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input }: { input: { memberId: string } }) => {
      const menusafeUser = await fetchMenuSafeUser({ cardNo: input.memberId });
      
      if (!menusafeUser) {
        throw new Error("Could not find matching user in MenuSafe for sync");
      }

      return {
        balance: menusafeUser.Balance,
        points: menusafeUser.Points,
        lastSync: new Date().toISOString(),
      };
    }),
});
