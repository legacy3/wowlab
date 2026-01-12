"use client";

import { useState } from "react";

import type { StateResult } from "@/lib/state";

import { useClass, useItem, useSpec, useSpell } from "@/lib/state";

import { EntityDisplay } from "./entity-display";

interface EntitySectionConfig<T> {
  defaultId: number;
  description: string;
  id: string;
  nameField: keyof T;
  title: string;
  useHook: (id: number) => StateResult<T>;
}

function createEntitySection<T extends Record<string, unknown>>(
  config: EntitySectionConfig<T>,
) {
  return function EntitySection() {
    const [id, setId] = useState(config.defaultId);
    const result = config.useHook(id);

    return (
      <EntityDisplay
        description={config.description}
        id={config.id}
        inputId={id}
        nameField={config.nameField}
        onIdChange={setId}
        result={result}
        title={config.title}
      />
    );
  };
}

export const SpellSection = createEntitySection({
  defaultId: 408,
  description: "Returns SpellDataFlat with all spell properties flattened",
  id: "spell",
  nameField: "name",
  title: "useSpell",
  useHook: useSpell,
});

export const ItemSection = createEntitySection({
  defaultId: 19019,
  description: "Returns ItemDataFlat with all item properties flattened",
  id: "item",
  nameField: "name",
  title: "useItem",
  useHook: useItem,
});

export const ClassSection = createEntitySection({
  defaultId: 1,
  description: "Returns class data with specs, colors, and metadata",
  id: "class",
  nameField: "name",
  title: "useClass",
  useHook: useClass,
});

export const SpecSection = createEntitySection({
  defaultId: 62,
  description: "Returns spec data with class info, role, and icon",
  id: "spec",
  nameField: "name",
  title: "useSpec",
  useHook: useSpec,
});
