const requiredEnv = ["NEXT_PUBLIC_APP_URL"];

export const env = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  DISCORD_URL: process.env.NEXT_PUBLIC_DISCORD_URL || "/go/discord",
  GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL || "/go/github",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

if (typeof window === "undefined") {
  const missing = requiredEnv.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
