import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResultsCombos } from "@/components/simulate/results-combos";

export function ItemCombosCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Top Item Combos</CardTitle>
        <CardDescription>Best gear combinations from your bags</CardDescription>
      </CardHeader>
      <CardContent>
        <ResultsCombos />
      </CardContent>
    </Card>
  );
}
