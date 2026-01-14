import { trpcClient } from './trpc';

/**
 * Utility to refresh balance from MenuSafe (read-only).
 */
export const migrationService = {
  /**
   * Refresh balance for the current member.
   */
  async syncUser(memberId: string) {
    try {
      const result = await trpcClient.menusafe.getLatestBalance.query({ memberId });
      return result;
    } catch (error) {
      console.error('[Migration] Failed to sync user:', error);
      throw error;
    }
  }
};
