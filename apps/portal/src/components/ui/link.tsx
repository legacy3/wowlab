"use client";

import type { ComponentProps } from "react";
import type { HTMLStyledProps } from "styled-system/jsx";

import { useLocale } from "next-intlayer";
import NextLink from "next/link";
import { css, cx } from "styled-system/css";
import { splitCssProps } from "styled-system/jsx";
import { link, type LinkVariantProps } from "styled-system/recipes";

import { getLocalizedUrl } from "@/lib/routing";

const isExternal = (href?: string) => /^https?:\/\//.test(href ?? "");
const isHashOnly = (href?: string) => href?.startsWith("#") ?? false;

export type LinkProps = ComponentProps<typeof NextLink> &
  LinkVariantProps &
  Omit<HTMLStyledProps<"a">, keyof ComponentProps<typeof NextLink>>;

export function Link({ className, href, variant, ...props }: LinkProps) {
  const { locale } = useLocale();
  const [cssProps, restProps] = splitCssProps(props);

  const hrefString = href?.toString();
  const shouldLocalize =
    href && !isExternal(hrefString) && !isHashOnly(hrefString);
  const localizedHref = shouldLocalize
    ? getLocalizedUrl(hrefString!, locale)
    : href;

  return (
    <NextLink
      href={localizedHref ?? ""}
      className={cx(link({ variant }), css(cssProps), className)}
      {...restProps}
    />
  );
}
