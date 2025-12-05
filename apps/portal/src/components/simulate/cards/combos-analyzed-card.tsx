import { useAtom } from "jotai";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { itemCombosAtom } from "@/atoms/sim";

const intl = {
  number: new Intl.NumberFormat("en-US"),
};

export function CombosAnalyzedCard() {
  const [itemCombos] = useAtom(itemCombosAtom);

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
