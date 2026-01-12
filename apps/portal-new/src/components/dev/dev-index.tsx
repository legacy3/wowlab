import { CardCollection } from "@/components/common";
import { getGroupRoutes, routes } from "@/lib/routing";

const sections = getGroupRoutes(routes.dev).map((route) => ({
  description: route.description,
  route,
  title: route.label,
}));

export function DevIndex() {
  return <CardCollection items={sections} />;
}
