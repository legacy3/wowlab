import { Navbar } from "../navbar";
import { Sidebar } from "../sidebar";
import styles from "./index.module.scss";

export interface SiteShellProps {
  readonly children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
