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

export type Route = { path: string; label: string; icon: IconName };
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

function route(path: string, label: string, icon: IconName): Route {
  return { path, label, icon };
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
  home: route("/", "Home", "Home"),

  computing: route("/computing", "Computing", "Cpu"),

  auth: group({
    index: route("/auth", "Auth", "KeyRound"),
    signIn: route("/auth/sign-in", "Sign In", "LogIn"),
  }).standalone(),

  account: group({
    index: route("/account", "Account", "User"),
    settings: route("/account/settings", "Settings", "Settings"),
  }).standalone(),

  about: group({
    index: route("/about", "About", "Info"),
    privacy: route("/about?tab=privacy-policy", "Privacy Policy", "Shield"),
    terms: route("/about?tab=terms-of-service", "Terms of Service", "FileText"),
  }).standalone(),

  simulate: group({
    index: route("/simulate", "Simulate", "Play"),
    results: dynamic("/simulate/results/:id", ["id"], "Results", "ChartBar"),
  }).main(),

  rotations: group({
    index: route("/rotations", "Rotations", "Swords"),
    view: dynamic("/rotations/:id", ["id"], "View Rotation", "Swords"),
    editor: {
      new: route("/rotations/editor", "New Rotation", "PenLine"),
      edit: dynamic("/rotations/editor/:id", ["id"], "Edit Rotation", "PenLine"),
    },
  }).main("editor.new"),

  plan: group({
    index: route("/plan", "Plan", "Calculator"),
    talents: route("/plan/talents", "Talents", "Sparkles"),
  }).main("talents"),

  lab: group({
    index: route("/lab", "Lab", "FlaskConical"),
    overview: route("/lab/overview", "Overview", "ListTree"),
    inspector: route("/lab/inspector", "Data Inspector", "Search"),
  }).main("overview", "inspector"),

  docs: group({
    index: route("/docs", "Docs", "BookOpen"),
    page: dynamic("/docs/:slug", ["slug"], "Doc Page", "FileText"),
  }).secondary(),

  blog: group({
    index: route("/blog", "Blog", "Newspaper"),
    post: dynamic("/blog/:slug", ["slug"], "Blog Post", "FileText"),
  }).secondary(),

  dev: group({
    index: route("/dev", "Dev", "Code"),
    ui: route("/dev/ui", "UI Showcase", "Sparkles"),
    data: route("/dev/data", "Data Lab", "FlaskConical"),
  }).secondary(),
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
