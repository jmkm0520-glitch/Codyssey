"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api";
import { formatEncouragement } from "@/lib/diary-text";
import styles from "./summary-diary.module.css";

type Result = { id: string; title: string; encouragement_text: string; diary_date: string; image_url: string };

export function SummaryDiary({ summaryId }: { summaryId: string }) {
  const { member } = useAuth();
  return member ? <MemberDiary key={`${member.id}:${summaryId}`} summaryId={summaryId} /> : null;
}

function MemberDiary({ summaryId }: { summaryId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState<"generate" | "save" | null>("generate");
  const requestInFlight = useRef(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const generate = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setPending("generate"); setError("");
    try {
      const nextResult = await apiFetch<Result>("/api/v1/diary-images", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary_id: summaryId }),
      });
      setResult(nextResult);
      setEntryId(null);
    } catch { setError("이미지를 만들지 못했어요. 다시 시도해 주세요."); }
    finally { requestInFlight.current = false; setPending(null); }
  }, [summaryId]);
  useEffect(() => {
    // Cancel the development effect replay before sending a paid generation request.
    const timer = window.setTimeout(() => void generate(), 0);
    return () => window.clearTimeout(timer);
  }, [generate]);
  async function save() {
    if (!result || requestInFlight.current) return;
    requestInFlight.current = true;
    setPending("save"); setError("");
    try {
      const entry = await apiFetch<{ id: string }>(`/api/v1/diary-results/${result.id}/collection-entry`, { method: "POST" });
      setEntryId(entry.id);
      router.push(`/collection#entry=${encodeURIComponent(entry.id)}`);
    } catch { setError("컬렉션에 저장하지 못했어요. 다시 시도해 주세요."); }
    finally { requestInFlight.current = false; setPending(null); }
  }
  return <PageShell page="talk" contentClassName={styles.content}><section className={styles.card}>
    {result ? <>
      <h1>{result.title}</h1><time dateTime={result.diary_date}>{result.diary_date}</time>
      <div className={styles.imageFrame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src={result.image_url} alt="AI가 대화 요약을 바탕으로 생성한 그림일기" />
        <span className={styles.aiBadge} aria-hidden="true">AI</span>
      </div>
      <p className={styles.encouragement}>{formatEncouragement(result.encouragement_text)}</p>
      {entryId && <p role="status">컬렉션에 저장했어요. <Link href={`/collection#entry=${entryId}`}>저장한 일기 보기</Link></p>}
      <div className={styles.actions}>
        {!entryId && <button type="button" disabled={pending !== null} onClick={() => void save()}>{pending === "save" ? "저장하는 중이에요…" : "컬렉션에 저장하기"}</button>}
        <button className={styles.secondary} type="button" disabled={pending !== null} onClick={() => void generate()}>{pending === "generate" ? "그림을 만들고 있어요…" : "다른 그림도 만들어보기"}</button>
      </div>
    </> : <>
      <h1>{pending ? "오늘의 마음을 그림으로 만들고 있어요" : "그림을 완성하지 못했어요"}</h1>
      {pending ? <p role="status">그림을 만들고 있어요… 잠시만 기다려 주세요.</p>
        : <button type="button" onClick={() => void generate()}>그림 다시 만들기</button>}
    </>}
    {error && <p role="alert">{error}</p>}
  </section></PageShell>;
}
