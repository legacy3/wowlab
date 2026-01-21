"use client";

import { Stack } from "styled-system/jsx";

import { Table, Text } from "@/components/ui";

import type { DebugTabProps } from "./types";

export function TreeDataTab({ nodes, subTrees }: DebugTabProps) {
  return (
    <Stack gap={6} w="full">
      <Stack gap={3}>
        <Text textStyle="sm" fontWeight="medium">
          Summary
        </Text>
        <Table.Root variant="surface" size="sm">
          <Table.Body>
            <Table.Row>
              <Table.Cell>Total Nodes</Table.Cell>
              <Table.Cell textAlign="right">{nodes.length}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Hero Talent Trees</Table.Cell>
              <Table.Cell textAlign="right">{subTrees.length}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Choice Nodes</Table.Cell>
              <Table.Cell textAlign="right">
                {nodes.filter((n) => n.type === 2).length}
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Multi-rank Nodes</Table.Cell>
              <Table.Cell textAlign="right">
                {nodes.filter((n) => n.maxRanks > 1).length}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Stack>

      <Stack gap={3}>
        <Text textStyle="sm" fontWeight="medium">
          Hero Talent Trees
        </Text>
        <Table.Root variant="surface" size="sm">
          <Table.Head>
            <Table.Row>
              <Table.Header>ID</Table.Header>
              <Table.Header>Name</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {subTrees.map((st) => (
              <Table.Row key={st.id}>
                <Table.Cell fontFamily="mono" textStyle="xs">
                  {st.id}
                </Table.Cell>
                <Table.Cell>{st.name}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Stack>
    </Stack>
  );
}
