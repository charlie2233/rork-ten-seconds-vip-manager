import { trpcClient } from './trpc';

/**
 * Utility to handle data migration from MenuSafe to Rork
 */
export const migrationService = {
  /**
   * Search if a user exists in the old MenuSafe system
   */
  async findOldUser(phone: string) {
    try {
      const user = await trpcClient.menusafe.searchByPhone.query({ phone });
      return user;
    } catch (error) {
      console.error('[Migration] Failed to search old user:', error);
      return null;
    }
  },

  /**
   * Import the user data into the new system
   */
  async importFromMenuSafe(phone: string) {
    try {
      const result = await trpcClient.menusafe.importUser.mutate({ phone });
      return result;
    } catch (error) {
      console.error('[Migration] Failed to import user:', error);
      throw error;
    }
  },

  /**
   * Sync balance and points for an already imported user
   */
  async syncUser(memberId: string) {
    try {
      const result = await trpcClient.menusafe.syncData.mutate({ memberId });
      return result;
    } catch (error) {
      console.error('[Migration] Failed to sync user:', error);
      throw error;
    }
  }
};

