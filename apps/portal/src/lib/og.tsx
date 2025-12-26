import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CLASS_COLORS } from "./colors";

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

type OgRotationImageProps = {
  name: string;
  description: string | null;
  className: string;
  specName: string;
  author: string;
  version: number;
  updatedAt: string;
};

export async function createRotationOgImage({
  name,
  description,
  className,
  specName,
  author,
  version,
  updatedAt,
}: OgRotationImageProps) {
  const logoSrc = await getLogo();
  const classColor = CLASS_COLORS[className] || "#22c55e";

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
          background: `linear-gradient(90deg, ${classColor} 0%, ${classColor}99 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
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
            Rotations
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 20px",
            background: "#18181b",
            borderRadius: "9999px",
            border: `1px solid ${classColor}40`,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: classColor,
            }}
          >
            {className}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#52525b",
            }}
          >
            ·
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#a1a1aa",
            }}
          >
            {specName}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </div>

        {description && (
          <div
            style={{
              fontSize: 28,
              color: "#71717a",
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#52525b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>by</span>
          <span style={{ color: "#a1a1aa", fontWeight: 500 }}>{author}</span>
          <span style={{ color: "#3f3f46" }}>·</span>
          <span>updated {updatedAt}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            background: "#18181b",
            borderRadius: "6px",
          }}
        >
          <span style={{ color: "#71717a" }}>v</span>
          <span style={{ color: "#a1a1aa", fontWeight: 500 }}>{version}</span>
        </div>
      </div>
    </div>,
    { ...ogSize },
  );
}

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
