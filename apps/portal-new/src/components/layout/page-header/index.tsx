import { ChevronRight } from "lucide-react";
import { Link } from "@/components/ui/link";
import styles from "./index.module.scss";

export interface Breadcrumb {
  readonly label: string;
  readonly href?: string;
}

export interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: Breadcrumb[];
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
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
