export const routes = {
  home: "/",
  about: {
    index: "/about",
    privacy: "/about?tab=privacy",
    terms: "/about?tab=terms",
  },
  auth: {
    signIn: "/auth/sign-in",
  },
  demo: "/demo",
  docs: "/docs",
  lab: {
    index: "/lab",
    inspector: "/lab/inspector/search",
  },
  optimize: "/optimize",
  rankings: "/rankings",
  rotations: {
    index: "/rotations",
    editor: "/rotations/editor",
  },
  simulate: {
    index: "/simulate",
    quick: "/simulate/quick",
    advanced: "/simulate/advanced",
  },
  talents: "/talents",
} as const;
