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
  blog: {
    index: "/blog",
    post: (slug: string) => `/blog/${slug}`,
  },
  dev: {
    ui: "/dev/ui",
  },
  docs: {
    index: "/docs",
    page: (slug: string) => `/docs/${slug}`,
  },
  home: "/",
  simulate: "/simulate",
} as const;
