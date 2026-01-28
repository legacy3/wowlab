import type { ReactNode } from "react";

import { Kbd } from "@/components/ui/kbd";

type MdKbdProps = {
  children: ReactNode;
};

export function MdKbd({ children }: MdKbdProps) {
  return <Kbd size="sm">{children}</Kbd>;
}
