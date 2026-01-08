import Link from "next/link";
import styles from "./index.module.scss";

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <strong>WoW Lab</strong>
      </Link>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/simulate">Simulate</Link>
          </li>
          <li>
            <Link href="/talents">Talents</Link>
          </li>
          <li>
            <Link href="/demo">Components</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
