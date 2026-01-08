import { PageHeader, type Breadcrumb } from "../page-header";
import styles from "./index.module.scss";

export interface PageLayoutProps {
  readonly title: string;
  readonly description?: string;
  readonly breadcrumbs?: Breadcrumb[];
  readonly children: React.ReactNode;
}

export function PageLayout({
  title,
  description,
  breadcrumbs,
  children,
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
