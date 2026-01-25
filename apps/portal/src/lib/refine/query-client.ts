import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// React cache() ensures one QueryClient per request on server
// On browser, this just returns the same instance
const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: 1000 * 60 * 60 * 24, // 24 hours
          staleTime: 1000 * 60 * 5, // 5 minutes
        },
      },
    }),
);

export { getQueryClient };
