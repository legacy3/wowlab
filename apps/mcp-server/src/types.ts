import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface GetBatchArgs {
  ids: number[];
}

export interface GetByIdArgs {
  id: number;
}

export interface SearchArgs {
  limit?: number;
  query: string;
}

export type ToolResponse = CallToolResult;
