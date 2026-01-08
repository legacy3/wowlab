import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./index.module.scss";

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <Link href={routes.home} className={styles.logo}>
        <strong>WoW Lab</strong>
      </Link>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href={routes.simulate.index}>Simulate</Link>
          </li>
          <li>
            <Link href={routes.talents}>Talents</Link>
          </li>
          <li>
            <Link href={routes.demo}>Components</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
