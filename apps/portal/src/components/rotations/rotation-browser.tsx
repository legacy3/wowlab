"use client";

import { createListCollection } from "@ark-ui/react/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useExtracted, useFormatter } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Box, Flex, HStack, VStack } from "styled-system/jsx";

import type { RotationsRow } from "@/lib/engine";

import { Link as IntlLink } from "@/i18n/navigation";
import { href, routes } from "@/lib/routing";
import { useClassesAndSpecs, useUser } from "@/lib/state";
import { createClient } from "@/lib/supabase";

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
  const t = useExtracted();
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

  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: rotations = [], isLoading } = useQuery({
    queryFn: async () => {
      let query = supabase
        .from("rotations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (filter === "public") {
        query = query.eq("is_public", true);
      } else if (filter === "mine" && userId) {
        query = query.eq("user_id", userId);
      }

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      if (specIdsForClass && specIdsForClass.length > 0) {
        query = query.in("spec_id", specIdsForClass);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RotationsRow[];
    },
    queryKey: ["rotations", { filter, search, specIdsForClass, userId }],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rotations"] });
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t("Are you sure you want to delete this rotation?"))) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation, t],
  );

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
                {t("All")}
              </Tabs.Trigger>
              <Tabs.Trigger value="public">
                <GlobeIcon size={14} />
                {t("Public")}
              </Tabs.Trigger>
              {userId && (
                <Tabs.Trigger value="mine">
                  <UserIcon size={14} />
                  {t("Mine")}
                </Tabs.Trigger>
              )}
              <Tabs.Indicator />
            </Tabs.List>
          </Tabs.Root>

          <ClassFilter
            classes={classes}
            value={classFilter}
            onChange={setClassFilter}
            allClassesLabel={t("All Classes")}
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
              placeholder={t("Search...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              pl="9"
              w="44"
            />
          </Box>
          <Button asChild size="sm">
            <IntlLink href={href(routes.rotations.editor.index)}>
              <PlusIcon size={16} />
              {t("New")}
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
                aria-label={t("Clear class filter")}
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
                aria-label={t("Clear search")}
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
                ? t("You haven't created any rotations yet")
                : t("No rotations found")}
            </Empty.Title>
          </Empty.Content>
          {filter === "mine" && (
            <Empty.Action>
              <Button asChild size="sm">
                <IntlLink href={href(routes.rotations.editor.index)}>
                  <PlusIcon size={16} />
                  {t("Create rotation")}
                </IntlLink>
              </Button>
            </Empty.Action>
          )}
        </Empty.Root>
      ) : (
        <Box borderWidth="1" rounded="lg" overflow="hidden">
          <TableHeader
            nameLabel={t("Name")}
            specLabel={t("Spec")}
            visibilityLabel={t("Visibility")}
            updatedLabel={t("Updated")}
          />
          {rotations.map((rotation) => (
            <RotationRow
              key={rotation.id}
              rotation={rotation}
              isOwner={rotation.user_id === userId}
              getClassColor={getClassColor}
              getSpecLabel={getSpecLabel}
              onDelete={handleDelete}
              publicLabel={t("Public")}
              privateLabel={t("Private")}
              actionsLabel={t("Actions")}
              editLabel={t("Edit")}
              deleteLabel={t("Delete")}
            />
          ))}
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
  const format = useFormatter();
  const updatedAt = format.relativeTime(new Date(rotation.updated_at));

  const specLabel = getSpecLabel(rotation.spec_id);
  const classColor = getClassColor(rotation.spec_id);

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
                    <IntlLink
                      href={href(routes.rotations.editor.edit, {
                        id: rotation.id,
                      })}
                    >
                      <PencilIcon size={14} />
                      {editLabel}
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
                    {deleteLabel}
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
