"use client";

import { useAtom } from "jotai";
import { Package, User } from "lucide-react";

import {
  EquipmentColumn,
  EquipmentSlotCard,
  EQUIPMENT_LEFT_COLUMN,
  EQUIPMENT_RIGHT_COLUMN,
  EQUIPMENT_TRINKET_SLOTS,
  EQUIPMENT_WEAPON_SLOTS,
} from "@/components/equipment";
import { Separator } from "@/components/ui/separator";
import {
  characterAtom,
  gearAtom,
  slotAlternativesAtom,
} from "@/atoms/sim/results";

export function ResultsEquipment() {
  const [character] = useAtom(characterAtom);
  const [gear] = useAtom(gearAtom);
  const [slotAlternatives] = useAtom(slotAlternativesAtom);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <EquipmentColumn
          gear={gear}
          position="left"
          showUpgradeBadge
          slots={EQUIPMENT_LEFT_COLUMN}
        />

        <div className="flex items-center justify-center">
          <div className="h-32 w-32 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <User className="mx-auto mb-1 h-8 w-8" />
              <p className="text-[11px] font-semibold">{character.name}</p>
              <p className="text-[9px]">
                {character.race} {character.class}
              </p>
            </div>
          </div>
        </div>

        <EquipmentColumn
          gear={gear}
          position="right"
          showUpgradeBadge
          slots={EQUIPMENT_RIGHT_COLUMN}
        />
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT_TRINKET_SLOTS.map((slot, index) => (
          <EquipmentSlotCard
            key={slot}
            slot={slot}
            item={gear[slot]}
            position={index === 0 ? "left" : "right"}
            showUpgradeBadge
            alternatives={slotAlternatives[slot]}
          />
        ))}
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT_WEAPON_SLOTS.map((slot, index) => {
          const position = index === 0 ? "left" : "right";
          const item = gear[slot];
          const isOffHand = slot === "offHand";

          return (
            <EquipmentSlotCard
              key={slot}
              slot={slot}
              item={item}
              position={position}
              emptyIcon={
                isOffHand ? (
                  <Package className="h-4 w-4 text-muted-foreground" />
                ) : undefined
              }
              showUpgradeBadge
              alternatives={slotAlternatives[slot]}
            />
          );
        })}
      </div>
    </>
  );
}
