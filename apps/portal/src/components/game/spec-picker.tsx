"use client";

import { ChevronDownIcon, ChevronLeftIcon } from "lucide-react";
import { useState } from "react";
import { Flex, Grid, HStack, styled, VStack } from "styled-system/jsx";

import type { SpecSummary } from "@/lib/supabase";

import { Card, Skeleton, Text } from "@/components/ui";
import { useClassesAndSpecs } from "@/lib/state";

import { GameIcon } from "./game-icon";

interface ClassGridProps {
  classes: Array<{
    color: string;
    fileName: string | null;
    id: number;
    label: string;
  }>;
  onSelect: (classId: number) => void;
}

interface SpecGridProps {
  onBack: () => void;
  onSelect: (specId: number) => void;
  selectedSpecId?: number | null;
  specs: SpecSummary[];
}

interface SpecPickerProps {
  compact?: boolean;
  onSelect: (specId: number) => void;
  specId?: number | null;
}

export function SpecPicker({ compact, onSelect, specId }: SpecPickerProps) {
  if (compact) {
    return <CompactPicker onSelect={onSelect} specId={specId} />;
  }
  return <FullPicker onSelect={onSelect} specId={specId} />;
}

export function SpecPickerSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return <Skeleton h="7" w="32" rounded="md" />;
  }
  return (
    <Card.Root w="420px">
      <Card.Body p="4">
        <Grid columns={5} gap="2">
          {Array.from({ length: 13 }).map((_, i) => (
            <VStack key={i} gap="1">
              <Skeleton w="10" h="10" rounded="md" />
              <Skeleton w="12" h="3" rounded="sm" />
            </VStack>
          ))}
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}

function ClassGrid({ classes, onSelect }: ClassGridProps) {
  return (
    <Grid columns={5} gap="2">
      {classes.map((cls) => (
        <GridButton key={cls.id} onClick={() => onSelect(cls.id)}>
          <GameIcon iconName={cls.fileName} size="lg" />
          <Text textStyle="xs" textAlign="center" lineHeight="tight">
            {cls.label}
          </Text>
        </GridButton>
      ))}
    </Grid>
  );
}

function CompactPicker({
  onSelect,
  specId,
}: {
  onSelect: (specId: number) => void;
  specId?: number | null;
}) {
  const [mode, setMode] = useState<"display" | "class" | "spec">("display");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { classes, isLoading, specs } = useClassesAndSpecs();

  const currentSpec = specs.find((s) => s.id === specId);
  const currentClass = currentSpec
    ? classes.find((c) => c.id === currentSpec.class_id)
    : null;
  const specsForClass = specs.filter((s) => s.class_id === selectedClassId);
  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleSelectClass = (classId: number) => {
    setSelectedClassId(classId);
    setMode("spec");
  };

  const handleSelectSpec = (id: number) => {
    onSelect(id);
    setMode("display");
    setSelectedClassId(null);
  };

  const handleBack = () => {
    if (mode === "spec") {
      setMode("class");
      setSelectedClassId(null);
    } else {
      setMode("display");
    }
  };

  if (isLoading) {
    return <Skeleton h="7" w="32" rounded="md" />;
  }

  if (mode === "display") {
    return (
      <styled.button
        onClick={() => setMode("class")}
        display="flex"
        alignItems="center"
        gap="1.5"
        px="2"
        py="1"
        rounded="md"
        cursor="pointer"
        bg="gray.2"
        _hover={{ bg: "gray.3" }}
      >
        {currentSpec && currentClass ? (
          <>
            <GameIcon iconName={currentSpec.file_name} size="sm" />
            <Text
              textStyle="sm"
              style={{ color: currentClass.color }}
              fontWeight="medium"
            >
              {currentClass.label}
            </Text>
            <Text textStyle="sm" color="fg.muted">
              /
            </Text>
            <Text textStyle="sm">{currentSpec.name}</Text>
          </>
        ) : (
          <Text textStyle="sm" color="fg.muted">
            Select spec...
          </Text>
        )}
        <ChevronDownIcon size={14} />
      </styled.button>
    );
  }

  if (mode === "class") {
    return (
      <HStack gap="1" flexWrap="wrap">
        <styled.button
          onClick={handleBack}
          display="flex"
          alignItems="center"
          p="1"
          rounded="md"
          cursor="pointer"
          color="fg.muted"
          _hover={{ bg: "gray.3", color: "fg.default" }}
        >
          <ChevronLeftIcon size={14} />
        </styled.button>
        {classes.map((cls) => (
          <styled.button
            key={cls.id}
            onClick={() => handleSelectClass(cls.id)}
            p="1"
            rounded="md"
            cursor="pointer"
            _hover={{ bg: "gray.3" }}
            title={cls.label}
          >
            <GameIcon iconName={cls.fileName} size="sm" />
          </styled.button>
        ))}
      </HStack>
    );
  }

  return (
    <HStack gap="1" flexWrap="wrap">
      <styled.button
        onClick={handleBack}
        display="flex"
        alignItems="center"
        p="1"
        rounded="md"
        cursor="pointer"
        color="fg.muted"
        _hover={{ bg: "gray.3", color: "fg.default" }}
      >
        <ChevronLeftIcon size={14} />
      </styled.button>
      {selectedClass && (
        <GameIcon iconName={selectedClass.fileName} size="sm" />
      )}
      {specsForClass.map((spec) => (
        <styled.button
          key={spec.id}
          onClick={() => handleSelectSpec(spec.id)}
          display="flex"
          alignItems="center"
          gap="1"
          px="1.5"
          py="1"
          rounded="md"
          cursor="pointer"
          bg={spec.id === specId ? "gray.3" : undefined}
          _hover={{ bg: "gray.3" }}
        >
          <GameIcon iconName={spec.file_name} size="sm" />
          <Text textStyle="xs">{spec.name}</Text>
        </styled.button>
      ))}
    </HStack>
  );
}

function FullPicker({
  onSelect,
  specId,
}: {
  onSelect: (specId: number) => void;
  specId?: number | null;
}) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { classes, isLoading, specs } = useClassesAndSpecs();

  const specsForClass = specs.filter((s) => s.class_id === selectedClassId);

  if (isLoading) {
    return <SpecPickerSkeleton />;
  }

  if (selectedClassId) {
    return (
      <Card.Root w="420px">
        <Card.Body p="4">
          <SpecGrid
            specs={specsForClass}
            selectedSpecId={specId}
            onSelect={onSelect}
            onBack={() => setSelectedClassId(null)}
          />
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root w="420px">
      <Card.Body p="4">
        <ClassGrid classes={classes} onSelect={setSelectedClassId} />
      </Card.Body>
    </Card.Root>
  );
}

function SpecGrid({ onBack, onSelect, selectedSpecId, specs }: SpecGridProps) {
  return (
    <VStack gap="3" alignItems="stretch">
      <styled.button
        onClick={onBack}
        display="flex"
        alignItems="center"
        gap="1"
        color="fg.muted"
        textStyle="sm"
        cursor="pointer"
        _hover={{ color: "fg.default" }}
      >
        <ChevronLeftIcon size={16} />
        Back to classes
      </styled.button>
      <Flex gap="2" justify="center" flexWrap="wrap">
        {specs.map((spec) => (
          <GridButton
            key={spec.id}
            onClick={() => onSelect(spec.id)}
            selected={spec.id === selectedSpecId}
            w="20"
          >
            <GameIcon iconName={spec.file_name} size="lg" />
            <Text
              textStyle="xs"
              textAlign="center"
              lineHeight="tight"
              minH="8"
              display="flex"
              alignItems="center"
            >
              {spec.name}
            </Text>
          </GridButton>
        ))}
      </Flex>
    </VStack>
  );
}

const GridButton = styled("button", {
  base: {
    _hover: { bg: "gray.3" },
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "1",
    p: "1.5",
    rounded: "md",
    transition: "background 0.1s",
  },
  variants: {
    selected: {
      true: { bg: "gray.3" },
    },
  },
});
