import { Command, Options } from "@effect/cli";
import { NodeHttpServer } from "@effect/platform-node";
import * as HttpRouter from "@effect/platform/HttpRouter";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { createServer } from "node:http";

import { SimulationHandlersLive } from "../../rpc/handlers.js";
import { SimulationRpcs } from "../../rpc/requests.js";

const portOpt = Options.integer("port").pipe(
  Options.withAlias("p"),
  Options.withDescription("Port to listen on"),
  Options.withDefault(3847),
);

const hostOpt = Options.text("host").pipe(
  Options.withAlias("h"),
  Options.withDescription("Host to bind to"),
  Options.withDefault("0.0.0.0"),
);

export const daemonCommand = Command.make(
  "daemon",
  {
    host: hostOpt,
    port: portOpt,
  },
  ({ host, port }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Starting WowLab simulation daemon ...`);
      yield* Effect.log(`Binding to ${host}:${port}`);

      // Create the RPC server layer
      const RpcLayer = RpcServer.layer(SimulationRpcs).pipe(
        Layer.provide(SimulationHandlersLive),
      );

      // Choose HTTP protocol with NDJSON serialization
      const HttpProtocol = RpcServer.layerProtocolHttp({
        path: "/rpc",
      }).pipe(Layer.provide(RpcSerialization.layerNdjson));

      // Create the main server layer
      const ServerLayer = HttpRouter.Default.serve().pipe(
        Layer.provide(RpcLayer),
        Layer.provide(HttpProtocol),
        Layer.provide(NodeHttpServer.layer(createServer, { port })),
      );

      yield* Effect.log(`RPC endpoint available at http://${host}:${port}/rpc`);
      yield* Effect.log(`Press Ctrl+C to stop the server`);
      yield* Effect.log("");

      // Launch the server (blocks forever until interrupted)
      yield* Layer.launch(ServerLayer);
    }),
);
