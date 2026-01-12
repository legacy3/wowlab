"use client";

import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Code,
  Kbd,
  Table,
  Text,
} from "@/components/ui";

import { Section, Subsection } from "../../shared";

export function DataDisplaySection() {
  return (
    <Section id="data-display" title="Data Display">
      <Stack gap="8">
        <CodeDemo />
        <KbdDemo />
        <TableDemo />
        {/* Cards */}
        <Subsection title="Cards">
          <Grid columns={{ base: 1, md: 2 }} gap="6">
            <Card.Root>
              <Card.Header>
                <Card.Title>Card Title</Card.Title>
                <Card.Description>Card description goes here</Card.Description>
              </Card.Header>
              <Card.Body>
                <Text>Card body content.</Text>
              </Card.Body>
              <Card.Footer>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </Card.Footer>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Card.Title>Simple Card</Card.Title>
              </Card.Header>
              <Card.Body>
                <Text color="fg.muted">Without description or footer.</Text>
              </Card.Body>
            </Card.Root>
          </Grid>
        </Subsection>

        {/* Badges */}
        <Subsection title="Badges">
          <Stack gap="4">
            <HStack gap="3" flexWrap="wrap">
              <Badge variant="solid">Solid</Badge>
              <Badge variant="surface">Surface</Badge>
              <Badge variant="subtle">Subtle</Badge>
              <Badge variant="outline">Outline</Badge>
            </HStack>
            <HStack gap="3" flexWrap="wrap">
              <Badge colorPalette="amber">Amber</Badge>
              <Badge colorPalette="green">Green</Badge>
              <Badge colorPalette="red">Red</Badge>
              <Badge colorPalette="gray">Gray</Badge>
            </HStack>
          </Stack>
        </Subsection>

        {/* Avatar */}
        <Subsection title="Avatar">
          <Stack gap="4">
            <HStack gap="4" alignItems="end">
              {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
                <VStack key={size} gap="2">
                  <Avatar.Root size={size}>
                    <Avatar.Fallback>JD</Avatar.Fallback>
                  </Avatar.Root>
                  <Text textStyle="xs" color="fg.muted">
                    {size}
                  </Text>
                </VStack>
              ))}
            </HStack>
            <HStack gap="4">
              <Avatar.Root>
                <Avatar.Image src="https://i.pravatar.cc/150?u=1" alt="User" />
                <Avatar.Fallback>JD</Avatar.Fallback>
              </Avatar.Root>
              <Avatar.Root>
                <Avatar.Image src="https://i.pravatar.cc/150?u=2" alt="User" />
                <Avatar.Fallback>AB</Avatar.Fallback>
              </Avatar.Root>
              <Avatar.Root>
                <Avatar.Fallback>CD</Avatar.Fallback>
              </Avatar.Root>
            </HStack>
          </Stack>
        </Subsection>
      </Stack>
    </Section>
  );
}

function CodeBlockDemo() {
  const exampleCode = `import { useSpell } from "@/lib/state";

export function SpellInfo({ id }: { id: number }) {
  const { data: spell } = useSpell(id);

  if (!spell) {
    return null;
  }

  return <div>{spell.name}</div>;
}`;

  return <Code language="tsx">{exampleCode}</Code>;
}

function CodeDemo() {
  return (
    <Subsection title="Code">
      <Stack gap="6">
        <Stack gap="2">
          <Text fontWeight="medium" textStyle="sm">
            Inline
          </Text>
          <Text>
            Use <Code>npm install</Code> to install dependencies and{" "}
            <Code>npm run dev</Code> to start the server.
          </Text>
          <Text textStyle="sm">
            Copy <Code>.env.example</Code> to <Code>.env.local</Code> and set{" "}
            <Code>SUPABASE_URL</Code>.
          </Text>
        </Stack>

        <Stack gap="2">
          <Text fontWeight="medium" textStyle="sm">
            Syntax Highlighted Block
          </Text>
          <CodeBlockDemo />
        </Stack>
      </Stack>
    </Subsection>
  );
}

function KbdDemo() {
  return (
    <Subsection title="Kbd">
      <Stack gap="4">
        <HStack gap="4" flexWrap="wrap">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Kbd key={size} size={size}>
              {size}
            </Kbd>
          ))}
        </HStack>
        <HStack gap="2" flexWrap="wrap">
          <Text>Press</Text>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <Text>to open search, or</Text>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>P</Kbd>
          <Text>for commands.</Text>
        </HStack>
      </Stack>
    </Subsection>
  );
}

const tableData = [
  { id: 1, name: "Alice", role: "Tank", score: "125,432" },
  { id: 2, name: "Bob", role: "Healer", score: "118,291" },
  { id: 3, name: "Carol", role: "DPS", score: "112,847" },
  { id: 4, name: "Dave", role: "DPS", score: "109,523" },
];

function TableDemo() {
  return (
    <Subsection title="Table">
      <Table.Root variant="surface">
        <Table.Head>
          <Table.Row>
            <Table.Header>Name</Table.Header>
            <Table.Header>Role</Table.Header>
            <Table.Header textAlign="right">Score</Table.Header>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {tableData.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell fontWeight="medium">{row.name}</Table.Cell>
              <Table.Cell>{row.role}</Table.Cell>
              <Table.Cell textAlign="right">{row.score}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Subsection>
  );
}
