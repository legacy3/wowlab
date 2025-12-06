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
  percent: new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }),
};

function formatPercent(value: number) {
  return `${intl.percent.format(value)}%`;
}

export function AvgGainCard() {
  const [itemCombos] = useAtom(itemCombosAtom);

  const averageGain =
    itemCombos.length > 0
      ? itemCombos.reduce((total, combo) => total + combo.gain, 0) /
        itemCombos.length
      : null;
  const averageGainPercent =
    itemCombos.length > 0
      ? itemCombos.reduce((total, combo) => total + combo.gainPercent, 0) /
        itemCombos.length
      : null;

  if (averageGain === null) {
    return null;
  }

  return (
    <Card className="border-green-500/25 bg-green-500/5">
      <CardHeader className="space-y-1">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Avg Gain
        </CardDescription>
        <CardTitle className="text-xl">
          +{intl.number.format(Math.round(averageGain))} DPS
        </CardTitle>
        {averageGainPercent !== null ? (
          <p className="text-xs text-muted-foreground">
            ~{formatPercent(averageGainPercent)} average
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
