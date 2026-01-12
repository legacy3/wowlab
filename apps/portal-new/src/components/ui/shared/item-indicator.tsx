"use client";

import type { HTMLStyledProps } from "styled-system/jsx";

import { CheckIcon } from "lucide-react";
import { type ComponentType, type ForwardedRef, forwardRef } from "react";

export function createItemIndicator<TContext extends { selected: boolean }>(
  StyledIndicator: ComponentType<
    { ref?: ForwardedRef<HTMLDivElement> } & HTMLStyledProps<"div">
  >,
  useItemContext: () => TContext,
) {
  return forwardRef<HTMLDivElement, HTMLStyledProps<"div">>(
    function ItemIndicator(props, ref) {
      const item = useItemContext();

      return item.selected ? (
        <StyledIndicator ref={ref} {...props}>
          <CheckIcon />
        </StyledIndicator>
      ) : (
        <svg aria-hidden="true" focusable="false" />
      );
    },
  );
}
