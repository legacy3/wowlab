"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/link";
import { navMain, navSecondary } from "@/lib/menu-config";
import { routes } from "@/lib/routes";
import styles from "./index.module.scss";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Link href={routes.home} className={styles.logo} muted>
          <strong>WoW Lab</strong>
        </Link>
      </div>

      <nav className={styles.nav}>
        <ul>
          {navMain.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              item.items.some((sub) => pathname === sub.href);

            return (
              <li key={item.href}>
                <details open={isActive}>
                  <summary>
                    <Icon width={16} height={16} />
                    {item.label}
                  </summary>
                  <ul>
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          aria-current={
                            pathname === sub.href ? "page" : undefined
                          }
                          muted
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>

        <hr />

        <ul>
          {navSecondary.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  muted
                >
                  <Icon width={16} height={16} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
