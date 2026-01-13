import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { transactionsRouter } from "./routes/transactions";
import { menusafeRouter } from "./routes/menusafe";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  transactions: transactionsRouter,
  menusafe: menusafeRouter,
});

export type AppRouter = typeof appRouter;
