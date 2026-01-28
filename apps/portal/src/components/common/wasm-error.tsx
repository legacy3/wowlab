"use client";

import { css } from "styled-system/css";
import { Grid, Stack } from "styled-system/jsx";

import {
  BraveIcon,
  ChromeIcon,
  EdgeIcon,
  FirefoxIcon,
  OperaIcon,
  SafariIcon,
} from "@/lib/icons";

const browsers = [
  { icon: ChromeIcon, name: "Chrome" },
  { icon: FirefoxIcon, name: "Firefox" },
  { icon: SafariIcon, name: "Safari" },
  { icon: EdgeIcon, name: "Edge" },
  { icon: BraveIcon, name: "Brave" },
  { icon: OperaIcon, name: "Opera" },
];

export function WasmError() {
  return (
    <Stack gap="6" align="center" py="12" textAlign="center">
      <Stack gap="2">
        <h2 className={css({ fontWeight: "semibold", textStyle: "xl" })}>
          WebAssembly Required
        </h2>
        <p className={css({ color: "fg.muted", maxW: "md", textStyle: "sm" })}>
          This feature requires WebAssembly. Enable JavaScript and WASM in your
          browser, or check your extensions.
        </p>
      </Stack>
      <Grid columns={{ base: 3, md: 6 }} gap="3">
        {browsers.map(({ icon: Icon, name }) => (
          <a
            key={name}
            href={getHelpUrl(name)}
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              _hover: { bg: "bg.muted" },
              alignItems: "center",
              bg: "bg.subtle",
              borderRadius: "l2",
              display: "flex",
              flexDirection: "column",
              gap: "2",
              p: "3",
              transition: "background 0.15s",
            })}
          >
            <Icon className={css({ color: "fg.muted", h: "8", w: "8" })} />
            <span className={css({ color: "fg.subtle", textStyle: "xs" })}>
              {name}
            </span>
          </a>
        ))}
      </Grid>
    </Stack>
  );
}

function getHelpUrl(browser: string) {
  const helpText = `How to enable WebAssembly in ${browser}`;
  const query = encodeURIComponent(helpText);

  return `https://www.google.com/search?q=${query}`;
}
