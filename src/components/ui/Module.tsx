"use client";

import styles from "./Module.module.css";

export function Module({
  title,
  tabs,
  children,
  footer,
}: {
  title?: string;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const showHeader = Boolean(title || tabs);
  return (
    <section className={styles.module}>
      {showHeader ? (
        <header className={styles.header}>
          {title ? <h1 className={styles.title}>{title}</h1> : <span />}
          {tabs}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
      {footer ? <footer className={styles.footer}>{footer}</footer> : null}
    </section>
  );
}
