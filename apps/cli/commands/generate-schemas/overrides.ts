export type FieldType = string;

export const GLOBAL_SUFFIX_OVERRIDES: Record<string, FieldType> = {
  _lang: "nullOrString",
};

export const TABLE_FIELD_OVERRIDES: Record<
  string,
  Record<string, FieldType>
> = {
  ChrClasses: {
    Filename: "nullOrString",
    PetNameToken: "nullOrString",
  },
  ChrRaces: {
    ClientFileString: "nullOrString",
    ClientPrefix: "nullOrString",
  },
  Difficulty: {
    Field_1_15_4_56400_013: "optional",
    Name_lang: "string",
  },
  ItemEffect: {
    SpellID: "Branded.SpellIDSchema",
  },
  ManifestInterfaceData: {
    FileName: "string",
    FilePath: "string",
  },
  Spell: {
    ID: "Branded.SpellIDSchema",
  },
  SpellAuraOptions: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellAuraRestrictions: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellCastingRequirements: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellCategories: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellCategory: {
    Name_lang: "Schema.optional(Schema.String)",
  },
  SpellCooldowns: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellDescriptionVariables: {
    Variables: "string",
  },
  SpellEffect: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellEmpower: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellInterrupts: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellLearnSpell: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellLevels: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellMisc: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellName: {
    ID: "Branded.SpellIDSchema",
    Name_lang: "string",
  },
  SpellRange: {
    DisplayName_lang: "optionalString",
    DisplayNameShort_lang: "optionalString",
  },
  SpellReplacement: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellShapeshift: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellShapeshiftForm: {
    Name_lang: "string",
  },
  SpellTargetRestrictions: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellTotems: {
    SpellID: "Branded.SpellIDSchema",
  },
  SpellXDescriptionVariables: {
    SpellID: "Branded.SpellIDSchema",
  },
};

export function fieldTypeToSchemaCode(type: FieldType | null): string {
  switch (type) {
    case null:
      return "Schema.NumberFromString";

    case "nullOrString":
      return "Schema.NullOr(Schema.String)";

    case "optional":
      return "Schema.optional(Schema.NumberFromString)";

    case "optionalString":
      return "Schema.optional(Schema.String)";

    case "string":
      return "Schema.String";

    default:
      // Custom schema code - use as-is
      return type;
  }
}

export function getFieldType(
  tableName: string,
  fieldName: string,
): FieldType | null {
  // Check table-specific overrides first
  const tableOverrides = TABLE_FIELD_OVERRIDES[tableName];
  if (tableOverrides && fieldName in tableOverrides) {
    return tableOverrides[fieldName];
  }

  // Check global suffix patterns
  for (const [suffix, type] of Object.entries(GLOBAL_SUFFIX_OVERRIDES)) {
    if (fieldName.endsWith(suffix)) {
      return type;
    }
  }

  return null;
}

export function needsBrandedImport(tableName: string): boolean {
  const overrides = TABLE_FIELD_OVERRIDES[tableName];
  if (!overrides) {
    return false;
  }

  return Object.values(overrides).some((v) => v.startsWith("Branded."));
}
