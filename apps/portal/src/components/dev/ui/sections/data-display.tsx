"use client";

import { Grid, HStack, Stack, VStack } from "styled-system/jsx";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Code,
  HelpText,
  Kbd,
  Table,
  Text,
} from "@/components/ui";
import { href, routes } from "@/lib/routing";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

export function DataDisplaySection() {
  return (
    <Section id="data-display" title="Data Display" lazy minHeight={2939}>
      <Stack gap="10">
        <CodeDemo />
        <KbdDemo />
        <HelpTextDemo />
        <TableDemo />
        <CardDemo />
        <BadgeDemo />
        <AvatarDemo />
      </Stack>
    </Section>
  );
}

function AvatarDemo() {
  return (
    <Subsection title="Avatar">
      <DemoDescription>Profile images with fallback initials.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
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
        </DemoBox>
        <DemoBox>
          <DemoLabel>With Images</DemoLabel>
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
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function BadgeDemo() {
  return (
    <Subsection title="Badge">
      <DemoDescription>Status indicators and tags.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Variants</DemoLabel>
          <HStack gap="3" flexWrap="wrap">
            <Badge variant="solid">Solid</Badge>
            <Badge variant="surface">Surface</Badge>
            <Badge variant="subtle">Subtle</Badge>
            <Badge variant="outline">Outline</Badge>
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Colors</DemoLabel>
          <HStack gap="3" flexWrap="wrap">
            <Badge colorPalette="amber">Amber</Badge>
            <Badge colorPalette="green">Green</Badge>
            <Badge colorPalette="red">Red</Badge>
            <Badge colorPalette="gray">Gray</Badge>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function CardDemo() {
  return (
    <Subsection title="Card">
      <DemoDescription>Content containers.</DemoDescription>
      <Grid columns={{ base: 1, md: 2 }} gap="4">
        <DemoBox>
          <DemoLabel>Full Card</DemoLabel>
          <Card.Root>
            <Card.Header>
              <Card.Title>Rotation</Card.Title>
              <Card.Description>Fire Mage single target</Card.Description>
            </Card.Header>
            <Card.Body>
              <Text>Priority list and cooldown usage.</Text>
            </Card.Body>
            <Card.Footer>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </Card.Footer>
          </Card.Root>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Simple Card</DemoLabel>
          <Card.Root>
            <Card.Header>
              <Card.Title>Simulation Result</Card.Title>
            </Card.Header>
            <Card.Body>
              <Text color="fg.muted">42,150 DPS average</Text>
            </Card.Body>
          </Card.Root>
        </DemoBox>
      </Grid>
    </Subsection>
  );
}

function CodeBlockDemo() {
  return <Code language="tsx">{fixtures.code.reactHook}</Code>;
}

function CodeDemo() {
  return (
    <Subsection title="Code">
      <DemoDescription>
        Code snippets and syntax-highlighted blocks.
      </DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Inline</DemoLabel>
          <Stack gap="2">
            <Text>
              Use <Code>npm install</Code> to install dependencies and{" "}
              <Code>npm run dev</Code> to start the server.
            </Text>
            <Text textStyle="sm">
              Copy <Code>.env.example</Code> to <Code>.env.local</Code> and set{" "}
              <Code>SUPABASE_URL</Code>.
            </Text>
          </Stack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Syntax Highlighted Block</DemoLabel>
          <CodeBlockDemo />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function HelpTextDemo() {
  return (
    <Subsection title="HelpText">
      <DemoDescription>Inline tooltips for terms.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Basic Usage</DemoLabel>
          <Text>
            The{" "}
            <HelpText content="Central Processing Unit - the main processor in your computer">
              CPU
            </HelpText>{" "}
            handles most calculations, while the{" "}
            <HelpText content="Graphics Processing Unit - specialized for rendering">
              GPU
            </HelpText>{" "}
            handles graphics rendering.
          </Text>
        </DemoBox>
        <DemoBox>
          <DemoLabel>With Link</DemoLabel>
          <Text textStyle="sm" color="fg.muted">
            <HelpText
              content="Browsers may limit reported cores for privacy"
              href={href(routes.dev.docs.page, {
                slug: "reference/03-browser-cpu-limits",
              })}
            >
              CPU Cores
            </HelpText>{" "}
            can be limited by browser settings.
          </Text>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Game Terms</DemoLabel>
          <HStack gap="6">
            <Text textStyle="xs">
              <HelpText content="Damage per second">DPS</HelpText>
            </Text>
            <Text textStyle="xs">
              <HelpText content="Healing per second">HPS</HelpText>
            </Text>
            <Text textStyle="xs">
              <HelpText content="Time to kill">TTK</HelpText>
            </Text>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function KbdDemo() {
  return (
    <Subsection title="Kbd">
      <DemoDescription>Keyboard shortcut display.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>Sizes</DemoLabel>
          <HStack gap="4" flexWrap="wrap">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Kbd key={size} size={size}>
                {size}
              </Kbd>
            ))}
          </HStack>
        </DemoBox>
        <DemoBox>
          <DemoLabel>Usage Example</DemoLabel>
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
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function TableDemo() {
  return (
    <Subsection title="Table">
      <DemoDescription>Tabular data display.</DemoDescription>
      <DemoBox>
        <Table.Root variant="surface">
          <Table.Head>
            <Table.Row>
              <Table.Header>Name</Table.Header>
              <Table.Header>Role</Table.Header>
              <Table.Header textAlign="right">Score</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {fixtures.table.leaderboard.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell fontWeight="medium">{row.name}</Table.Cell>
                <Table.Cell>{row.role}</Table.Cell>
                <Table.Cell textAlign="right">{row.score}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </DemoBox>
    </Subsection>
  );
}
