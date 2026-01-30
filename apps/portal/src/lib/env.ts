const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CENTRIFUGO_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
];

if (typeof window === "undefined") {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
}

export const env = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  CENTRIFUGO_URL: process.env.NEXT_PUBLIC_CENTRIFUGO_URL!,
  DISCORD_URL: process.env.NEXT_PUBLIC_DISCORD_URL || "/go/discord",
  GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL || "/go/github",
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
} as const;
