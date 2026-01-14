"use client";

import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { Schemas } from "@wowlab/core";

type ChrClass = Schemas.Dbc.ChrClassesRow;
type ChrSpecialization = Schemas.Dbc.ChrSpecializationRow;
type ManifestInterfaceData = Schemas.Dbc.ManifestInterfaceDataRow;

/**
 * Specialization with resolved icon filename from manifest_interface_data.
 */
export type SpecWithIcon = ChrSpecialization & { iconName: string };

const LIST_CONFIG = {
  pagination: { mode: "off" as const },
  meta: { schema: "raw_dbc", idColumnName: "ID" },
};

function filterPlayableClasses(classes: ChrClass[]): ChrClass[] {
  return classes.filter((c) => c.ID !== 14 && c.ID !== 15 && c.Name_lang);
}

function filterPlayableSpecs(specs: ChrSpecialization[]): ChrSpecialization[] {
  return specs.filter((s) => s.Name_lang && s.Name_lang !== "Initial");
}

function extractUniqueIconFileIds(specs: ChrSpecialization[]): number[] {
  return Array.from(
    new Set(
      specs
        .map((s) => s.SpellIconFileID)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  );
}

// TODO Move this to an extractor
function buildIconMap(
  manifestData: ManifestInterfaceData[],
): Map<number, string> {
  const map = new Map<number, string>();

  for (const item of manifestData) {
    if (item.ID && item.FileName) {
      const iconName = item.FileName.toLowerCase().replace(".blp", "");
      map.set(item.ID, iconName);
    }
  }

  return map;
}

function enrichSpecsWithIcons(
  specs: ChrSpecialization[],
  iconMap: Map<number, string>,
): SpecWithIcon[] {
  return specs.map((spec) => ({
    ...spec,
    iconName: iconMap.get(spec.SpellIconFileID!) ?? "inv_misc_questionmark",
  }));
}

function sortByName<T extends { Name_lang: string | null }>(items: T[]): T[] {
  return items.sort((a, b) => a.Name_lang!.localeCompare(b.Name_lang!));
}

export function useClassesAndSpecs() {
  const classes = useList<ChrClass>({
    resource: "chr_classes",
    ...LIST_CONFIG,
  });

  const specs = useList<ChrSpecialization>({
    resource: "chr_specialization",
    ...LIST_CONFIG,
  });

  const filteredClasses = filterPlayableClasses(classes.result?.data || []);
  const filteredSpecs = filterPlayableSpecs(specs.result?.data || []);

  const specIconFileIds = useMemo(
    () => extractUniqueIconFileIds(filteredSpecs),
    [filteredSpecs],
  );

  const iconManifest = useList<ManifestInterfaceData>({
    resource: "manifest_interface_data",
    ...LIST_CONFIG,
    queryOptions: {
      enabled: specIconFileIds.length > 0,
    },
    filters: [
      {
        field: "ID",
        operator: "in",
        value: specIconFileIds,
      },
    ],
  });

  const iconMap = useMemo(
    () => buildIconMap(iconManifest.result?.data || []),
    [iconManifest.result?.data],
  );

  const specsWithIcons = useMemo(
    () => enrichSpecsWithIcons(filteredSpecs, iconMap),
    [filteredSpecs, iconMap],
  );

  const sortedClasses = useMemo(
    () => sortByName(filteredClasses),
    [filteredClasses],
  );

  const sortedSpecs = useMemo(
    () => sortByName(specsWithIcons),
    [specsWithIcons],
  );

  return {
    classes: {
      ...classes,
      result: { ...classes.result, data: sortedClasses },
    },
    specs: {
      ...specs,
      query: {
        ...specs.query,
        isLoading: specs.query.isLoading || iconManifest.query.isLoading,
      },
      result: { ...specs.result, data: sortedSpecs },
    },
  };
}
