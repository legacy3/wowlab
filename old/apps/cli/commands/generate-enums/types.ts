export interface EnumDefinition {
  Fields: EnumField[];
  Name: string;
  Type: string;
}

export interface EnumField {
  EnumValue: number;
  Name: string;
}

export interface SourceMetadata {
  commit: string;
  url: string;
  version: string;
}
