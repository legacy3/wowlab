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
  { id: "class", label: "useClass" },
  { id: "classes-direct-list", label: "useClasses" },
  { id: "classes-and-specs", label: "useClassesAndSpecs" },
  { id: "global-colors", label: "useGlobalColors" },
  { id: "global-strings", label: "useGlobalStrings" },
  { id: "item", label: "useItem" },
  { id: "item-search", label: "useItemSearch" },
  { id: "spec", label: "useSpec" },
  { id: "specs-list", label: "useSpecs" },
  { id: "spell", label: "useSpell" },
  { id: "spell-search", label: "useSpellSearch" },
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
