"use client";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { TabNav } from "../../components/TabNav";
import { SiteMenuButton } from "../../components/AuthGate";
import { ApiClientError, fetchApi } from "../../services/apiClient";
import { formatLocalDate } from "../../services/date";
import { saveLocalMeal, saveLocalWeight } from "../../services/localDayStorage";
import { ImportPreview, parseDietCsv } from "../../services/spreadsheetImport";
import styles from "./page.module.css";

type Result = { days: number; weights: number; meals: number };

export default function ImportPage() {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage("");
    if (!file) return;
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 2 * 1024 * 1024) {
      setPreview({
        rows: [],
        skipped: 0,
        issues: [{ row: 1, message: "2MB 이하 CSV 파일만 선택해 주세요." }],
      });
      return;
    }
    setPreview(parseDietCsv(await file.text(), formatLocalDate()));
  }

  async function runImport() {
    if (!preview?.rows.length || preview.issues.length) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await fetchApi<Result>("/api/import_data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.rows }),
      });
      setMessage(
        `${result.days}일의 체중 ${result.weights}건, 식단 ${result.meals}건을 가져왔습니다.`,
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        preview.rows.forEach((row) => {
          if (row.weight !== null) saveLocalWeight(row.date, row.weight);
          row.meals.forEach((meal) => saveLocalMeal(row.date, meal.meal, meal.food, meal.type));
        });
        const meals = preview.rows.reduce((sum, row) => sum + row.meals.length, 0);
        setMessage(
          `${preview.rows.length}일의 데이터를 이 브라우저에 가져왔습니다. 식단 ${meals}건이 포함됩니다.`,
        );
      } else setMessage("가져오기에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.siteHeader}>
        <Link className={styles.brand} href="/">
          <Image
            className={styles.brandMark}
            src="/broccoli-logo.png"
            alt=""
            width={52}
            height={52}
          />
          <span>오늘도 가볍게</span>
        </Link>
        <div className={styles.headerActions}>
          <TabNav />
          <SiteMenuButton />
        </div>
      </header>
      <section className={styles.content}>
        <p className={styles.eyebrow}>CSV IMPORT</p>
        <h1>다이어트일지 가져오기</h1>
        <p className={styles.lead}>
          다이어트 CSV 형식을 식단과 체중 기록으로 변환합니다. 기존의 같은 날짜 기록은 새 값으로
          갱신됩니다.
        </p>
        <div className={styles.mapping}>
          <strong>변환 기준</strong>
          <span>9-11시 → 아침</span>
          <span>11-3시 → 점심</span>
          <span>3-6시 → 간식</span>
          <span>6-8시 → 저녁</span>
          <span>결식 → 기록 없음</span>
        </div>
        <label className={styles.dropzone}>
          <span>{fileName || "CSV 파일을 선택하세요"}</span>
          <small>최대 2MB · .csv</small>
          <input type="file" accept=".csv,text/csv" onChange={chooseFile} />
        </label>
        {preview ? (
          <section className={styles.preview} aria-live="polite">
            <div>
              <h2>변환 미리보기</h2>
              <p>
                가져올 날짜 {preview.rows.length}일 · 제외된 메모/빈 행 {preview.skipped}개
              </p>
            </div>
            {preview.issues.length ? (
              <div className={styles.errors}>
                <strong>수정이 필요한 항목 {preview.issues.length}개</strong>
                {preview.issues.slice(0, 8).map((issue) => (
                  <p key={`${issue.row}-${issue.message}`}>
                    {issue.row}행: {issue.message}
                  </p>
                ))}
              </div>
            ) : null}
            {preview.rows.length ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>체중</th>
                      <th>식단 수</th>
                      <th>자유식</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.weight ?? "-"}</td>
                        <td>{row.meals.length}</td>
                        <td>{row.meals.filter((meal) => meal.type === "free").length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 10 ? <p>외 {preview.rows.length - 10}일</p> : null}
              </div>
            ) : null}
            <button
              className={styles.importButton}
              type="button"
              disabled={busy || !preview.rows.length || Boolean(preview.issues.length)}
              onClick={runImport}
            >
              {busy ? "가져오는 중…" : "데이터 가져오기"}
            </button>
            {message ? (
              <p className={styles.message} role="status">
                {message}
              </p>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
