import type { AnyRoute, DynamicRoute, IndexedRoute, Route } from "./types";

import { routes } from "./routes";

type NavMeta = {
  _nav: { section: "main" | "secondary"; items: readonly string[] };
};

type RouteGroup = { index: Route } & Record<
  string,
  AnyRoute | Record<string, AnyRoute>
>;

function buildNav() {
  const main: { route: Route; items: Route[] }[] = [];
  const secondary: { route: Route }[] = [];

  for (const value of Object.values(routes)) {
    if (!hasNav(value)) {
      continue;
    }

    const { items, section } = value._nav;

    if (section === "main") {
      main.push({
        items: items.map((p) => getByPath(value, p)),
        route: value.index,
      });
    } else {
      secondary.push({ route: value.index });
    }
  }

  return { main, secondary };
}

function getByPath(obj: RouteGroup, path: string): Route {
  let current: unknown = obj;

  for (const key of path.split(".")) {
    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === "object" && current !== null && "index" in current) {
    return (current as { index: Route }).index;
  }

  return current as Route;
}

function hasNav(obj: unknown): obj is NavMeta & RouteGroup {
  return (
    typeof obj === "object" && obj !== null && "_nav" in obj && "index" in obj
  );
}

const nav = buildNav();

export const navMain = nav.main;
export const navSecondary = nav.secondary;

export function getDisallowedPaths(): string[] {
  const paths = collectRoutes(routes)
    .filter((r) => !r.sitemap.indexed)
    .map((r) => r.path)
    .sort((a, b) => a.length - b.length);

  return paths
    .filter(
      (path, _, all) => !all.some((p) => p !== path && path.startsWith(p)),
    )
    .map((p) => `${p}/`);
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

export function getSitemapRoutes(): IndexedRoute[] {
  return collectRoutes(routes).filter(
    (r): r is IndexedRoute => r.sitemap.indexed,
  );
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

function isRoute(value: unknown): value is Route {
  return typeof value === "object" && value !== null && "path" in value;
}

const allRoutes = collectRoutes(routes);

export function getRouteByPath(pathname: string): Route | undefined {
  return allRoutes.find(
    (r) => pathname === r.path || pathname.startsWith(r.path + "/"),
  );
}
