import { toSlug } from "./slugify";

export type PlayerRouteParams = {
  region: string;
  realm: string;
  name: string;
};

export function playerRoute({
  region,
  realm,
  name,
}: PlayerRouteParams): string {
  return `/players/${toSlug(region)}/${toSlug(realm)}/${toSlug(name)}`;
}

export function regionRoute(region: string): string {
  return `/players/${toSlug(region)}`;
}

export function realmRoute(region: string, realm: string): string {
  return `/players/${toSlug(region)}/${toSlug(realm)}`;
}
