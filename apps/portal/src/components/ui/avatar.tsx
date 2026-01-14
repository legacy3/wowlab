"use client";

import { Avatar } from "@ark-ui/react/avatar";
import { UserIcon } from "lucide-react";
import { type ComponentProps, forwardRef } from "react";
import { createStyleContext } from "styled-system/jsx";
import { avatar } from "styled-system/recipes";

const { withContext, withProvider } = createStyleContext(avatar);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Avatar.Root, "root");
export const RootProvider = withProvider(Avatar.RootProvider, "root");
export const Image = withContext(Avatar.Image, "image", {
  defaultProps: {
    draggable: "false",
    referrerPolicy: "no-referrer",
  },
});

export { AvatarContext as Context } from "@ark-ui/react/avatar";

export interface FallbackProps extends ComponentProps<typeof StyledFallback> {
  initials?: string | undefined;
}

const StyledFallback = withContext(Avatar.Fallback, "fallback");

export const Fallback = forwardRef<HTMLDivElement, FallbackProps>(
  function Fallback(props, ref) {
    const { asChild, children, initials, ...rest } = props;

    const fallbackContent =
      children || asChild ? children : initials ? initials : <UserIcon />;

    return (
      <StyledFallback ref={ref} {...rest}>
        {fallbackContent}
      </StyledFallback>
    );
  },
);
