"use client";

import type { ComponentProps } from "react";
import type { HTMLStyledProps } from "styled-system/jsx";

import { useLocale } from "next-intlayer";
import NextLink from "next/link";
import { css, cx } from "styled-system/css";
import { splitCssProps } from "styled-system/jsx";
import { link, type LinkVariantProps } from "styled-system/recipes";

import { getLocalizedUrl } from "@/lib/routing";

const checkIsExternalLink = (href?: string): boolean =>
  /^https?:\/\//.test(href ?? "");

export type LinkProps = ComponentProps<typeof NextLink> &
  LinkVariantProps &
  Omit<HTMLStyledProps<"a">, keyof ComponentProps<typeof NextLink>>;

export function Link({ className, href, variant, ...props }: LinkProps) {
  const { locale } = useLocale();
  const [cssProps, restProps] = splitCssProps(props);

  const isExternal = checkIsExternalLink(href?.toString());
  const localizedHref =
    href && !isExternal ? getLocalizedUrl(href.toString(), locale) : href;

  return (
    <NextLink
      href={localizedHref ?? ""}
      className={cx(link({ variant }), css(cssProps), className)}
      {...restProps}
    />
  );
}
