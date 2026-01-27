export type Term = {
  id: string;
  name: string;
  long?: string;
  description: string;
  link?: string;
};

type TermName = string | [short: string, long: string];

function term(
  id: string,
  name: TermName,
  description: string,
  link?: string,
): Term {
  if (Array.isArray(name)) {
    return { description, id, link, long: name[1], name: name[0] };
  }
  return { description, id, link, name };
}

export const terms: Record<string, Term> = {
  beacon: term(
    "beacon",
    "Beacon",
    "Our Centrifugo-based real-time messaging server that handles WebSocket connections and pub/sub messaging between clients and the platform.",
    "/dev/docs/networking/realtime-infrastructure",
  ),
};
