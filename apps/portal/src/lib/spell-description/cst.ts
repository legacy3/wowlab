export type Token = {
  readonly image: string;
  readonly startOffset: number;
  readonly tokenType: { readonly name: string };
  readonly tokenTypeIdx: number;
};

export type CstNode = {
  readonly name: string;
  readonly children: Record<string, Array<CstNode | Token>>;
};

export function isCstNode(value: unknown): value is CstNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const name = Reflect.get(value, "name");
  const children = Reflect.get(value, "children");

  return (
    typeof name === "string" &&
    typeof children === "object" &&
    children !== null
  );
}

export function isToken(value: unknown): value is Token {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const image = Reflect.get(value, "image");
  const startOffset = Reflect.get(value, "startOffset");
  const tokenType = Reflect.get(value, "tokenType");
  const tokenTypeIdx = Reflect.get(value, "tokenTypeIdx");

  return (
    typeof image === "string" &&
    typeof startOffset === "number" &&
    typeof tokenType === "object" &&
    tokenType !== null &&
    typeof Reflect.get(tokenType, "name") === "string" &&
    typeof tokenTypeIdx === "number"
  );
}

export function getTokens(
  ctx: Record<string, unknown>,
  key: string,
): ReadonlyArray<Token> {
  const v = ctx[key];
  if (!Array.isArray(v)) {
    return [];
  }

  return v.filter(isToken);
}

export function getTokenImages(
  ctx: Record<string, unknown>,
  key: string,
): ReadonlyArray<string> {
  return getTokens(ctx, key).map((t) => t.image);
}

export function hasToken(ctx: Record<string, unknown>, key: string): boolean {
  return getTokens(ctx, key).length > 0;
}

export function getNodes(
  ctx: Record<string, unknown>,
  key: string,
): ReadonlyArray<CstNode> {
  const v = ctx[key];
  if (!Array.isArray(v)) {
    return [];
  }

  return v.filter(isCstNode);
}

export function firstNode(
  ctx: Record<string, unknown>,
  key: string,
): CstNode | undefined {
  return getNodes(ctx, key)[0];
}

export function firstTokenImage(
  ctx: Record<string, unknown>,
  key: string,
): string | undefined {
  return getTokens(ctx, key)[0]?.image;
}

export function splitArgs(text: string): ReadonlyArray<string> {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function extractLeadingNumber(text: string): number | undefined {
  const m = text.match(/-?\d+(?:\.\d+)?/);

  return m ? Number(m[0]) : undefined;
}

// TODO Find some lib that does stuff like this + pularization etc
export function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}
