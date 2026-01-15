"use client";

import { useState } from "react";
import { Grid, Stack, styled } from "styled-system/jsx";

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

import { fixtures, Section, Subsection } from "../../shared";

export function SimulateSection() {
  return (
    <Section id="simulate" title="Simulate">
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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Compact character header with external links to Raider.io and Armory.
        </styled.p>

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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Complete character panel with compact header and equipment grid.
        </styled.p>

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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Full equipment grid with character avatar in center. Left/right
          columns, trinkets, and weapons.
        </styled.p>

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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Single equipment slot with item icon, name, and item level. Supports
          left/right alignment and shows tooltip on hover.
        </styled.p>

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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Status indicators for parsing operations: loading, success, and error
          states.
        </styled.p>

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
        <styled.p color="fg.muted" textStyle="sm" mb="2">
          Monospace textarea with SimC-specific placeholder and dashed border.
        </styled.p>

        <SimcInput value={value} onChange={(e) => setValue(e.target.value)} />
      </Stack>
    </Subsection>
  );
}
