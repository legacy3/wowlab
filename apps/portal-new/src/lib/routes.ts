export const routes = {
  about: {
    index: "/about",
    privacy: "/about?tab=privacy-policy",
    terms: "/about?tab=terms-of-service",
  },
  account: {
    index: "/account",
    settings: "/account/settings",
  },
  auth: {
    signIn: "/auth/sign-in",
  },
  dev: {
    ui: "/dev/ui",
  },
  home: "/",
  simulate: "/simulate",
} as const;
