import * as MdSystemArchitecture from "@/content/docs/reference/00-system-architecture.md";
import * as MdSimulationOverview from "@/content/docs/reference/01-simulation-overview.md";
import * as MdRotationReference from "@/content/docs/reference/02-rotation-reference.md";
import * as MdDamageSystem from "@/content/docs/reference/03-damage-system.md";
import * as MdStatsResources from "@/content/docs/reference/04-stats-resources.md";
import * as MdAurasProcs from "@/content/docs/reference/05-auras-procs.md";
import * as MdDataModel from "@/content/docs/reference/06-data-model.md";
import * as MdMcpServer from "@/content/docs/reference/07-mcp-server.md";

import { defineDocsSection, docPage } from "../builders";

export const reference = defineDocsSection({
  group: { slug: "reference", title: "Reference" },
  pages: [
    docPage("reference/00-system-architecture", MdSystemArchitecture),
    docPage("reference/01-simulation-overview", MdSimulationOverview),
    docPage("reference/02-rotation-reference", MdRotationReference),
    docPage("reference/03-damage-system", MdDamageSystem),
    docPage("reference/04-stats-resources", MdStatsResources),
    docPage("reference/05-auras-procs", MdAurasProcs),
    docPage("reference/06-data-model", MdDataModel),
    docPage("reference/07-mcp-server", MdMcpServer),
  ],
});
