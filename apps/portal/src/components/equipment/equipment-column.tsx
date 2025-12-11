import type { EquipmentSlot } from "./slots";
import { EquipmentSlotCard } from "./equipment-slot-card";

type EquipmentColumnProps = {
  gear: Record<EquipmentSlot, number | null>;
  position?: "left" | "right";
  slots: ReadonlyArray<EquipmentSlot>;
};

export function EquipmentColumn({
  gear,
  position = "left",
  slots,
}: EquipmentColumnProps) {
  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <EquipmentSlotCard
          key={slot}
          slot={slot}
          itemId={gear[slot]}
          position={position}
        />
      ))}
    </div>
  );
}
