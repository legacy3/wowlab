"use client";

import { createListCollection } from "@ark-ui/react/select";
import { type CrudFilter, useDelete, useList } from "@refinedev/core";
import { formatDistanceToNow } from "date-fns";
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
import { useCallback, useMemo, useState } from "react";
import { Box, Flex, HStack, VStack } from "styled-system/jsx";

import type { RotationsRow } from "@/components/editor/types";

import { Link as IntlLink } from "@/i18n/navigation";
import { href, routes } from "@/lib/routing";
import { useClassesAndSpecs } from "@/lib/state";

import {
  Badge,
  Button,
  Empty,
  IconButton,
  Input,
  Loader,
  Menu,
  Select,
  Tabs,
  Text,
} from "../ui";

interface ClassFilterProps {
  classes: Array<{ color: string; id: number; label: string }>;
  onChange: (classId: number | null) => void;
  value: number | null;
}

interface RotationBrowserProps {
  userId?: string;
}

interface RotationRowProps {
  getClassColor: (specId: number) => string;
  getSpecLabel: (specId: number) => string | null;
  isOwner: boolean;
  onDelete: (id: string) => void;
  rotation: RotationsRow;
}

type VisibilityFilter = "all" | "public" | "mine";

export function RotationBrowser({ userId }: RotationBrowserProps) {
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<number | null>(null);

  const { classes, getClassColor, getSpecIdsForClass, getSpecLabel } =
    useClassesAndSpecs();

  const specIdsForClass = useMemo(
    () => (classFilter ? getSpecIdsForClass(classFilter) : null),
    [classFilter, getSpecIdsForClass],
  );

  const filters = useMemo(() => {
    const result: CrudFilter[] = [];

    if (filter === "public") {
      result.push({ field: "isPublic", operator: "eq", value: true });
    } else if (filter === "mine" && userId) {
      result.push({ field: "userId", operator: "eq", value: userId });
    }

    if (search.trim()) {
      result.push({
        field: "name",
        operator: "contains",
        value: search.trim(),
      });
    }

    if (specIdsForClass && specIdsForClass.length > 0) {
      result.push({
        field: "specId",
        operator: "in",
        value: specIdsForClass,
      });
    }

    return result;
  }, [filter, userId, search, specIdsForClass]);

  const {
    query: { isLoading },
    result,
  } = useList<RotationsRow>({
    filters,
    resource: "rotations",
    sorters: [{ field: "updatedAt", order: "desc" }],
  });

  const { mutate: deleteRotation } = useDelete<RotationsRow>();

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this rotation?")) {
        deleteRotation({ id, resource: "rotations" });
      }
    },
    [deleteRotation],
  );

  const rotations = result?.data ?? [];

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
                All
              </Tabs.Trigger>
              <Tabs.Trigger value="public">
                <GlobeIcon size={14} />
                Public
              </Tabs.Trigger>
              {userId && (
                <Tabs.Trigger value="mine">
                  <UserIcon size={14} />
                  Mine
                </Tabs.Trigger>
              )}
              <Tabs.Indicator />
            </Tabs.List>
          </Tabs.Root>

          <ClassFilter
            classes={classes}
            value={classFilter}
            onChange={setClassFilter}
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              pl="9"
              w="44"
            />
          </Box>
          <Button asChild size="sm">
            <IntlLink href={href(routes.rotations.editor.new)}>
              <PlusIcon size={16} />
              New
            </IntlLink>
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
                aria-label="Clear class filter"
              >
                <XIcon size={12} />
              </IconButton>
            </Badge>
          )}
          {search && (
            <Badge size="sm" variant="outline">
              "{search}"
              <IconButton
                variant="plain"
                size="xs"
                ml="1"
                onClick={() => setSearch("")}
                aria-label="Clear search"
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
      ) : rotations.length === 0 ? (
        <Empty.Root size="lg" variant="outline">
          <Empty.Content>
            <Empty.Title>
              {filter === "mine"
                ? "You haven't created any rotations yet"
                : "No rotations found"}
            </Empty.Title>
          </Empty.Content>
          {filter === "mine" && (
            <Empty.Action>
              <Button asChild size="sm">
                <IntlLink href={href(routes.rotations.editor.new)}>
                  <PlusIcon size={16} />
                  Create rotation
                </IntlLink>
              </Button>
            </Empty.Action>
          )}
        </Empty.Root>
      ) : (
        <Box borderWidth="1" rounded="lg" overflow="hidden">
          <TableHeader />
          {rotations.map((rotation) => (
            <RotationRow
              key={rotation.id}
              rotation={rotation}
              isOwner={rotation.userId === userId}
              getClassColor={getClassColor}
              getSpecLabel={getSpecLabel}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}
    </VStack>
  );
}

function ClassFilter({ classes, onChange, value }: ClassFilterProps) {
  const items = useMemo(
    () => [
      { label: "All Classes", value: "all" },
      ...classes.map((cls) => ({
        color: cls.color,
        label: cls.label,
        value: String(cls.id),
      })),
    ],
    [classes],
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
          <Select.ValueText placeholder="All Classes" />
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

function RotationRow({
  getClassColor,
  getSpecLabel,
  isOwner,
  onDelete,
  rotation,
}: RotationRowProps) {
  const updatedAt = formatDistanceToNow(new Date(rotation.updatedAt), {
    addSuffix: true,
  });

  const specLabel = getSpecLabel(rotation.specId);
  const classColor = getClassColor(rotation.specId);

  return (
    <IntlLink href={href(routes.rotations.editor.edit, { id: rotation.id })}>
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
                style={{ backgroundColor: classColor }}
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
          {rotation.isPublic ? (
            <Badge size="sm" variant="subtle" colorPalette="green">
              <GlobeIcon size={12} />
              Public
            </Badge>
          ) : (
            <Badge size="sm" variant="subtle">
              <LockIcon size={12} />
              Private
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
                  aria-label="Actions"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontalIcon size={16} />
                </IconButton>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="edit" asChild>
                    <IntlLink
                      href={href(routes.rotations.editor.edit, {
                        id: rotation.id,
                      })}
                    >
                      <PencilIcon size={14} />
                      Edit
                    </IntlLink>
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
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}
        </Box>
      </Flex>
    </IntlLink>
  );
}

function TableHeader() {
  return (
    <Flex px="4" py="2" borderBottomWidth="1" bg="bg.subtle" gap="4">
      <Text
        flex="1"
        minW="0"
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        Name
      </Text>
      <Text
        w="40"
        display={{ base: "none", md: "block" }}
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        Spec
      </Text>
      <Text
        w="24"
        textAlign="center"
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        Visibility
      </Text>
      <Text
        w="28"
        textAlign="right"
        display={{ base: "none", sm: "block" }}
        textStyle="xs"
        fontWeight="medium"
        color="fg.muted"
      >
        Updated
      </Text>
      <Box w="10" />
    </Flex>
  );
}
