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

export function BaselineDpsCard() {
  const [itemCombos] = useAtom(itemCombosAtom);
  const topCombo = itemCombos[0] ?? null;
  const baselineDps =
    topCombo !== null ? Math.max(topCombo.dps - topCombo.gain, 0) : null;

  if (baselineDps === null) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Baseline DPS
        </CardDescription>
        <CardTitle className="text-xl">
          {intl.number.format(baselineDps)} DPS
        </CardTitle>
        <p className="text-xs text-muted-foreground">Current equipped setup</p>
      </CardHeader>
    </Card>
  );
}
