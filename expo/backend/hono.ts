import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import revenueCatWebhook from "./webhooks/revenuecat";
import { appleWalletHandler } from "./api/pass";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

// Mount RevenueCat Webhook
app.route("/webhooks/revenuecat", revenueCatWebhook);

// Apple Wallet Pass Download Endpoint
app.get("/pass/:memberId", appleWalletHandler);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
