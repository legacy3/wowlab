import { Link } from "@/components/ui/link";
import { routes } from "@/lib/routes";

import { AuthButton } from "../auth-button";
import styles from "./index.module.scss";

export function Navbar() {
  return (
    <header className={styles.navbar}>
      <Link href={routes.home} className={styles.logo} muted>
        <strong>WoW Lab</strong>
      </Link>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href={routes.simulate.index} muted>
              Simulate
            </Link>
          </li>
          <li>
            <Link href={routes.talents} muted>
              Talents
            </Link>
          </li>
          <li>
            <Link href={routes.demo} muted>
              Components
            </Link>
          </li>
        </ul>
      </nav>
      <AuthButton />
    </header>
  );
}
