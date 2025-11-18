import * as Effect from "effect/Effect";

import type { EnumDefinition, SourceMetadata } from "./types";

export const generateTypeScriptEnum = (
  enumDef: EnumDefinition,
  metadata: SourceMetadata,
): Effect.Effect<string> =>
  Effect.sync(() => {
    const lines: string[] = [
      `import * as Schema from "effect/Schema";`,
      ``,
      `/**`,
      ` * Auto-generated from World of Warcraft ${metadata.version}`,
      ` * Source: ${metadata.url}`,
      ` */`,
      ``,
      `/* eslint-disable perfectionist/sort-enums */`,
      `export enum ${enumDef.Name} {`,
    ];

    for (const field of enumDef.Fields) {
      lines.push(`  ${field.Name} = ${field.EnumValue},`);
    }

    lines.push(
      `}`,
      ``,
      `export const ${enumDef.Name}Schema = Schema.Enums(${enumDef.Name});`,
      ``,
    );

    return lines.join("\n");
  });

export const generateIndexFile = (enumNames: string[]): Effect.Effect<string> =>
  Effect.sync(() => {
    const sortedNames = [...enumNames].sort();
    return (
      sortedNames.map((name) => `export * from "./${name}";`).join("\n") + "\n"
    );
  });
