import type { ReactNode } from "react";

import { Icon as UiIcon } from "@/components/ui/icon";

type MdIconProps = {
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
};

export function MdIcon({ children, color, size = "md" }: MdIconProps) {
  return (
    <UiIcon size={size} color={color}>
      {children}
    </UiIcon>
  );
}
