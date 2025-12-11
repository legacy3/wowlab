"use client";

import { Package, User } from "lucide-react";

import {
  EquipmentColumn,
  EquipmentSlotCard,
  EQUIPMENT_LEFT_COLUMN,
  EQUIPMENT_RIGHT_COLUMN,
  EQUIPMENT_TRINKET_SLOTS,
  EQUIPMENT_WEAPON_SLOTS,
  type EquipmentSlot,
} from "@/components/equipment";
import { Separator } from "@/components/ui/separator";

type Gear = Record<EquipmentSlot, number | null>;

export function ResultsEquipment() {
  // TODO: Replace with actual data from simulation results
  const character = { name: "", race: "", class: "" };
  const gear = {} as Gear;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <EquipmentColumn
          gear={gear}
          position="left"
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
          slots={EQUIPMENT_RIGHT_COLUMN}
        />
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT_TRINKET_SLOTS.map((slot, index) => (
          <EquipmentSlotCard
            key={slot}
            slot={slot}
            itemId={gear[slot]}
            position={index === 0 ? "left" : "right"}
          />
        ))}
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-3">
        {EQUIPMENT_WEAPON_SLOTS.map((slot, index) => {
          const position = index === 0 ? "left" : "right";
          const isOffHand = slot === "offHand";

          return (
            <EquipmentSlotCard
              key={slot}
              slot={slot}
              itemId={gear[slot]}
              position={position}
              emptyIcon={
                isOffHand ? (
                  <Package className="h-4 w-4 text-muted-foreground" />
                ) : undefined
              }
            />
          );
        })}
      </div>
    </>
  );
}
