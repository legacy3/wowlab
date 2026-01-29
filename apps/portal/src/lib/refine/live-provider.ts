import type {
  LiveEvent,
  LiveProvider as RefineLifeProvider,
} from "@refinedev/core";

import { Centrifuge, type Subscription } from "centrifuge";

import { useLiveStore } from "@/lib/state/live";
import pkg from "../../../package.json";

let client: Centrifuge | null = null;
const subs = new Map<string, Subscription>();

function getClient() {
  if (!client) {
    const url =
      process.env.NEXT_PUBLIC_CENTRIFUGO_URL ??
      "wss://beacon.wowlab.gg/connection/websocket";

    client = new Centrifuge(url, {
      getToken,
      name: pkg.name,
      version: pkg.version,
    });

    client.on("state", (ctx) => {
      useLiveStore.getState().setState(ctx.newState);
    });

    client.connect();
  }

  return client;
}

async function getToken() {
  const res = await fetch("/api/centrifugo/token");
  if (!res.ok) {
    throw new Error("Failed to get Centrifugo token");
  }

  return (await res.json()).token;
}

export const liveProvider: RefineLifeProvider = {
  publish: () => Promise.resolve(),

  subscribe: ({ callback, channel, params, types }) => {
    const c = getClient();
    const channelName = params?.id
      ? `${params.resource}:${params.id}`
      : (params?.resource ?? channel);

    const existing = subs.get(channelName);
    if (existing) {
      return Promise.resolve({ channel: channelName });
    }

    const sub = c.newSubscription(channelName);
    sub.on("publication", (ctx) => {
      const event: LiveEvent = {
        channel: channelName,
        date: new Date(),
        payload: ctx.data.payload,
        type: ctx.data.type ?? "updated",
      };
      if (!types || types.includes("*") || types.includes(event.type)) {
        callback(event);
      }
    });

    sub.subscribe();
    subs.set(channelName, sub);
    return Promise.resolve({ channel: channelName });
  },

  unsubscribe: ({ channel }) => {
    subs.get(channel)?.unsubscribe();
    subs.delete(channel);
    return Promise.resolve();
  },
};
