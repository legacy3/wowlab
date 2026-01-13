import type { MetadataRoute } from "next";

import {
  BookOpen,
  Calculator,
  ChartBar,
  Code,
  Cpu,
  FileText,
  FlaskConical,
  Home,
  Info,
  KeyRound,
  LogIn,
  Newspaper,
  PenLine,
  Play,
  Search,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
} from "lucide-react";

/* eslint-disable */

const icons = {
  BookOpen,
  Calculator,
  ChartBar,
  Code,
  Cpu,
  FileText,
  FlaskConical,
  Home,
  Info,
  KeyRound,
  LogIn,
  Newspaper,
  PenLine,
  Play,
  Search,
  Settings,
  Shield,
  Sparkles,
  Swords,
  User,
} as const;

type IconName = keyof typeof icons;
type NavMeta = {
  _nav: { section: "main" | "secondary"; items: readonly string[] };
};
type RouteGroup = { index: Route } & Record<
  string,
  AnyRoute | Record<string, AnyRoute>
>;

type SitemapEntry = MetadataRoute.Sitemap[number];

export type SitemapConfig =
  | { indexed: false }
  | {
    indexed: true;
    changeFrequency: SitemapEntry["changeFrequency"];
    priority: SitemapEntry["priority"];
  };

const sitemap = {
  daily: { indexed: true, changeFrequency: "daily", priority: 0.8 },
  weekly: { indexed: true, changeFrequency: "weekly", priority: 0.7 },
  monthly: { indexed: true, changeFrequency: "monthly", priority: 0.6 },
  disabled: { indexed: false },
} as const satisfies Record<string, SitemapConfig>;

export type Route = {
  path: string;
  label: string;
  description: string;
  icon: IconName;
  sitemap: SitemapConfig;
};
export type DynamicRoute = {
  template: string;
  params: readonly string[];
  label: string;
  icon: IconName;
};
export type AnyRoute = Route | DynamicRoute;
export type RouteDef = Route;
export type MenuItem = { route: Route; external?: boolean };
export type MenuNavItem = { route: Route; items: readonly Route[] };

export function getIcon(name: IconName) {
  return icons[name];
}

function route(
  path: string,
  label: string,
  description: string,
  icon: IconName,
  sitemapConfig: SitemapConfig = sitemap.disabled,
): Route {
  return { path, label, description, icon, sitemap: sitemapConfig };
}

function dynamic(
  template: string,
  params: readonly string[],
  label: string,
  icon: IconName,
): DynamicRoute {
  return { template, params, label, icon };
}

function group<T extends RouteGroup>(routes: T) {
  return {
    main: (...items: string[]): T & NavMeta => ({
      ...routes,
      _nav: { section: "main", items },
    }),
    secondary: (): T & NavMeta => ({
      ...routes,
      _nav: { section: "secondary", items: [] },
    }),
    standalone: (): T => routes,
  };
}

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
  }).standalone(),

  about: group({
    index: route("/about", "About", "About WoW Lab", "Info", sitemap.monthly),
    privacy: route("/about?tab=privacy-policy", "Privacy Policy", "Privacy policy", "Shield", sitemap.monthly),
    terms: route("/about?tab=terms-of-service", "Terms of Service", "Terms of service", "FileText", sitemap.monthly),
  }).standalone(),

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
    talents: route("/plan/talents", "Talents", "Talent tree builder", "Sparkles", sitemap.monthly),
  }).main("talents"),

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
    hooks: route("/dev/hooks", "Hooks", "Game data hooks", "FlaskConical"),
    ui: route("/dev/ui", "UI Showcase", "UI components", "Sparkles"),
  }).main("docs", "hooks", "ui"),

  error: route("/error", "Error", "Something went wrong", "Info"),
  notFound: route("/404", "Not Found", "Page not found", "Info"),
  unauthorized: route("/unauthorized", "Sign In Required", "Sign in required", "LogIn"),
} as const;

function hasNav(obj: unknown): obj is RouteGroup & NavMeta {
  return (
    typeof obj === "object" && obj !== null && "_nav" in obj && "index" in obj
  );
}

function getByPath(obj: RouteGroup, path: string): Route {
  let current: unknown = obj;

  for (const key of path.split(".")) {
    current = (current as Record<string, unknown>)[key];
  }

  // If result is a nested group, return its index
  if (typeof current === "object" && current !== null && "index" in current) {
    return (current as { index: Route }).index;
  }

  return current as Route;
}

function buildNav() {
  const main: { route: Route; items: Route[] }[] = [];
  const secondary: { route: Route }[] = [];

  for (const value of Object.values(routes)) {
    if (!hasNav(value)) {
      continue;
    }

    const { section, items } = value._nav;

    if (section === "main") {
      main.push({
        route: value.index,
        items: items.map((p) => getByPath(value, p)),
      });
    } else {
      secondary.push({ route: value.index });
    }
  }

  return { main, secondary };
}

const nav = buildNav();

export const navMain = nav.main;
export const navSecondary = nav.secondary;

export function href(route: Route): string;
export function href(
  route: DynamicRoute,
  params: Record<string, string>,
): string;
export function href(route: AnyRoute, params?: Record<string, string>): string {
  if ("template" in route) {
    let result = route.template;

    for (const key of route.params) {
      result = result.replace(`:${key}`, params![key]);
    }

    return result;
  }

  return route.path;
}

function isRoute(value: unknown): value is Route {
  return typeof value === "object" && value !== null && "path" in value;
}

export function breadcrumb(
  ...items: [...Route[], Route | string]
): { href?: string; label: string }[] {
  return items.map((item, index) => {
    const isLast = index === items.length - 1;
    const label = typeof item === "string" ? item : item.label;
    const path = typeof item === "string" ? undefined : item.path;

    return isLast ? { label } : { href: path, label };
  });
}

export function getGroupRoutes(group: Record<string, unknown>): Route[] {
  return Object.entries(group)
    .filter(([key]) => key !== "index" && key !== "_nav")
    .map(([, value]) => {
      if (isRoute(value)) {
        return value;
      }

      if (typeof value === "object" && value !== null && "index" in value) {
        const nested = value as { index: unknown };

        if (isRoute(nested.index)) {
          return nested.index;
        }
      }

      return null;
    })
    .filter((route): route is Route => route !== null)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function collectRoutes(obj: unknown): Route[] {
  if (!obj || typeof obj !== "object") {
    return [];
  }

  if (isRoute(obj)) {
    return [obj];
  }

  return Object.entries(obj)
    .filter(([key]) => key !== "_nav")
    .flatMap(([, value]) => collectRoutes(value));
}

export type IndexedRoute = Route & {
  sitemap: {
    indexed: true;
    changeFrequency: SitemapEntry["changeFrequency"];
    priority: SitemapEntry["priority"];
  };
};

export function getSitemapRoutes(): IndexedRoute[] {
  return collectRoutes(routes).filter(
    (r): r is IndexedRoute => r.sitemap.indexed,
  );
}

export function getDisallowedPaths(): string[] {
  const paths = collectRoutes(routes)
    .filter((r) => !r.sitemap.indexed)
    .map((r) => r.path)
    .sort((a, b) => a.length - b.length);

  return paths
    .filter((path, _, all) => !all.some((p) => p !== path && path.startsWith(p)))
    .map((p) => `${p}/`);
}
