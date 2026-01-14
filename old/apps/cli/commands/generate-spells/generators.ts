import { camelCase } from "change-case";

import type { SpecSpellMap } from "./types";

import { AUTOGEN_BANNER } from "./config";

export const buildSpecSpellListFile = (spec: SpecSpellMap): string => {
  const nameCount = new Map<string, number>();
  const recordEntries = spec.spells
    .map((spell) => {
      const count = nameCount.get(spell.normalizedName) ?? 0;
      nameCount.set(spell.normalizedName, count + 1);

      const key =
        count > 0
          ? `${spell.normalizedName}_${count + 1}`
          : spell.normalizedName;

      return `  "${key}": SpellID(${spell.spellId})`;
    })
    .join(",\n");

  return [
    AUTOGEN_BANNER,
    `import { SpellID } from "@schemas/index.js";`,
    "",
    `export const classId = "${spec.classId}" as const;`,
    `export const className = "${spec.className}" as const;`,
    `export const specId = "${spec.specId}" as const;`,
    `export const specName = "${spec.specName}" as const;`,
    "",
    `export const spellList = {\n${recordEntries},\n} as const satisfies Record<string, Branded.SpellID>;`,
    "",
  ].join("\n");
};

export const buildManifestFile = (
  specs: ReadonlyArray<SpecSpellMap>,
): string => {
  const importLines: string[] = [];
  const manifestEntries: string[] = [];

  for (const spec of specs) {
    const identifier = camelCase(`${spec.classSlug}-${spec.specSlug}`);
    const importPath = `./${spec.classSlug}/${spec.specSlug}/spellList.js`;

    importLines.push(
      `import { classId as classId_${identifier}, className as className_${identifier}, specId as specId_${identifier}, specName as specName_${identifier}, spellList as spellList_${identifier} } from "${importPath}";`,
    );

    manifestEntries.push(
      [
        "  {",
        `    classId: classId_${identifier},`,
        `    className: className_${identifier},`,
        `    specId: specId_${identifier},`,
        `    specName: specName_${identifier},`,
        `    spellList: spellList_${identifier},`,
        "  },",
      ].join("\n"),
    );
  }

  return [
    AUTOGEN_BANNER,
    `import type { SpecSpellList } from "./types.js";`,
    ...importLines,
    "",
    "export const SPEC_SPELL_LISTS: readonly SpecSpellList[] = [",
    ...manifestEntries,
    "] as const;",
    "",
  ].join("\n");
};
