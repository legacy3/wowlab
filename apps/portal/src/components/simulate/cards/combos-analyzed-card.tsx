// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom } from "jotai";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// TODO(refine-migration): itemCombosAtom deleted - implement with Refine
// import { itemCombosAtom } from "@/atoms/sim";

const intl = {
  number: new Intl.NumberFormat("en-US"),
};

export function CombosAnalyzedCard() {
  // TODO(refine-migration): Replace with Refine hooks
  // const [itemCombos] = useAtom(itemCombosAtom);
  const itemCombos: unknown[] = [];

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Combos Analyzed
        </CardDescription>
        <CardTitle className="text-xl">
          {intl.number.format(itemCombos.length)}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
