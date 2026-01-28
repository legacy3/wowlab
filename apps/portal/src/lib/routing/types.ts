import type { MetadataRoute } from "next";

export type AnyRoute = Route | DynamicRoute;

export type DynamicRoute = {
  template: string;
  params: readonly string[];
  label: string;
  icon: IconName;
};

export type IconName =
  | "Activity"
  | "BookOpen"
  | "Calculator"
  | "ChartBar"
  | "Code"
  | "Cpu"
  | "FileText"
  | "FlaskConical"
  | "Home"
  | "Info"
  | "KeyRound"
  | "LogIn"
  | "Newspaper"
  | "PenLine"
  | "Play"
  | "Search"
  | "Server"
  | "Settings"
  | "Shield"
  | "Sparkles"
  | "Swords"
  | "User";

export type IndexedRoute = {
  sitemap: {
    indexed: true;
    changeFrequency: SitemapEntry["changeFrequency"];
    priority: SitemapEntry["priority"];
  };
} & Route;

export type MenuItem = { route: Route; external?: boolean };

export type MenuNavItem = { route: Route; items: readonly Route[] };

export type Route = {
  path: string;
  label: string;
  description: string;
  icon: IconName;
  sitemap: SitemapConfig;
  preview: boolean;
};

export type RouteDef = Route;

export type SitemapConfig =
  | { indexed: false }
  | {
      indexed: true;
      changeFrequency: SitemapEntry["changeFrequency"];
      priority: SitemapEntry["priority"];
    };

type SitemapEntry = MetadataRoute.Sitemap[number];
