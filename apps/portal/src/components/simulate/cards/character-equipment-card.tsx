// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom } from "jotai";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CharacterSummaryCard } from "@/components/equipment";
import { ResultsEquipment } from "@/components/simulate/results-equipment";
// TODO(refine-migration): These atoms were deleted - need to implement with Refine
// import { characterAtom, professionsAtom, itemCombosAtom } from "@/atoms/sim";

const intl = {
  number: new Intl.NumberFormat("en-US"),
};

export function CharacterEquipmentCard() {
  // TODO(refine-migration): Replace with Refine hooks
  // const [character] = useAtom(characterAtom);
  // const [professions] = useAtom(professionsAtom);
  // const [itemCombos] = useAtom(itemCombosAtom);

  // Temporary placeholder data until Refine migration
  const character = {
    name: "",
    race: "",
    class: "",
    level: 80,
    region: "",
    server: "",
  };
  const professions: { name: string; rank: number }[] = [];
  const itemCombos: { dps: number; gain: number }[] = [];

  const topCombo = itemCombos[0] ?? null;
  const baselineDps =
    topCombo !== null ? Math.max(topCombo.dps - topCombo.gain, 0) : null;

  return (
    <Card>
      <CardHeader>
        <CharacterSummaryCard
          character={character}
          professions={professions}
          rightContent={
            topCombo ? (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Best DPS
                </span>
                <span className="text-sm font-bold text-primary">
                  {intl.number.format(topCombo.dps)}
                </span>
                {baselineDps !== null ? (
                  <span className="text-[10px] text-muted-foreground">
                    +{intl.number.format(topCombo.gain)} vs baseline
                  </span>
                ) : null}
              </div>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent>
        <ResultsEquipment />
      </CardContent>
    </Card>
  );
}
