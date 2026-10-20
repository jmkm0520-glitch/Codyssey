"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyboardEvent, MouseEvent } from "react";
import styles from "../app/page.module.css";

const tabs = [
  { id: "today", label: "오늘 기록", href: "/" },
  { id: "calendar", label: "캘린더", href: "/calendar" },
  { id: "stats", label: "통계", href: "/stats" },
] as const;

export function TabNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabs.find((tab) => tab.href === pathname)?.id ?? null;

  function preserveSelectedDate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (typeof window === "undefined" || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const date = new URLSearchParams(window.location.search).get("date");
    if (!date) return;

    event.preventDefault();
    router.push(`${href}?date=${date}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    const key = event.key;
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) return;

    event.preventDefault();
    const nextIndex =
      key === "Home"
        ? 0
        : key === "End"
          ? tabs.length - 1
          : (index + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  }

  return (
    <nav className={styles.tabNav} aria-label="화면 전환">
      {tabs.map((tab, index) => (
        <Link
          className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
          href={tab.href}
          id={`tab-${tab.id}`}
          key={tab.id}
          onClick={(event) => preserveSelectedDate(event, tab.href)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
