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
    data: "/dev/data",
    index: "/dev",
    ui: "/dev/ui",
  },
  docs: {
    index: "/docs",
    page: (slug: string) => `/docs/${slug}`,
  },
  home: "/",
  rotations: {
    editor: {
      edit: (id: string) => `/rotations/editor/${id}`,
      new: "/rotations/editor",
    },
    index: "/rotations",
    view: (id: string) => `/rotations/${id}`,
  },
  simulate: "/simulate",
} as const;
