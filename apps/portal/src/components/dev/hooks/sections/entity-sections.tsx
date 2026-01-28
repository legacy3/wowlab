"use client";

import { useState } from "react";

import type { Class, Item, Spec, Spell } from "@/lib/supabase";

import { classes, items, specs, spells, useResource } from "@/lib/refine";

import { EntityDisplay } from "./entity-display";

type StateResult<T> = {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
};

export function ClassSection() {
  const [id, setId] = useState(1);
  const result = useResource<Class>({
    ...classes,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });

  return (
    <EntityDisplay
      description="Returns Class with name, color, and file info"
      id="class"
      inputId={id}
      nameField="name"
      onIdChange={setId}
      result={result as StateResult<Record<string, unknown>>}
      title="useResource + classes"
    />
  );
}

export function ItemSection() {
  const [id, setId] = useState(19019);
  const result = useResource<Item>({
    ...items,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });

  return (
    <EntityDisplay
      description="Returns Item with all item properties"
      id="item"
      inputId={id}
      nameField="name"
      onIdChange={setId}
      result={result as StateResult<Record<string, unknown>>}
      title="useResource + items"
    />
  );
}

export function SpecSection() {
  const [id, setId] = useState(62);
  const result = useResource<Spec>({
    ...specs,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });

  return (
    <EntityDisplay
      description="Returns Spec with class info, role, and icon"
      id="spec"
      inputId={id}
      nameField="name"
      onIdChange={setId}
      result={result as StateResult<Record<string, unknown>>}
      title="useResource + specs"
    />
  );
}

export function SpellSection() {
  const [id, setId] = useState(408);
  const result = useResource<Spell>({
    ...spells,
    id: id ?? "",
    queryOptions: { enabled: id != null },
  });

  return (
    <EntityDisplay
      description="Returns Spell with all spell properties"
      id="spell"
      inputId={id}
      nameField="name"
      onIdChange={setId}
      result={result as StateResult<Record<string, unknown>>}
      title="useResource + spells"
    />
  );
}
