"use client";

import { css } from "styled-system/css";
import { Grid, Stack, styled } from "styled-system/jsx";

import type { Character, Item, Slot } from "@/lib/sim";

import { Avatar, Text } from "@/components/ui";

import { EquipmentSlot } from "./equipment-slot";

const LEFT_SLOTS: Slot[] = [
  "head",
  "neck",
  "shoulder",
  "back",
  "chest",
  "wrist",
];

const RIGHT_SLOTS: Slot[] = [
  "hands",
  "waist",
  "legs",
  "feet",
  "finger1",
  "finger2",
];

const TRINKET_SLOTS: Slot[] = ["trinket1", "trinket2"];
const WEAPON_SLOTS: Slot[] = ["main_hand", "off_hand"];

const dividerStyles = css({
  bg: "border",
  h: "px",
  my: "4",
  w: "full",
});

export interface EquipmentGridProps {
  character: Character;
  equipment: Item[];
}

export function EquipmentGrid({ character, equipment }: EquipmentGridProps) {
  return (
    <Stack gap="0">
      {/* Main 3-column grid */}
      <Grid columns={3} gap="3">
        {/* Left column */}
        <Stack gap="2">
          {LEFT_SLOTS.map((slot) => (
            <EquipmentSlot
              key={slot}
              slot={slot}
              itemId={getItemId(equipment, slot)}
              align="left"
            />
          ))}
        </Stack>

        {/* Center avatar */}
        <styled.div
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="center"
          gap="2"
        >
          <Avatar.Root size="2xl">
            <Avatar.Fallback
              initials={character.name.substring(0, 2).toUpperCase()}
            />
          </Avatar.Root>
          <styled.div
            display="flex"
            flexDir="column"
            alignItems="center"
            gap="0.5"
          >
            <Text textStyle="xs" fontWeight="semibold" color="fg.muted">
              {character.name}
            </Text>
            <Text textStyle="2xs" color="fg.subtle">
              {character.race} {character.class}
            </Text>
          </styled.div>
        </styled.div>

        {/* Right column */}
        <Stack gap="2">
          {RIGHT_SLOTS.map((slot) => (
            <EquipmentSlot
              key={slot}
              slot={slot}
              itemId={getItemId(equipment, slot)}
              align="right"
            />
          ))}
        </Stack>
      </Grid>

      <div className={dividerStyles} />

      {/* Trinkets */}
      <Grid columns={2} gap="3">
        {TRINKET_SLOTS.map((slot, i) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            itemId={getItemId(equipment, slot)}
            align={i === 0 ? "left" : "right"}
          />
        ))}
      </Grid>

      <div className={dividerStyles} />

      {/* Weapons */}
      <Grid columns={2} gap="3">
        {WEAPON_SLOTS.map((slot, i) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            itemId={getItemId(equipment, slot)}
            align={i === 0 ? "left" : "right"}
          />
        ))}
      </Grid>
    </Stack>
  );
}

function getItemId(equipment: Item[], slot: Slot): number | null {
  const item = equipment.find((i) => i.slot === slot);
  return item?.id ?? null;
}
