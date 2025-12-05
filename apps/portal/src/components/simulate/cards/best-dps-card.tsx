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

export function BestDpsCard() {
  const [itemCombos] = useAtom(itemCombosAtom);
  const topCombo = itemCombos[0] ?? null;

  if (!topCombo) {
    return null;
  }

  return (
    <Card className="border-green-500/25 bg-green-500/5">
      <CardHeader className="space-y-1">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Best DPS
        </CardDescription>
        <CardTitle className="text-xl">
          {intl.number.format(topCombo.dps)} DPS
        </CardTitle>
        <p className="text-xs text-muted-foreground">Combo #{topCombo.rank}</p>
      </CardHeader>
    </Card>
  );
}
