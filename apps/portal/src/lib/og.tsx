/* eslint-disable @next/next/no-img-element -- OG images can't use next/image */
import { greenDark, slateDark } from "@radix-ui/colors";
import { ImageResponse } from "next/og";

import { LOGO_SVG, svgToImageSrc } from "./svg";

const LOGO_SRC = svgToImageSrc(LOGO_SVG);

const accentGradient = `linear-gradient(90deg, ${greenDark.green9} 0%, ${greenDark.green8} 100%)`;

export const ogSize = {
  height: 630,
  width: 1200,
};

type OgArticleImageProps = {
  section: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
  tag?: string;
};

type OgSectionImageProps = {
  section: string;
  description: string;
};

export function createArticleOgImage({
  author,
  date,
  description,
  section,
  tag,
  title,
}: OgArticleImageProps) {
  const logoSrc = LOGO_SRC;

  return new ImageResponse(
    <div
      style={{
        background: slateDark.slate1,
        color: slateDark.slate12,
        display: "flex",
        flexDirection: "column",
        fontSize: 32,
        height: "100%",
        padding: "48px 64px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: accentGradient,
          height: "4px",
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "14px",
          marginBottom: "40px",
        }}
      >
        <img src={logoSrc} width={40} height={40} alt="" />
        <div
          style={{
            color: greenDark.green9,
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          WoW Lab
        </div>
        <div
          style={{
            color: slateDark.slate7,
            fontSize: 24,
          }}
        >
          /
        </div>
        <div
          style={{
            color: slateDark.slate11,
            fontSize: 24,
          }}
        >
          {section}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: "24px",
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
            color: slateDark.slate11,
            fontSize: 32,
            lineHeight: 1.3,
          }}
        >
          {description}
        </div>
      </div>

      {(author || date || tag) && (
        <div
          style={{
            alignItems: "center",
            color: slateDark.slate11,
            display: "flex",
            fontSize: 24,
          }}
        >
          {author && <span style={{ color: greenDark.green9 }}>{author}</span>}
          {author && date && <span style={{ margin: "0 12px" }}>·</span>}
          {date && <span>{date}</span>}
          {tag && (
            <>
              <span style={{ margin: "0 12px" }}>·</span>
              <span style={{ color: slateDark.slate7 }}>#{tag}</span>
            </>
          )}
        </div>
      )}
    </div>,
    { ...ogSize },
  );
}

export function createSectionOgImage({
  description,
  section,
}: OgSectionImageProps) {
  const logoSrc = LOGO_SRC;

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: slateDark.slate1,
        color: slateDark.slate12,
        display: "flex",
        flexDirection: "column",
        fontSize: 32,
        gap: "32px",
        height: "100%",
        justifyContent: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: accentGradient,
          height: "4px",
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />

      <img src={logoSrc} width={96} height={96} alt="" />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "16px",
        }}
      >
        <div
          style={{
            color: greenDark.green9,
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          WoW Lab
        </div>
        <div
          style={{
            color: slateDark.slate7,
            fontSize: 48,
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
          color: slateDark.slate11,
          fontSize: 26,
        }}
      >
        {description}
      </div>
    </div>,
    { ...ogSize },
  );
}
