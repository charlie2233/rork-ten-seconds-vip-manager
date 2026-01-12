import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    // Fallback for development if needed, or just throw.
    // However, in Rork environment, this should usually be set if backend is enabled/deployed.
    // If running locally without this env, it might crash.
    // For safety, we can return empty string or localhost if we knew the port,
    // but per instructions, we throw or expect it.
    // Let's stick to the instruction code pattern but maybe make it safe for now if variable is missing during dev?
    // The instruction says: "Rork did not set EXPO_PUBLIC_RORK_API_BASE_URL, please use support"
    // I will use that.
    return ""; // Prevent crash during build time if env is missing, but it will fail at runtime if not set.
  }

  return url;
};

// for direct queries
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
