import { QueryClient } from "@tanstack/react-query";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export class ReactQueryClient extends Context.Tag("ReactQueryClient")<
  ReactQueryClient,
  QueryClient
>() {}

export const ReactQueryClientLive = (client: QueryClient) =>
  Layer.succeed(ReactQueryClient, client);
