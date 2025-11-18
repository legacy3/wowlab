export const getAuthCallbackUrl = () => {
  if (typeof window === "undefined") {
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : "http://localhost:3000/auth/callback";
  }

  // Client-side: use window.location.origin
  return `${window.location.origin}/auth/callback`;
};
