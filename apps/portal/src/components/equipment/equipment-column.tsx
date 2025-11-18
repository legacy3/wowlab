import type { EquipmentSlot } from "./slots";
import type { EquipmentSlotItem } from "./equipment-slot-card";

import { EquipmentSlotCard } from "./equipment-slot-card";

type EquipmentColumnProps = {
  gear: Record<EquipmentSlot, EquipmentSlotItem | null | undefined>;
  position?: "left" | "right";
  showUpgradeBadge?: boolean;
  slots: ReadonlyArray<EquipmentSlot>;
};

export function EquipmentColumn({
  gear,
  position = "left",
  showUpgradeBadge = false,
  slots,
}: EquipmentColumnProps) {
  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <EquipmentSlotCard
          key={slot}
          slot={slot}
          item={gear[slot] ?? null}
          position={position}
          showUpgradeBadge={showUpgradeBadge}
        />
      ))}
    </div>
  );
}
