"use client";

import { useDebounceFn } from "ahooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { HStack, Stack } from "styled-system/jsx";

import { Badge, Code, Input, Skeleton, Table, Text } from "@/components/ui";
import {
  getVarPathSchema,
  useEngine,
  type VarPathCategory,
  type VarPathInfo,
} from "@/lib/engine";

import { DemoBox, DemoDescription, Section, Subsection } from "../../shared";

interface FlatPath extends VarPathInfo {
  category: string;
}

export function SchemaSection() {
  const { isReady } = useEngine();
  const [schema, setSchema] = useState<VarPathCategory[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (isReady && !fetchedRef.current) {
      fetchedRef.current = true;
      getVarPathSchema().then(setSchema).catch(setError);
    }
  }, [isReady]);

  const isLoading = isReady && !schema && !error;

  const flatPaths = useMemo(() => {
    if (!schema) return [];
    return schema.flatMap((cat) =>
      cat.paths.map((path) => ({ ...path, category: cat.name })),
    );
  }, [schema]);

  const categories = useMemo(() => {
    if (!schema) return [];
    return schema.map((cat) => cat.name);
  }, [schema]);

  return (
    <Section id="schema" title="VarPath Schema">
      <Stack gap="10">
        <Subsection title="Overview">
          <DemoDescription>
            Variable paths for rotation conditions. Search by name or filter by
            category.
          </DemoDescription>
          <DemoBox>
            {!isReady ? (
              <Text color="fg.muted">Engine not ready</Text>
            ) : isLoading ? (
              <HStack gap="2">
                <Skeleton h="5" w="24" />
                <Skeleton h="5" w="24" />
              </HStack>
            ) : error ? (
              <Text color="fg.error">{error.message}</Text>
            ) : (
              <HStack gap="2">
                <Badge colorPalette="blue">
                  {categories.length} Categories
                </Badge>
                <Badge colorPalette="green">{flatPaths.length} Paths</Badge>
              </HStack>
            )}
          </DemoBox>
        </Subsection>

        <Subsection title="Browse">
          <DemoDescription>
            Search paths by name or description. Click a category to filter.
          </DemoDescription>
          {isLoading ? (
            <Stack gap="2">
              <Skeleton h="10" />
              <Skeleton h="64" />
            </Stack>
          ) : schema ? (
            <PathBrowser paths={flatPaths} categories={categories} />
          ) : null}
        </Subsection>
      </Stack>
    </Section>
  );
}

function PathBrowser({
  categories,
  paths,
}: {
  categories: string[];
  paths: FlatPath[];
}) {
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { run: debouncedSearch } = useDebounceFn(
    (value: string) => setSearch(value),
    { wait: 200 },
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const filtered = useMemo(() => {
    let result = paths;

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    return result;
  }, [paths, search, category]);

  return (
    <Stack gap="4">
      <Input
        placeholder="Search paths..."
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
      />

      <HStack gap="2" flexWrap="wrap">
        <Badge
          as="button"
          cursor="pointer"
          variant={category === null ? "solid" : "outline"}
          onClick={() => setCategory(null)}
          _hover={{ opacity: 0.8 }}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            as="button"
            cursor="pointer"
            variant={category === cat ? "solid" : "outline"}
            colorPalette={category === cat ? "blue" : undefined}
            onClick={() => setCategory(category === cat ? null : cat)}
            _hover={{ opacity: 0.8 }}
          >
            {cat}
          </Badge>
        ))}
      </HStack>

      <Text textStyle="xs" color="fg.muted">
        Showing {Math.min(filtered.length, 50)} of {filtered.length} paths
        {search && ` matching "${search}"`}
      </Text>

      <PathTable paths={filtered} />
    </Stack>
  );
}

function PathTable({ paths }: { paths: FlatPath[] }) {
  if (paths.length === 0) {
    return (
      <DemoBox>
        <Text color="fg.muted" textAlign="center" py="8">
          No paths match your search
        </Text>
      </DemoBox>
    );
  }

  return (
    <Table.Root size="sm" variant="surface">
      <Table.Head>
        <Table.Row>
          <Table.Header>Path</Table.Header>
          <Table.Header w="20">Type</Table.Header>
          <Table.Header w="28">Category</Table.Header>
          <Table.Header>Example</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {paths.slice(0, 50).map((path) => (
          <Table.Row key={`${path.category}-${path.name}`}>
            <Table.Cell>
              <Stack gap="0.5">
                <Code>{path.name}</Code>
                <Text textStyle="xs" color="fg.muted" lineClamp={1}>
                  {path.description}
                </Text>
              </Stack>
            </Table.Cell>
            <Table.Cell>
              <TypeBadge type={path.valueType} />
            </Table.Cell>
            <Table.Cell>
              <Text textStyle="xs" color="fg.muted">
                {path.category}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Code>{path.example}</Code>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function TypeBadge({ type }: { type: string }) {
  const color = type === "bool" ? "blue" : type === "int" ? "purple" : "green";

  return (
    <Badge size="sm" colorPalette={color}>
      {type}
    </Badge>
  );
}
