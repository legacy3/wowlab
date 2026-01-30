"use client";

import type { LiveEvent, LiveProvider } from "@refinedev/core";

import { Centrifuge, type Subscription } from "centrifuge";

import { env } from "@/lib/env";
import { useLiveStore } from "@/lib/state/live";

import pkg from "../../../package.json";

async function getToken() {
  const res = await fetch("/api/centrifugo/token");
  if (!res.ok) {
    throw new Error("Failed to get token");
  }

  return (await res.json()).token;
}

const wsUrl = new URL("connection/websocket", env.CENTRIFUGO_URL).href;
const client = new Centrifuge(wsUrl, {
  getToken,
  name: pkg.name,
  version: pkg.version,
});

client.on("state", (ctx) => {
  useLiveStore.getState().setState(ctx.newState);
});

export const liveProvider: LiveProvider = {
  publish: async (event: LiveEvent) => {
    const sub = client.getSubscription(event.channel);
    if (sub) {
      await sub.publish(event);
    }
  },

  subscribe: ({ callback, channel, params, types }) => {
    const resource = params?.resource;
    const name = resource ? `${resource}:${params?.id ?? "all"}` : channel;

    let sub = client.getSubscription(name);
    if (!sub) {
      sub = client.newSubscription(name);
    }

    sub.on("publication", (ctx) => {
      const event: LiveEvent = {
        channel: name,
        date: new Date(),
        payload: ctx.data.payload,
        type: ctx.data.type ?? "updated",
      };

      if (types.includes("*") || types.includes(event.type)) {
        callback(event);
      }
    });

    sub.subscribe();
    client.connect();

    return sub;
  },

  unsubscribe: (sub: Subscription) => {
    client.removeSubscription(sub);
  },
};
