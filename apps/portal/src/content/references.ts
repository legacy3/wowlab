export type Reference = {
  authors: string;
  title: string;
  source: string;
  year: number;
  url?: string;
  doi?: string;
};

export const references: Record<string, Reference> = {
  centrifugo2024: {
    authors: "Centrifugal Labs",
    source: "GitHub",
    title: "Centrifugo: Scalable real-time messaging server",
    url: "https://github.com/centrifugal/centrifugo",
    year: 2024,
  },
  ed25519: {
    authors:
      "Daniel J. Bernstein, Niels Duif, Tanja Lange, Peter Schwabe, Bo-Yin Yang",
    doi: "10.1007/s13389-012-0027-1",
    source: "Journal of Cryptographic Engineering",
    title: "High-speed high-security signatures",
    year: 2012,
  },
  redis2024: {
    authors: "Redis Ltd",
    source: "Redis Documentation",
    title: "Redis: In-memory data structure store",
    url: "https://redis.io/docs/",
    year: 2024,
  },
  supabase2024: {
    authors: "Supabase Inc",
    source: "Supabase Documentation",
    title: "Supabase: The open source Firebase alternative",
    url: "https://supabase.com/docs",
    year: 2024,
  },
  websocket: {
    authors: "I. Fette, A. Melnikov",
    source: "RFC 6455, IETF",
    title: "The WebSocket Protocol",
    url: "https://datatracker.ietf.org/doc/html/rfc6455",
    year: 2011,
  },
};
