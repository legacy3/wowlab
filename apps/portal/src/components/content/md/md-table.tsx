import type { ReactNode } from "react";

import { Box } from "styled-system/jsx";

import * as Table from "@/components/ui/table";

type MdTableProps = {
  children: ReactNode;
};

export function MdTable({ children }: MdTableProps) {
  return (
    <Box my="6">
      <Table.Root size="md">{children}</Table.Root>
    </Box>
  );
}

export function MdTbody({ children }: MdTableProps) {
  return <Table.Body>{children}</Table.Body>;
}

export function MdTd({ children }: MdTableProps) {
  return <Table.Cell>{children}</Table.Cell>;
}

export function MdTh({ children }: MdTableProps) {
  return <Table.Header>{children}</Table.Header>;
}

export function MdThead({ children }: MdTableProps) {
  return <Table.Head>{children}</Table.Head>;
}

export function MdTr({ children }: MdTableProps) {
  return <Table.Row>{children}</Table.Row>;
}
