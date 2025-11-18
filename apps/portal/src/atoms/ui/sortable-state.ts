import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { List } from "immutable";

import type { TabSectionLayout } from "@/types/ui";

export const sectionOrderAtom = atomWithStorage<string[]>(
  "sortable-section-order",
  [],
);

export const sectionVisibilityAtom = atomWithStorage<Record<string, boolean>>(
  "sortable-section-visibility",
  {},
);

export const sectionsAtom = atom<List<TabSectionLayout>>((get) => {
  const order = get(sectionOrderAtom);
  const visibility = get(sectionVisibilityAtom);

  // Example: Create sections from your data
  // You would typically fetch this from your actual data source
  const sections = order.map((id, index) => ({
    id,
    title: id, // Replace with actual title lookup
    visible: visibility[id] ?? true,
    order: index,
    keepAlive: false,
  }));

  return List<TabSectionLayout>(sections);
});

export const updateSectionOrderAtom = atom(
  null,
  (get, set, sections: List<TabSectionLayout>) => {
    const newOrder = sections.map((s) => s.id).toArray();
    set(sectionOrderAtom, newOrder);
  },
);

export const toggleSectionVisibilityAtom = atom(
  null,
  (get, set, sectionId: string) => {
    const currentVisibility = get(sectionVisibilityAtom);
    set(sectionVisibilityAtom, {
      ...currentVisibility,
      [sectionId]: !(currentVisibility[sectionId] ?? true),
    });
  },
);
