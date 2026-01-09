import { clsx } from "clsx";
import { ExternalLink } from "lucide-react";
import NextLink from "next/link";
import { forwardRef } from "react";

import styles from "./index.module.css";

type LinkProps = {
  href: string;
  external?: boolean;
  muted?: boolean;
  className?: string;
  title?: string;
  role?: string;
  children: React.ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, className, external, href, muted, role, title }, ref) => {
    const linkClass = clsx(
      styles.link,
      muted && styles.muted,
      external && styles.external,
      className,
    );

    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          role={role}
          className={linkClass}
        >
          {children}
          <ExternalLink className={styles.icon} />
        </a>
      );
    }

    return (
      <NextLink
        ref={ref}
        href={href}
        title={title}
        role={role}
        className={linkClass}
      >
        {children}
      </NextLink>
    );
  },
);
Link.displayName = "Link";
