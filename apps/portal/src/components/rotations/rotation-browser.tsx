"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useDelete } from "@refinedev/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useCallback, useMemo, useRef, useState } from "react";
import { Box, Flex, HStack, VStack } from "styled-system/jsx";

import type { RotationsRow } from "@/lib/editor";

import { rotations, useResourceList } from "@/lib/refine";
import { href, routes } from "@/lib/routing";
import { useClassesAndSpecs, useUser } from "@/lib/state";

import {
  Badge,
  Button,
  Empty,
  IconButton,
  Input,
  Link,
  Loader,
  Menu,
  Select,
  Tabs,
  Text,
} from "../ui";

interface ClassFilterProps {
  allClassesLabel: string;
  classes: Array<{ color: string; id: number; label: string }>;
  onChange: (classId: number | null) => void;
  value: number | null;
}

interface RotationRowProps {
  actionsLabel: string;
  deleteLabel: string;
  editLabel: string;
  getClassColor: (specId: number) => string | null;
  getSpecLabel: (specId: number) => string | null;
  isOwner: boolean;
  onDelete: (id: string) => void;
  privateLabel: string;
  publicLabel: string;
  rotation: RotationsRow;
}

interface TableHeaderProps {
  nameLabel: string;
  specLabel: string;
  updatedLabel: string;
  visibilityLabel: string;
}

type VisibilityFilter = "all" | "public" | "mine";

export function RotationBrowser() {
  const { rotationBrowser: content } = useIntlayer("rotations");
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<number | null>(null);

  const { data: user } = useUser();
  const userId = user?.id;

  const { classes, getClassColor, getSpecIdsForClass, getSpecLabel } =
    useClassesAndSpecs();

  const specIdsForClass = useMemo(
    () => (classFilter ? getSpecIdsForClass(classFilter) : null),
    [classFilter, getSpecIdsForClass],
  );

  const filters = useMemo(() => {
    const result: Array<{
      field: string;
      operator: "eq" | "contains" | "in";
      value: unknown;
    }> = [];

    if (filter === "public") {
      result.push({ field: "is_public", operator: "eq", value: true });
    } else if (filter === "mine" && userId) {
      result.push({ field: "user_id", operator: "eq", value: userId });
    }

    if (search.trim()) {
      result.push({
        field: "name",
        operator: "contains",
        value: search.trim(),
      });
    }

    if (specIdsForClass && specIdsForClass.length > 0) {
      result.push({ field: "spec_id", operator: "in", value: specIdsForClass });
    }

    return result;
  }, [filter, userId, search, specIdsForClass]);

  const { data: rotationsList, isLoading } = useResourceList<RotationsRow>({
    ...rotations,
    filters,
    pagination: { mode: "off" },
    sorters: [{ field: "updated_at", order: "desc" }],
  });

  const { mutate: deleteRotation } = useDelete<RotationsRow>();

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(content.confirmDelete)) {
        deleteRotation({ id, resource: "rotations" });
      }
    },
    [deleteRotation, content.confirmDelete],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rotationsList.length,
    estimateSize: () => 65,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  return (
    <VStack gap="4" alignItems="stretch">
      <Flex gap="3" flexWrap="wrap" justify="space-between" align="center">
        <HStack gap="3" flexWrap="wrap">
          <Tabs.Root
            value={filter}
            onValueChange={(e) => setFilter(e.value as VisibilityFilter)}
            size="sm"
          >
            <Tabs.List>
              <Tabs.Trigger value="all">
                <GlobeIcon size={14} />
                {content.all}
              </Tabs.Trigger>
              <Tabs.Trigger value="public">
                <GlobeIcon size={14} />
                {content.public}
              </Tabs.Trigger>
              {userId && (
                <Tabs.Trigger value="mine">
                  <UserIcon size={14} />
                  {content.mine}
                </Tabs.Trigger>
              )}
              <Tabs.Indicator />
            </Tabs.List>
          </Tabs.Root>

          <ClassFilter
            classes={classes}
            value={classFilter}
            onChange={setClassFilter}
            allClassesLabel={content.allClasses.value}
          />
        </HStack>

        <HStack gap="2">
          <Box position="relative">
            <Box
              position="absolute"
              left="3"
              top="50%"
              transform="translateY(-50%)"
              color="fg.muted"
              pointerEvents="none"
            >
              <SearchIcon size={14} />
            </Box>
            <Input
              size="sm"
              placeholder={content.searchPlaceholder.value}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              pl="9"
              w="44"
            />
          </Box>
          <Button asChild size="sm">
            <Link href={href(routes.rotations.editor.index)}>
              <PlusIcon size={16} />
              {content.new}
            </Link>
          </Button>
        </HStack>
      </Flex>

      {(classFilter || search) && (
        <HStack gap="2" flexWrap="wrap">
          {classFilter && (
            <Badge size="sm" variant="outline">
              {classes.find((c) => c.id === classFilter)?.label}
              <IconButton
                variant="plain"
                size="xs"
                ml="1"
                onClick={() => setClassFilter(null)}
                aria-label={content.clearClassFilter.value}
              >
                <XIcon size={12} />
              </IconButton>
            </Badge>
          )}
          {search && (
            <Badge size="sm" variant="outline">
              &quot;{search}&quot;
              <IconButton
                variant="plain"
                size="xs"
                ml="1"
                onClick={() => setSearch("")}
                aria-label={content.clearSearch.value}
              >
                <XIcon size={12} />
              </IconButton>
            </Badge>
          )}
        </HStack>
      )}

      {isLoading ? (
        <Flex justify="center" py="12">
          <Loader />
        </Flex>
      ) : rotationsList.length === 0 ? (
        <Empty.Root size="lg" variant="outline">
          <Empty.Content>
            <Empty.Title>
              {filter === "mine"
                ? content.noRotationsYet
                : content.noRotationsFound}
            </Empty.Title>
          </Empty.Content>
          {filter === "mine" && (
            <Empty.Action>
              <Button asChild size="sm">
                <Link href={href(routes.rotations.editor.index)}>
                  <PlusIcon size={16} />
                  {content.createRotation}
                </Link>
              </Button>
            </Empty.Action>
          )}
        </Empty.Root>
      ) : (
        <Box borderWidth="1" rounded="lg" overflow="hidden">
          <TableHeader
            nameLabel={content.name}
            specLabel={content.spec}
            visibilityLabel={content.visibility}
            updatedLabel={content.updated}
          />
          <Box ref={parentRef} maxH="600px" overflow="auto">
            <Box h={`${virtualizer.getTotalSize()}px`} position="relative">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const rotation = rotationsList[virtualRow.index];

                return (
                  <Box
                    key={rotation.id}
                    position="absolute"
                    top="0"
                    left="0"
                    w="full"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <RotationRow
                      rotation={rotation}
                      isOwner={rotation.user_id === userId}
                      getClassColor={getClassColor}
                      getSpecLabel={getSpecLabel}
                      onDelete={handleDelete}
                      publicLabel={content.public}
                      privateLabel={content.private}
                      actionsLabel={content.actions}
                      editLabel={content.edit}
                      deleteLabel={content.delete}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </VStack>
  );
}

function ClassFilter({
  allClassesLabel,
  classes,
  onChange,
  value,
}: ClassFilterProps) {
  const items = useMemo(
    () => [
      { label: allClassesLabel, value: "all" },
      ...classes.map((cls) => ({
        color: cls.color,
        label: cls.label,
        value: String(cls.id),
      })),
    ],
    [allClassesLabel, classes],
  );

  const collection = useMemo(() => createListCollection({ items }), [items]);

  return (
    <Select.Root
      size="sm"
      value={value ? [String(value)] : ["all"]}
      collection={collection}
      onValueChange={(details) => {
        const val = details.value[0];
        onChange(val === "all" ? null : Number(val));
      }}
    >
      <Select.Control w="40">
        <Select.Trigger>
          <Select.ValueText placeholder={allClassesLabel} />
          <Select.Indicator />
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          {collection.items.map((item) => (
            <Select.Item key={item.value} item={item}>
              <HStack gap="2">
                {item.value !== "all" && (
                  <Box
                    w="2"
                    h="2"
                    rounded="full"
                    style={{
                      backgroundColor: (item as { color?: string }).color,
                    }}
                  />
                )}
                <Select.ItemText>{item.label}</Select.ItemText>
              </HStack>
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(days) >= 1) {
    return rtf.format(days, "day");
  }
  if (Math.abs(hours) >= 1) {
    return rtf.format(hours, "hour");
  }
  if (Math.abs(minutes) >= 1) {
    return rtf.format(minutes, "minute");
  }
  return rtf.format(seconds, "second");
}

function RotationRow({
  actionsLabel,
  deleteLabel,
  editLabel,
  getClassColor,
  getSpecLabel,
  isOwner,
  onDelete,
  privateLabel,
  publicLabel,
  rotation,
}: RotationRowProps) {
  const updatedAt = formatRelativeTime(new Date(rotation.updated_at));

  const specLabel = getSpecLabel(rotation.spec_id);
  const classColor = getClassColor(rotation.spec_id);

  return (
    <Link href={href(routes.rotations.editor.edit, { id: rotation.id })}>
      <Flex
        px="4"
        py="3"
        gap="4"
        align="center"
        borderBottomWidth="1"
        cursor="pointer"
        transition="background 0.1s"
        _hover={{ bg: "bg.subtle" }}
        _last={{ borderBottomWidth: 0 }}
      >
        <VStack flex="1" minW="0" alignItems="start" gap="0.5">
          <Text fontWeight="medium" truncate w="full">
            {rotation.name}
          </Text>
          {rotation.description && (
            <Text textStyle="sm" color="fg.muted" truncate w="full">
              {rotation.description}
            </Text>
          )}
        </VStack>

        <HStack w="40" gap="2" display={{ base: "none", md: "flex" }}>
          {specLabel ? (
            <>
              <Box
                w="2"
                h="2"
                rounded="full"
                flexShrink={0}
                style={{ backgroundColor: classColor ?? undefined }}
              />
              <Text textStyle="sm" color="fg.muted" truncate>
                {specLabel}
              </Text>
            </>
          ) : (
            <Text textStyle="sm" color="fg.subtle">
              —
            </Text>
          )}
        </HStack>

        <Box w="24" textAlign="center">
          {rotation.is_public ? (
            <Badge size="sm" variant="subtle" colorPalette="green">
              <GlobeIcon size={12} />
              {publicLabel}
            </Badge>
          ) : (
            <Badge size="sm" variant="subtle">
              <LockIcon size={12} />
              {privateLabel}
            </Badge>
          )}
        </Box>

        <Text
          w="28"
          textAlign="right"
          textStyle="sm"
          color="fg.muted"
          display={{ base: "none", sm: "block" }}
        >
          {updatedAt}
        </Text>

        <Box w="10" textAlign="right">
          {isOwner && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  variant="plain"
                  size="xs"
                  aria-label={actionsLabel}
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontalIcon size={16} />
                </IconButton>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="edit" asChild>
                    <Link
                      href={href(routes.rotations.editor.edit, {
                        id: rotation.id,
                      })}
                    >
                      <PencilIcon size={14} />
                      {editLabel}
                    </Link>
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item
                    value="delete"
                    color="red.500"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(rotation.id);
                    }}
                  >
                    <Trash2Icon size={14} />
                    {deleteLabel}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}
        </Box>
      </Flex>
    </Link>
  );
}

function TableHeader({
  nameLabel,
  specLabel,
  updatedLabel,
  visibilityLabel,
}: TableHeaderProps) {
  return (
    <Flex px="4" py="2" borderBottomWidth="1" bg="bg.subtle" gap="4">
      <Text
        flex="1"
        minW="0"
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        {nameLabel}
      </Text>
      <Text
        w="40"
        display={{ base: "none", md: "block" }}
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        {specLabel}
      </Text>
      <Text
        w="24"
        textAlign="center"
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        {visibilityLabel}
      </Text>
      <Text
        w="28"
        textAlign="right"
        display={{ base: "none", sm: "block" }}
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        {updatedLabel}
      </Text>
      <Box w="10" />
    </Flex>
  );
}
