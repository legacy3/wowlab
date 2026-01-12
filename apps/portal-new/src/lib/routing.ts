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
  ListTree,
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
  ListTree,
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

export type Route = {
  path: string;
  label: string;
  description: string;
  icon: IconName;
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
): Route {
  return { path, label, description, icon };
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
  home: route("/", "Home", "WoW Lab theorycrafting and simulation tools", "Home"),

  computing: route("/computing", "Computing", "Simulation compute resources and job queue", "Cpu"),

  auth: group({
    index: route("/auth", "Auth", "Authentication and authorization", "KeyRound"),
    signIn: route("/auth/sign-in", "Sign In", "Sign in to your account", "LogIn"),
  }).standalone(),

  account: group({
    index: route("/account", "Account", "Manage your account", "User"),
    settings: route("/account/settings", "Settings", "Account settings and preferences", "Settings"),
  }).standalone(),

  about: group({
    index: route("/about", "About", "About WoW Lab", "Info"),
    privacy: route("/about?tab=privacy-policy", "Privacy Policy", "Privacy policy and data handling", "Shield"),
    terms: route("/about?tab=terms-of-service", "Terms of Service", "Terms of service and usage", "FileText"),
  }).standalone(),

  simulate: group({
    index: route("/simulate", "Simulate", "Run DPS and HPS simulations", "Play"),
    results: dynamic("/simulate/results/:id", ["id"], "Results", "ChartBar"),
  }).main(),

  rotations: group({
    index: route("/rotations", "Rotations", "Browse and manage rotation priorities", "Swords"),
    view: dynamic("/rotations/:id", ["id"], "View Rotation", "Swords"),
    editor: {
      new: route("/rotations/editor", "New Rotation", "Create a new rotation priority", "PenLine"),
      edit: dynamic("/rotations/editor/:id", ["id"], "Edit Rotation", "PenLine"),
    },
  }).main("editor.new"),

  plan: group({
    index: route("/plan", "Plan", "Character planning tools", "Calculator"),
    talents: route("/plan/talents", "Talents", "Talent tree builder and optimizer", "Sparkles"),
  }).main("talents"),

  lab: group({
    index: route("/lab", "Lab", "Development and testing tools", "FlaskConical"),
    overview: route("/lab/overview", "Overview", "System overview and status", "ListTree"),
    inspector: route("/lab/inspector", "Data Inspector", "Inspect game data and spell mechanics", "Search"),
  }).main("overview", "inspector"),

  blog: group({
    index: route("/blog", "Blog", "News and updates", "Newspaper"),
    post: dynamic("/blog/:slug", ["slug"], "Blog Post", "FileText"),
  }).secondary(),

  dev: group({
    index: route("/dev", "Developer", "Internal tools and component showcases", "Code"),
    ui: route("/dev/ui", "UI Showcase", "Park UI components with Panda CSS recipes", "Sparkles"),
    data: route("/dev/data", "Data Lab", "Game data hooks for spells, items, classes, and specs", "FlaskConical"),
    docs: {
      index: route("/dev/docs", "Docs", "Technical documentation and guides", "BookOpen"),
      page: dynamic("/dev/docs/:slug", ["slug"], "Doc Page", "FileText"),
    },
  }).secondary(),

  error: route("/error", "Error", "Something went wrong", "Info"),
  notFound: route("/404", "Not Found", "The page you're looking for doesn't exist", "Info"),
  unauthorized: route("/unauthorized", "Sign In Required", "Please sign in to continue", "LogIn"),
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
