import { env } from "./env";

export const getAuthCallbackUrl = () => {
  return `${env.APP_URL}/auth/callback`;
};