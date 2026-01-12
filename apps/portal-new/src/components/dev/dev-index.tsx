import { CardCollection } from "@/components/common";
import { routes } from "@/lib/routes";

const sections = [
  {
    description: "Park UI components with Panda CSS recipes",
    href: routes.dev.ui,
    title: "UI Components",
  },
  {
    description: "Game data hooks for spells, items, classes, and specs",
    href: routes.dev.data,
    title: "Game Data",
  },
];

export function DevIndex() {
  return <CardCollection items={sections} />;
}
