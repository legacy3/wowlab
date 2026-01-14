import type { AccessControlProvider } from "@refinedev/core";

export function createAccessControlProvider(): AccessControlProvider {
  return {
    can: async () => ({ can: true }),
  };
}
