import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routing";

const sections = [
  {
    description: "Park UI components with Panda CSS recipes",
    route: routes.dev.ui,
    title: "UI Components",
  },
  {
    description: "Game data hooks for spells, items, classes, and specs",
    route: routes.dev.data,
    title: "Game Data",
  },
];

export function DevIndex() {
  return <CardCollection items={sections} />;
}
