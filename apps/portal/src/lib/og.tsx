import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = {
  width: 1200,
  height: 630,
};

async function getLogo() {
  const logoData = await readFile(
    join(process.cwd(), "public/logo.svg"),
    "base64",
  );

  return `data:image/svg+xml;base64,${logoData}`;
}

type OgSectionImageProps = {
  section: string;
  description: string;
};

export async function createSectionOgImage({
  section,
  description,
}: OgSectionImageProps) {
  const logoSrc = await getLogo();

  return new ImageResponse(
    <div
      style={{
        fontSize: 32,
        background: "#09090b",
        color: "#fafafa",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
        }}
      />

      <img src={logoSrc} width={96} height={96} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#22c55e",
          }}
        >
          WoW Lab
        </div>
        <div
          style={{
            fontSize: 48,
            color: "#3f3f46",
          }}
        >
          /
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          {section}
        </div>
      </div>

      <div
        style={{
          fontSize: 26,
          color: "#71717a",
        }}
      >
        {description}
      </div>
    </div>,
    { ...ogSize },
  );
}

type OgArticleImageProps = {
  section: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
  tag?: string;
};

export async function createArticleOgImage({
  section,
  title,
  description,
  author,
  date,
  tag,
}: OgArticleImageProps) {
  const logoSrc = await getLogo();

  return new ImageResponse(
    <div
      style={{
        fontSize: 32,
        background: "#09090b",
        color: "#fafafa",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "48px 64px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "40px",
        }}
      >
        <img src={logoSrc} width={40} height={40} />
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#22c55e",
          }}
        >
          WoW Lab
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#3f3f46",
          }}
        >
          /
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#71717a",
          }}
        >
          {section}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            lineHeight: 1.3,
          }}
        >
          {description}
        </div>
      </div>

      {(author || date || tag) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            color: "#52525b",
          }}
        >
          {author && <span style={{ color: "#22c55e" }}>{author}</span>}
          {author && date && <span style={{ margin: "0 12px" }}>·</span>}
          {date && <span>{date}</span>}
          {tag && (
            <>
              <span style={{ margin: "0 12px" }}>·</span>
              <span style={{ color: "#3f3f46" }}>#{tag}</span>
            </>
          )}
        </div>
      )}
    </div>,
    { ...ogSize },
  );
}
