"use client";

import { PageLayout } from "../shared";
import {
  ClassesAndSpecsSection,
  ClassesListSection,
  ClassSection,
  ItemSearchSection,
  ItemSection,
  SpecSection,
  SpecsListSection,
  SpellSearchSection,
  SpellSection,
} from "./sections";

const NAV = [
  { id: "spell", label: "useSpell" },
  { id: "item", label: "useItem" },
  { id: "class", label: "useClass" },
  { id: "spec", label: "useSpec" },
  { id: "classes-list", label: "useClasses" },
  { id: "specs-list", label: "useSpecs" },
  { id: "classes-and-specs", label: "useClassesAndSpecs" },
  { id: "spell-search", label: "useSpellSearch" },
  { id: "item-search", label: "useItemSearch" },
];

export function DataDemo() {
  return (
    <PageLayout nav={NAV}>
      <SpellSection />
      <ItemSection />
      <ClassSection />
      <SpecSection />
      <ClassesListSection />
      <SpecsListSection />
      <ClassesAndSpecsSection />
      <SpellSearchSection />
      <ItemSearchSection />
    </PageLayout>
  );
}
