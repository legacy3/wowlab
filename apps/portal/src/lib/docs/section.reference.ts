import * as MdArchitecture from "@/content/docs/reference/00-architecture.md";
import * as MdDataModel from "@/content/docs/reference/01-data-model.md";
import * as MdMcpServer from "@/content/docs/reference/02-mcp-server.md";
import * as MdBrowserCpuLimits from "@/content/docs/reference/03-browser-cpu-limits.md";

import { defineDocsSection, docPage } from "./builders";

export const reference = defineDocsSection({
  group: { slug: "reference", title: "Reference" },
  pages: [
    docPage("reference/00-architecture", MdArchitecture),
    docPage("reference/01-data-model", MdDataModel),
    docPage("reference/02-mcp-server", MdMcpServer),
    docPage("reference/03-browser-cpu-limits", MdBrowserCpuLimits),
  ],
});
