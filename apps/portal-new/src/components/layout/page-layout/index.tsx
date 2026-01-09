import { type Breadcrumb, PageHeader } from "../page-header";
import styles from "./index.module.scss";

export interface PageLayoutProps {
  readonly breadcrumbs?: Breadcrumb[];
  readonly children: React.ReactNode;
  readonly description?: string;
  readonly title: string;
}

export function PageLayout({
  breadcrumbs,
  children,
  description,
  title,
}: PageLayoutProps) {
  return (
    <div className={styles.container}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <hr className={styles.separator} />
      {children}
    </div>
  );
}
