import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import { helpText } from "styled-system/recipes";

import { Tooltip } from "./tooltip";

const StyledSpan = styled(ark.span, helpText);
const StyledAnchor = styled(ark.a, helpText);

export type HelpTextProps = SpanProps | AnchorProps;

type AnchorProps = {
  href: string;
} & BaseProps &
  Omit<ComponentProps<typeof StyledAnchor>, "content">;

type BaseProps = {
  /** Tooltip content shown on hover */
  content: string;
};

type SpanProps = {
  href?: undefined;
} & BaseProps &
  Omit<ComponentProps<typeof StyledSpan>, "content">;

export function HelpText({ children, content, href, ...props }: HelpTextProps) {
  if (href) {
    return (
      <Tooltip content={content}>
        <StyledAnchor
          href={href}
          variant="link"
          {...(props as Omit<ComponentProps<typeof StyledAnchor>, "content">)}
        >
          {children}
        </StyledAnchor>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={content}>
      <StyledSpan
        {...(props as Omit<ComponentProps<typeof StyledSpan>, "content">)}
      >
        {children}
      </StyledSpan>
    </Tooltip>
  );
}
