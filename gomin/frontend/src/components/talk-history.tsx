"use client";

import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-feedback";
import { useEffect, useRef, useState } from "react";
import { talkApi } from "@/lib/talk-api";
import { groupTalkHistory, type UnsavedConversation } from "@/lib/talk-history";
import styles from "./talk-history.module.css";

export function TalkHistory({ currentId }: { currentId?: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<UnsavedConversation[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const toggle = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && container.current && !container.current.contains(event.target)) {
        // Keep focus on the outside control the user just selected.
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    talkApi.listUnsaved().then(
      (items) => { if (active) setHistory(items); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, [open, attempt]);
  function close() { setOpen(false); toggle.current?.focus(); }
  function toggleHistory() {
    if (!open) { setHistory(null); setError(false); }
    setOpen(!open);
  }
  return <div ref={container} className={styles.history} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}>
    <button ref={toggle} className={styles.toggle} type="button" aria-expanded={open} aria-controls="talk-history" aria-label={open ? "미저장 대화 목록 접기" : "미저장 대화 목록 펼치기"} onClick={toggleHistory}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16M13 9h4M13 13h4" /></svg>
    </button>
    {open ? <aside id="talk-history" className={styles.panel} aria-label="미저장 대화">
      <div className={styles.toolbar}><button type="button" onClick={close} aria-label="미저장 대화 목록 닫기">×</button></div>
      <nav className={styles.serviceLinks} aria-label="서비스 메뉴">
        <Link href="/" onClick={close}>홈</Link>
        <Link href="/guide" onClick={close}>가이드</Link>
        <Link href="/collection" onClick={close}>컬렉션</Link>
      </nav>
      <Link className={styles.newTalk} href="/talk" prefetch={false} onClick={close} onNavigate={(event) => {
        // The first send updates history without replacing the /talk route tree.
        // A fresh document guarantees a new controller even from that same tree.
        event.preventDefault();
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Reset the in-memory controller when /talk is already the route tree.
        window.location.assign("/talk");
      }}>새 이야기 시작하기 <span aria-hidden="true">＋</span></Link>
      {error ? <div role="alert"><p>대화 목록을 불러오지 못했어요.</p><button className={styles.retry} type="button" onClick={() => { setHistory(null); setError(false); setAttempt(n => n + 1); }}>다시 불러오기</button></div>
        : history === null ? <LoadingSpinner label="이전 대화 불러오는 중" />
        : history.length === 0 ? null
        : <nav aria-label="미저장 대화 목록">{groupTalkHistory(history).map(group => <section key={group.date}>
          <h3>{group.date}</h3><ul>{group.items.map(item => <li key={item.id}><Link href={`/talk/${item.id}`} aria-current={currentId === item.id ? "page" : undefined} onClick={close}>{item.title}</Link></li>)}</ul>
        </section>)}</nav>}
    </aside> : null}
  </div>;
}
