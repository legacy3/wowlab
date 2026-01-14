import type { ComponentProps } from "react";
import type { HTMLStyledProps } from "styled-system/jsx";

import { css, cx } from "styled-system/css";
import { splitCssProps } from "styled-system/jsx";
import { link, type LinkVariantProps } from "styled-system/recipes";

import { Link as IntlLink } from "@/i18n/navigation";

export type LinkProps = ComponentProps<typeof IntlLink> &
  LinkVariantProps &
  Omit<HTMLStyledProps<"a">, keyof ComponentProps<typeof IntlLink>>;

export function Link({ className, variant, ...props }: LinkProps) {
  const [cssProps, restProps] = splitCssProps(props);
  return (
    <IntlLink
      className={cx(link({ variant }), css(cssProps), className)}
      {...restProps}
    />
  );
}
