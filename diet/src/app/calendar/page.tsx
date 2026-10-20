import Image from "next/image";
import Link from "next/link";

import styles from "../page.module.css";
import { CalendarView } from "../../components/CalendarView";
import { TabNav } from "../../components/TabNav";
import { SiteMenuButton } from "../../components/AuthGate";

export default function CalendarPage() {
  return (
    <main className={`${styles.main} ${styles.referenceDashboard} ${styles.secondaryDashboard}`}>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/" aria-label="오늘도 가볍게 홈">
          <Image
            className={styles.brandMark}
            src="/broccoli-logo.png"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span>오늘도 가볍게</span>
        </Link>
        <div className={styles.headerActions}>
          <TabNav />
          <SiteMenuButton />
        </div>
      </header>
      <CalendarView />
    </main>
  );
}
