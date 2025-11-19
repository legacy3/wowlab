const requiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

// prettier-ignore
export const env = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  GITHUB_REPO_URL: process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/legacy3/wowlab",
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
} as const;

if (typeof window === "undefined") {
  const missing = requiredEnv.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
