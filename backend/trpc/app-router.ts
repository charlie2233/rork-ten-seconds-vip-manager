import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { transactionsRouter } from "./routes/transactions";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  transactions: transactionsRouter,
});

export type AppRouter = typeof appRouter;
