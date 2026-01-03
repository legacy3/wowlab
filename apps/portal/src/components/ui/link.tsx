import { forwardRef } from "react";
import NextLink from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkProps = {
  href: string;
  external?: boolean;
  className?: string;
  title?: string;
  children: React.ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, external, className, title, children }, ref) => {
    const styles = cn("text-primary hover:underline", className);

    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          className={cn(styles, "inline-flex items-center gap-1")}
        >
          {children}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
      );
    }

    return (
      <NextLink ref={ref} href={href} title={title} className={styles}>
        {children}
      </NextLink>
    );
  },
);
Link.displayName = "Link";
