import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { transactionsRouter } from "./routes/transactions";
import { menusafeRouter } from "./routes/menusafe";
import { notificationsRouter } from "./routes/notifications";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  transactions: transactionsRouter,
  menusafe: menusafeRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
