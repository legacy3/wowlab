export const routes = {
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
  home: "/",
  lab: {
    index: "/lab",
    inspector: "/lab/inspector/search",
  },
  optimize: "/optimize",
  rankings: "/rankings",
  rotations: {
    editor: "/rotations/editor",
    index: "/rotations",
  },
  simulate: {
    advanced: "/simulate/advanced",
    index: "/simulate",
    quick: "/simulate/quick",
  },
  talents: "/talents",
} as const;
