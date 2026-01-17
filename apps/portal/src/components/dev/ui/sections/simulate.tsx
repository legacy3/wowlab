"use client";

import { useState } from "react";
import { Grid, Stack } from "styled-system/jsx";

import {
  CharacterCard,
  CharacterPanel,
  EquipmentGrid,
  EquipmentSlot,
  ParseError,
  ParseLoading,
  ParseSuccess,
  SimcInput,
} from "@/components/simulate";

import { DemoDescription, fixtures, Section, Subsection } from "../../shared";

export function SimulateSection() {
  return (
    <Section id="simulate" title="Simulate" lazy>
      <Stack gap="8">
        <CharacterCardDemo />
        <EquipmentSlotDemo />
        <EquipmentGridDemo />
        <CharacterPanelDemo />
        <SimcInputDemo />
        <ParseStatusDemo />
      </Stack>
    </Section>
  );
}

function CharacterCardDemo() {
  return (
    <Subsection title="Character Card">
      <Stack gap="4" maxW="xl">
        <DemoDescription>
          Character name, realm, and spec with external links.
        </DemoDescription>

        <CharacterCard character={fixtures.character} />

        <CharacterCard
          character={fixtures.character}
          professions={fixtures.professions}
        />
      </Stack>
    </Subsection>
  );
}

function CharacterPanelDemo() {
  return (
    <Subsection title="Character Panel">
      <Stack gap="4" maxW="2xl">
        <DemoDescription>Full character view with gear.</DemoDescription>

        <CharacterPanel
          character={fixtures.character}
          professions={fixtures.professions}
          equipment={fixtures.equipment}
          onClear={() => {}}
        />
      </Stack>
    </Subsection>
  );
}

function EquipmentGridDemo() {
  return (
    <Subsection title="Equipment Grid">
      <Stack gap="4" maxW="2xl">
        <DemoDescription>Paperdoll-style equipment layout.</DemoDescription>

        <EquipmentGrid
          character={fixtures.character}
          equipment={fixtures.equipment}
        />
      </Stack>
    </Subsection>
  );
}

function EquipmentSlotDemo() {
  const headItem = fixtures.equipment.find((i) => i.slot === "head");
  const handsItem = fixtures.equipment.find((i) => i.slot === "hands");

  return (
    <Subsection title="Equipment Slot">
      <Stack gap="4" maxW="xl">
        <DemoDescription>
          Individual gear slot with item details.
        </DemoDescription>

        <Grid columns={2} gap="3">
          <EquipmentSlot
            slot="head"
            itemId={headItem?.id ?? null}
            align="left"
          />
          <EquipmentSlot
            slot="hands"
            itemId={handsItem?.id ?? null}
            align="right"
          />
        </Grid>

        <Grid columns={2} gap="3">
          <EquipmentSlot slot="off_hand" itemId={null} align="left" />
          <EquipmentSlot slot="trinket2" itemId={null} align="right" />
        </Grid>
      </Stack>
    </Subsection>
  );
}

function ParseStatusDemo() {
  return (
    <Subsection title="Parse Status">
      <Stack gap="4" maxW="xl">
        <DemoDescription>SimC parsing status indicators.</DemoDescription>

        <Stack gap="3">
          <ParseLoading message="Parsing SimC data..." />

          <ParseSuccess message="Character imported successfully" />

          <ParseError
            title="Failed to parse SimC export"
            error="Lexer error: Unexpected token at line 5, column 12"
          />
        </Stack>
      </Stack>
    </Subsection>
  );
}

function SimcInputDemo() {
  const [value, setValue] = useState("");

  return (
    <Subsection title="SimC Input">
      <Stack gap="4" maxW="2xl">
        <DemoDescription>Textarea for SimC string input.</DemoDescription>

        <SimcInput value={value} onChange={(e) => setValue(e.target.value)} />
      </Stack>
    </Subsection>
  );
}
