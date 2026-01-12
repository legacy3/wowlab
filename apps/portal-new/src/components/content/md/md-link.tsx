import type { ReactNode } from "react";

import { Link } from "@/components/ui/link";

type MdLinkProps = {
  href?: string;
  children: ReactNode;
};

export function MdLink({ children, href = "#" }: MdLinkProps) {
  const isExternal = href.startsWith("http");

  return (
    <Link
      href={href}
      {...(isExternal && { rel: "noopener noreferrer", target: "_blank" })}
    >
      {children}
    </Link>
  );
}
