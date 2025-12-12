import type { SpecCoverageSpell } from "@/hooks/use-spec-coverage";

export interface SelectedSpec {
  classId: number;
  className: string;
  classColor: string;
  specId: number;
  specName: string;
  spells: SpecCoverageSpell[];
}
