"use client";

import styles from "./index.module.scss";
import { sections } from "./sections";

export function DemoContent() {
  return (
    <div className={styles.container}>
      <nav className={styles.toc}>
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className={styles.section}>
          <h2>{section.title}</h2>
          <section.Content />
        </section>
      ))}
    </div>
  );
}
