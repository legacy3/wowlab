import type { ReactNode } from "react";

import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import { helpText } from "styled-system/recipes";

import { Link } from "./link";
import { Tooltip } from "./tooltip";

const StyledSpan = styled(ark.span, helpText);

type HelpTextProps = {
  children: ReactNode;
  content: string;
  href?: string;
};

export function HelpText({ children, content, href }: HelpTextProps) {
  if (href) {
    return (
      <Tooltip content={content}>
        <Link
          href={href}
          variant="plain"
          className={helpText({ variant: "link" })}
        >
          {children}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={content}>
      <StyledSpan>{children}</StyledSpan>
    </Tooltip>
  );
}

export type { HelpTextProps };
