import * as MdModuleStructure from "@/content/docs/engine/00-module-structure.md";
import * as MdEventSystem from "@/content/docs/engine/01-event-system.md";
import * as MdJitCompiler from "@/content/docs/engine/02-jit-compiler.md";
import * as MdSpecHandlers from "@/content/docs/engine/03-spec-handlers.md";
import * as MdTypeSystem from "@/content/docs/engine/04-type-system.md";
import * as MdKnownIssues from "@/content/docs/engine/05-known-issues.md";
import * as MdDesignDecisions from "@/content/docs/engine/06-design-decisions.md";

import { defineDocsSection, docPage } from "../builders";

export const engine = defineDocsSection({
  group: { slug: "engine", title: "Engine Internals" },
  pages: [
    docPage("engine/00-module-structure", MdModuleStructure),
    docPage("engine/01-event-system", MdEventSystem),
    docPage("engine/02-jit-compiler", MdJitCompiler),
    docPage("engine/03-spec-handlers", MdSpecHandlers),
    docPage("engine/04-type-system", MdTypeSystem),
    docPage("engine/05-known-issues", MdKnownIssues),
    docPage("engine/06-design-decisions", MdDesignDecisions),
  ],
});
