/* eslint-disable perfectionist/sort-modules */

import { Rpc, RpcGroup } from "@effect/rpc";
import * as Schema from "effect/Schema";

/**
 * Schema for aggregated stats when running many simulations
 */
export class AggregatedStatsSchema extends Schema.Class<AggregatedStatsSchema>(
  "AggregatedStatsSchema",
)({
  avgCasts: Schema.Number,
  completedSims: Schema.Number,
  elapsedMs: Schema.Number,
  throughput: Schema.Number,
  totalCasts: Schema.Number,
}) {}

/**
 * Schema for a single simulation result
 */
export class SimulationResultSchema extends Schema.Class<SimulationResultSchema>(
  "SimulationResultSchema",
)({
  casts: Schema.Number,
  duration: Schema.Number,
  simId: Schema.Number,
}) {}

/**
 * Schema for the full simulation response
 */
export class RunSimulationResponse extends Schema.Class<RunSimulationResponse>(
  "RunSimulationResponse",
)({
  sampleResults: Schema.Array(SimulationResultSchema),
  stats: AggregatedStatsSchema,
}) {}

/**
 * RPC group for simulation-related procedures
 */
export class SimulationRpcs extends RpcGroup.make(
  /**
   * Run a simulation with the specified parameters
   */
  Rpc.make("RunSimulation", {
    error: Schema.String,
    payload: {
      batchSize: Schema.Number,
      duration: Schema.Number,
      iterations: Schema.Number,
      rotation: Schema.String,
    },
    success: RunSimulationResponse,
  }),

  /**
   * Get the list of available rotations
   */
  Rpc.make("ListRotations", {
    success: Schema.Array(Schema.String),
  }),

  /**
   * Health check for the server
   */
  Rpc.make("HealthCheck", {
    success: Schema.Struct({
      status: Schema.Literal("ok"),
      uptime: Schema.Number,
    }),
  }),
) {}
