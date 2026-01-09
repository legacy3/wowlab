import { ChevronRight } from "lucide-react";

import { Link } from "@/components/ui/link";

import styles from "./index.module.scss";

export interface Breadcrumb {
  readonly href?: string;
  readonly label: string;
}

export interface PageHeaderProps {
  readonly breadcrumbs?: Breadcrumb[];
  readonly description?: string;
  readonly title: string;
}

export function PageHeader({
  breadcrumbs,
  description,
  title,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.label}>
                {index > 0 && (
                  <ChevronRight
                    className={styles.separator}
                    width={14}
                    height={14}
                    aria-hidden
                  />
                )}
                {crumb.href ? (
                  <Link href={crumb.href} muted>
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  );
}
