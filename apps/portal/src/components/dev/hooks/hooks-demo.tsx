"use client";

import { PageLayout } from "../shared";
import {
  ClassesAndSpecsSection,
  ClassesDirectListSection,
  ClassSection,
  GlobalColorsSection,
  GlobalStringsSection,
  ItemSearchSection,
  ItemSection,
  SpecSection,
  SpecsListSection,
  SpellSearchSection,
  SpellSection,
} from "./sections";

const NAV = [
  { id: "class", label: "useResource + classes" },
  { id: "classes-direct-list", label: "useResourceList + classes" },
  { id: "classes-and-specs", label: "useClassesAndSpecs" },
  { id: "global-colors", label: "useGlobalColors" },
  { id: "global-strings", label: "useGlobalStrings" },
  { id: "item", label: "useResource + items" },
  { id: "item-search", label: "useResourceList + items" },
  { id: "spec", label: "useResource + specs" },
  { id: "specs-list", label: "useResourceList + specs" },
  { id: "spell", label: "useResource + spells" },
  { id: "spell-search", label: "useResourceList + spells" },
];

export function HooksDemo() {
  return (
    <PageLayout nav={NAV}>
      <ClassSection />
      <ClassesDirectListSection />
      <ClassesAndSpecsSection />
      <GlobalColorsSection />
      <GlobalStringsSection />
      <ItemSection />
      <ItemSearchSection />
      <SpecSection />
      <SpecsListSection />
      <SpellSection />
      <SpellSearchSection />
    </PageLayout>
  );
}
