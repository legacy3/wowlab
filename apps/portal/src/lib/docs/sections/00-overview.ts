import * as MdOverview from "@/content/docs/00-overview.md";

import { defineDocsSection, docPage } from "../builders";

export const overview = defineDocsSection({
  pages: [docPage("00-overview", MdOverview)],
});
