import { CardCollection } from "@/components/common";
import { getGroupRoutes, routes } from "@/lib/routing";

const sections = getGroupRoutes(routes.rotations).map((route) => ({
  description: route.description,
  route,
  title: route.label,
}));

export function RotationsIndex() {
  return <CardCollection items={sections} />;
}
