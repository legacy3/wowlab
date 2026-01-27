import type { StaticImageData } from "next/image";

import {
  centrifugoImg,
  redisImg,
  websocketImg,
} from "./docs/images/references";

export type Reference = UrlRef | ArchivedRef | DoiRef;

type Archive = {
  screenshot: StaticImageData;
  accessedAt: string;
};

type ArchivedRef = { url: string; archive: Archive } & BaseRef;
type BaseRef = {
  authors: string;
  title: string;
  source: string;
  year: number;
};
type DoiRef = { doi: string } & BaseRef;

type UrlBuilder = {
  withArchive(screenshot: StaticImageData, accessedAt: string): ArchivedRef;
} & UrlRef;

type UrlRef = { url: string } & BaseRef;

export function hasArchive(ref: Reference): ref is ArchivedRef {
  return "archive" in ref;
}

export function hasDoi(ref: Reference): ref is DoiRef {
  return "doi" in ref;
}

export function hasUrl(ref: Reference): ref is UrlRef | ArchivedRef {
  return "url" in ref;
}

function ref(authors: string, title: string, source: string, year: number) {
  const base = { authors, source, title, year };

  return {
    doi(doi: string): DoiRef {
      return { ...base, doi };
    },

    url(urlValue: string): UrlBuilder {
      const urlRef: UrlRef = { ...base, url: urlValue };

      return {
        ...urlRef,
        withArchive(screenshot: StaticImageData, accessedAt: string): ArchivedRef {
          return { ...base, archive: { accessedAt, screenshot }, url: urlValue };
        },
      };
    },
  };
}

export const references: Record<string, Reference> = {
  centrifugo2024: ref(
    "Centrifugal Labs",
    "Centrifugo: Scalable real-time messaging server",
    "GitHub",
    2024,
  )
    .url("https://github.com/centrifugal/centrifugo")
    .withArchive(centrifugoImg, "2024-12-15"),

  ed25519: ref(
    "Daniel J. Bernstein, Niels Duif, Tanja Lange, Peter Schwabe, Bo-Yin Yang",
    "High-speed high-security signatures",
    "Journal of Cryptographic Engineering",
    2012,
  ).doi("10.1007/s13389-012-0027-1"),

  redis2024: ref(
    "Redis Ltd",
    "Redis: In-memory data structure store",
    "Redis Documentation",
    2024,
  )
    .url("https://redis.io/docs/")
    .withArchive(redisImg, "2024-12-15"),

  supabase2024: ref(
    "Supabase Inc",
    "Supabase: The open source Firebase alternative",
    "Supabase Documentation",
    2024,
  ).url("https://supabase.com/docs"),

  websocket: ref(
    "I. Fette, A. Melnikov",
    "The WebSocket Protocol",
    "RFC 6455, IETF",
    2011,
  )
    .url("https://datatracker.ietf.org/doc/html/rfc6455")
    .withArchive(websocketImg, "2024-12-15"),
};
