import NextLink from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkProps = {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Link({ href, external, className, children }: LinkProps) {
  const styles = cn("text-primary hover:underline", className);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(styles, "inline-flex items-center gap-1")}
      >
        {children}
        <ExternalLink className="h-3 w-3 opacity-50" />
      </a>
    );
  }

  return (
    <NextLink href={href} className={styles}>
      {children}
    </NextLink>
  );
}
