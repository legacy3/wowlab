export const routes = {
  home: "/",
  demo: "/demo",
  simulate: {
    index: "/simulate",
    quick: "/simulate/quick",
    advanced: "/simulate/advanced",
  },
  optimize: "/optimize",
  rankings: "/rankings",
  talents: "/talents",
  rotations: {
    index: "/rotations",
    editor: "/rotations/editor",
  },
  lab: {
    index: "/lab",
    inspector: "/lab/inspector/search",
  },
  docs: "/docs",
} as const;
