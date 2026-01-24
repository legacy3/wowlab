import type {
  AnyRoute,
  DynamicRoute,
  IconName,
  Route,
  SitemapConfig,
} from "./types";

type NavMeta = {
  _nav: { section: "main" | "secondary"; items: readonly string[] };
};

type RouteGroup = { index: Route } & Record<
  string,
  AnyRoute | Record<string, AnyRoute>
>;

const sitemap = {
  daily: { changeFrequency: "daily", indexed: true, priority: 0.8 },
  disabled: { indexed: false },
  monthly: { changeFrequency: "monthly", indexed: true, priority: 0.6 },
  weekly: { changeFrequency: "weekly", indexed: true, priority: 0.7 },
} as const satisfies Record<string, SitemapConfig>;

function dynamic(
  template: string,
  params: readonly string[],
  label: string,
  icon: IconName,
): DynamicRoute {
  return { icon, label, params, template };
}

function group<T extends RouteGroup>(routes: T) {
  return {
    main: (...items: string[]): NavMeta & T => ({
      ...routes,
      _nav: { items, section: "main" },
    }),
    secondary: (): NavMeta & T => ({
      ...routes,
      _nav: { items: [], section: "secondary" },
    }),
    standalone: (): T => routes,
  };
}

function route(
  path: string,
  label: string,
  description: string,
  icon: IconName,
  sitemapConfig: SitemapConfig = sitemap.disabled,
  preview = false,
): Route {
  return { description, icon, label, path, preview, sitemap: sitemapConfig };
}

/* eslint-disable perfectionist/sort-objects */
// prettier-ignore
export const routes = {
  home: route("/", "Home", "Theorycrafting and simulation tools", "Home", sitemap.weekly),

  computing: route("/computing", "Computing", "Compute resources and job queue", "Cpu"),

  auth: group({
    index: route("/auth", "Auth", "Authentication", "KeyRound"),
    signIn: route("/auth/sign-in", "Sign In", "Sign in", "LogIn"),
  }).standalone(),

  account: group({
    index: route("/account", "Account", "Your account", "User"),
    settings: route("/account/settings", "Settings", "Account settings", "Settings"),
    nodes: {
      index: route("/account/nodes", "Nodes", "Manage compute nodes", "Server"),
      claim: route("/account/nodes/claim", "Claim Node", "Claim a new node", "Server"),
    },
  }).standalone(),

  users: {
    profile: dynamic("/users/:handle", ["handle"], "User Profile", "User"),
  },

  about: group({
    index: route("/about", "About", "About WoW Lab", "Info", sitemap.monthly),
    privacy: route("/about?tab=privacy-policy", "Privacy Policy", "Privacy Policy", "Shield", sitemap.monthly),
    terms: route("/about?tab=terms-of-service", "Terms of Service", "Terms of Service", "FileText", sitemap.monthly),
  }).secondary(),

  simulate: group({
    index: route("/simulate", "Simulate", "Run simulations", "Play", sitemap.weekly),
    results: dynamic("/simulate/results/:id", ["id"], "Results", "ChartBar"),
  }).main(),

  rotations: group({
    index: route("/rotations", "Rotations", "Rotation priorities", "Swords", sitemap.weekly),
    browse: route("/rotations/browse", "Browse", "Community rotations", "Search", sitemap.weekly),
    view: dynamic("/rotations/:id", ["id"], "View Rotation", "Swords"),
    editor: {
      index: route("/rotations/editor", "New Rotation", "Create rotation", "PenLine"),
      edit: dynamic("/rotations/editor/:id", ["id"], "Edit Rotation", "PenLine"),
    },
  }).main("browse", "editor"),

  plan: group({
    index: route("/plan", "Plan", "Character planning", "Calculator", sitemap.monthly),
    traits: route("/plan/traits", "Traits", "Trait calculator", "Sparkles", sitemap.monthly, true),
  }).main("traits"),

  blog: group({
    index: route("/blog", "Blog", "News and updates", "Newspaper", sitemap.weekly),
    post: dynamic("/blog/:slug", ["slug"], "Blog Post", "FileText"), // sitemap: lib/blog
  }).secondary(),

  dev: group({
    index: route("/dev", "Developer", "Developer tools", "Code", sitemap.monthly),
    docs: {
      index: route("/dev/docs", "Docs", "Documentation", "BookOpen", sitemap.weekly),
      page: dynamic("/dev/docs/:slug", ["slug"], "Doc Page", "FileText"), // sitemap: lib/docs
    },
    engine: route("/dev/engine", "Engine", "Simulation engine", "Cpu"),
    hooks: route("/dev/hooks", "Hooks", "Game data hooks", "FlaskConical"),
    sentinel: route("/dev/sentinel", "Sentinel", "Sentinel metrics", "Activity"),
    ui: route("/dev/ui", "UI Showcase", "UI components", "Sparkles"),
  }).main("docs", "engine", "hooks", "sentinel", "ui"),

  error: route("/error", "Error", "Something went wrong", "Info"),
  notFound: route("/404", "Not Found", "Page not found", "Info"),
  unauthorized: route("/unauthorized", "Sign In Required", "Sign in required", "LogIn"),
} as const;
