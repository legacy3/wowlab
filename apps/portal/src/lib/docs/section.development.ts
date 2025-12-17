import * as MdContributing from "@/content/docs/development/00-contributing.md";

import { defineDocsSection, docPage } from "./builders";

export const development = defineDocsSection({
  group: { slug: "development", title: "Development" },
  pages: [docPage("development/00-contributing", MdContributing)],
});
