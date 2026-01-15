"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import type {
  Aura,
  Class,
  GlobalColor,
  GlobalString,
  Item,
  ItemSummary,
  Spec,
  SpecSummary,
  SpecTraits,
  Spell,
  SpellSummary,
} from "@/lib/supabase/types";

import { createClient } from "@/lib/supabase";

export function useAura(spellId: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: spellId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("auras")
        .select("*")
        .eq("spell_id", spellId!)
        .single();
      if (error) throw error;
      return data as Aura;
    },
    queryKey: ["game", "aura", spellId],
  });
}

export function useClass(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("classes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Class;
    },
    queryKey: ["game", "class", id],
  });
}

export function useClasses() {
  const supabase = createClient();

  return useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("classes")
        .select("*")
        .order("id");
      if (error) throw error;
      return (data ?? []) as Class[];
    },
    queryKey: ["game", "classes"],
  });
}

export function useClassesAndSpecs() {
  const { data: specs = [], isLoading: specsLoading } = useSpecs();
  const { data: classesData = [], isLoading: classesLoading } = useClasses();

  const isLoading = specsLoading || classesLoading;

  // Build a map of class_id -> class data for quick lookup
  const classMap = useMemo(() => {
    const map = new Map<number, Class>();
    for (const cls of classesData) {
      map.set(cls.id, cls);
    }
    return map;
  }, [classesData]);

  const classes = useMemo(() => {
    return classesData
      .map((cls) => ({
        color: cls.color ?? "",
        fileName: cls.file_name,
        id: cls.id,
        label: cls.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [classesData]);

  const getClassColor = useCallback(
    (specId: number) => {
      const spec = specs.find((s) => s.id === specId);
      if (!spec) return null;
      const cls = classMap.get(spec.class_id);
      return cls?.color ?? null;
    },
    [specs, classMap],
  );

  const getSpecIdsForClass = useCallback(
    (classId: number) => {
      return specs.filter((s) => s.class_id === classId).map((s) => s.id);
    },
    [specs],
  );

  const getSpecLabel = useCallback(
    (specId: number) => {
      const spec = specs.find((s) => s.id === specId);
      return spec?.name ?? null;
    },
    [specs],
  );

  const getSpecIcon = useCallback(
    (specId: number) => {
      const spec = specs.find((s) => s.id === specId);
      if (!spec) return null;
      return spec.file_name ?? null;
    },
    [specs],
  );

  return {
    classes,
    getClassColor,
    getSpecIcon,
    getSpecIdsForClass,
    getSpecLabel,
    isLoading,
    specs,
  };
}

export function useGlobalColors<T extends string[]>(...names: T) {
  const supabase = createClient();

  const { data = [] } = useQuery({
    enabled: names.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("global_colors")
        .select("*")
        .in("name", names);
      if (error) throw error;
      return (data ?? []) as GlobalColor[];
    },
    queryKey: ["game", "global-colors", names],
  });

  return names.map((name) => data.find((c) => c.name === name)) as {
    [K in keyof T]: GlobalColor | undefined;
  };
}

export function useGlobalStrings<T extends string[]>(...tags: T) {
  const supabase = createClient();

  const { data = [] } = useQuery({
    enabled: tags.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("global_strings")
        .select("*")
        .in("tag", tags);
      if (error) throw error;
      return (data ?? []) as GlobalString[];
    },
    queryKey: ["game", "global-strings", tags],
  });

  return tags.map((tag) => data.find((s) => s.tag === tag)) as {
    [K in keyof T]: GlobalString | undefined;
  };
}

export function useItem(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Item;
    },
    queryKey: ["game", "item", id],
  });
}

export function useItems(ids: number[]) {
  const supabase = createClient();

  return useQuery({
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("items")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as Item[];
    },
    queryKey: ["game", "items", ids],
  });
}

export function useItemSearch(query: string) {
  const supabase = createClient();

  return useQuery({
    enabled: query.length > 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("items")
        .select("id, name, item_level, quality, file_name")
        .ilike("name", `%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ItemSummary[];
    },
    queryKey: ["game", "item-search", query],
  });
}

export function useSpec(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("specs")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Spec;
    },
    queryKey: ["game", "spec", id],
  });
}

export function useSpecs() {
  const supabase = createClient();

  return useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("specs")
        .select("id, name, class_name, class_id, file_name")
        .order("class_name")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as SpecSummary[];
    },
    queryKey: ["game", "specs"],
  });
}

export function useSpecsByClass(classId: number) {
  const supabase = createClient();

  return useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("specs")
        .select("*")
        .eq("class_id", classId)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Spec[];
    },
    queryKey: ["game", "specs", "class", classId],
  });
}

export function useSpecTraits(specId: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: specId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("specs_traits")
        .select("*")
        .eq("spec_id", specId!)
        .single();
      if (error) throw error;
      return data as SpecTraits;
    },
    queryKey: ["game", "spec-traits", specId],
  });
}

export function useSpell(id: number | null | undefined) {
  const supabase = createClient();

  return useQuery({
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("spells")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Spell;
    },
    queryKey: ["game", "spell", id],
  });
}

export function useSpells(ids: number[]) {
  const supabase = createClient();

  return useQuery({
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("spells")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as Spell[];
    },
    queryKey: ["game", "spells", ids],
  });
}

export function useSpellSearch(query: string) {
  const supabase = createClient();

  return useQuery({
    enabled: query.length > 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("game")
        .from("spells")
        .select("id, name, file_name")
        .ilike("name", `%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data ?? []) as SpellSummary[];
    },
    queryKey: ["game", "spell-search", query],
  });
}
