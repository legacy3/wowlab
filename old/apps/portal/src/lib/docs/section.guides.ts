import * as MdWritingRotations from "@/content/docs/guides/00-writing-rotations.md";
import * as MdSpecCoverage from "@/content/docs/guides/01-spec-coverage.md";

import { defineDocsSection, docPage } from "./builders";

export const guides = defineDocsSection({
  group: { slug: "guides", title: "Guides" },
  pages: [
    docPage("guides/00-writing-rotations", MdWritingRotations),
    docPage("guides/01-spec-coverage", MdSpecCoverage),
  ],
});
