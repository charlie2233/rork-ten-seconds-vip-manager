import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

// In-memory store for push tokens (demo purpose)
// In a real app, this should be a database
const pushTokens = new Map<string, string>(); // userId -> token

export const notificationsRouter = createTRPCRouter({
  registerPushToken: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      pushTokens.set(input.userId, input.token);
      console.log(`[Backend] Registered push token for ${input.userId}: ${input.token}`);
      return { success: true };
    }),

  sendNotification: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string(),
        body: z.string(),
        data: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const token = pushTokens.get(input.userId);
      if (!token) {
        console.warn(`[Backend] No push token found for user ${input.userId}`);
        return { success: false, error: "No token found" };
      }

      if (!token.startsWith("ExponentPushToken") && !token.startsWith("ExpoPushToken")) {
         console.warn(`[Backend] Invalid push token for user ${input.userId}: ${token}`);
         return { success: false, error: "Invalid token" };
      }

      console.log(`[Backend] Sending notification to ${input.userId} (${token})`);

      const message = {
        to: token,
        sound: "default",
        title: input.title,
        body: input.body,
        data: input.data,
      };

      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const data = await response.json();
        console.log(`[Backend] Expo API response:`, data);
        return { success: true, data };
      } catch (error) {
        console.error(`[Backend] Error sending push notification:`, error);
        return { success: false, error: String(error) };
      }
    }),
});

