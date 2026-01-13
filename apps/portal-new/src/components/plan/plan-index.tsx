import { CardCollection } from "@/components/common";
import { getGroupRoutes, routes } from "@/lib/routing";

const sections = getGroupRoutes(routes.plan).map((route) => ({
  description: route.description,
  route,
  title: route.label,
}));

export function PlanIndex() {
  return <CardCollection items={sections} />;
}
