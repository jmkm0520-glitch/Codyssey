"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Skeleton } from "@/components/loading-feedback";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/providers/auth-provider";
import {
  COLLECTION_PAGE_SIZE, createCollectionController,
  visibleCollectionItems, type CollectionDetail, type CollectionImage,
} from "@/lib/collection";
import { createApiCollectionRepository } from "@/lib/collection-api";
import { formatEncouragement } from "@/lib/diary-text";
import { filmPerforations } from "@/lib/collection-film";
import styles from "./collection-gallery.module.css";

const mobileQuery = "(max-width: 767px)";
const subscribeViewport = (listener: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverViewport = () => false;
const cardPositions = [
  { x: 80, y: 103, angle: 8 }, { x: 440, y: 142, angle: 5 },
  { x: 800, y: 162, angle: 1.6 }, { x: 1160, y: 162, angle: -1.6 },
  { x: 1520, y: 142, angle: -5 }, { x: 1880, y: 103, angle: -8 },
];
const formatDate = (date: string, weekday = false) => {
  const [year, month, day] = date.split("-");
  const label = `${year}. ${month}. ${day}`;
  const week = ["일", "월", "화", "수", "목", "금", "토"][new Date(`${date}T00:00:00Z`).getUTCDay()];
  return weekday ? `${label} (${week})` : label;
};

function RecordImage({ image, hero = false, onError }: { image: CollectionImage; hero?: boolean; onError?: () => void }) {
  return <div className={`${styles.photo} ${hero ? styles.heroPhoto : ""}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.src} alt="AI가 생성한 고민일기 이미지" onError={onError} />
    <span className={styles.aiBadge} aria-hidden="true">AI</span>
  </div>;
}

function DetailImage({ preview, refreshed, loading }: {
  preview?: CollectionImage; refreshed?: CollectionImage; loading: boolean;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const image = [preview, refreshed].find((candidate) => candidate && !failedSources.includes(candidate.src));
  if (image) return <RecordImage image={image} hero onError={() => setFailedSources((sources) => [...sources, image.src])} />;
  if (loading) return <Skeleton className={styles.detailImageSkeleton} />;
  return preview || refreshed ? <div className={styles.imageError} role="alert">이미지를 불러오지 못했어요.</div> : null;
}

function AssetIcon({ name }: { name: string }) {
  // Preserve Figma SVG root geometry and scale its wrapper, never the SVG dimensions.
  return <span className={styles.iconSlot} aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/images/collection/${name}.svg`} alt="" />
  </span>;
}

function DetailContent({ detail }: { detail: CollectionDetail }) {
  return <>
    <header className={styles.detailHeading}>
      <time dateTime={detail.date}>{formatDate(detail.date, true)}</time>
      <div className={styles.titleRow}><h2 id="collection-detail-title">{detail.title}</h2><AssetIcon name="title-leaf" /></div>
      <p>{formatEncouragement(detail.caption)}</p>
    </header>
    <div className={styles.summaryCards}>
      <section className={`${styles.summaryCard} ${styles.mind}`}>
        <AssetIcon name="heart" /><div><h3>지금의 마음</h3><p>{detail.mind}</p></div>
      </section>
      <section className={`${styles.summaryCard} ${styles.concern}`}>
        <AssetIcon name="sprout" /><div><h3>주요 고민</h3><ul>{detail.concerns.map((text) => <li key={text}>{text}</li>)}</ul></div>
      </section>
      <section className={`${styles.summaryCard} ${styles.emotions}`}>
        <AssetIcon name="cloud" /><div><h3>자주 느끼는 감정</h3><ul className={styles.emotionTags}>{detail.emotions.map((text) => <li key={text}>{text}</li>)}</ul></div>
      </section>
    </div>
  </>;
}

function DetailSkeleton() {
  return <div role="status" aria-label="이야기 불러오는 중">
    <div className={styles.detailHeading} aria-hidden="true">
      <Skeleton className={styles.skeletonDate} />
      <Skeleton className={styles.skeletonTitle} />
      <Skeleton className={styles.skeletonCaption} />
      <Skeleton className={styles.skeletonCaption} />
    </div>
    <div className={styles.summaryCards} aria-hidden="true">
      {[styles.mind, styles.concern, styles.emotions].map((kind) => <div key={kind} className={`${styles.summaryCard} ${kind}`}>
        <Skeleton className={styles.skeletonIcon} /><div>
          <Skeleton className={styles.skeletonLabel} />
          <Skeleton className={styles.skeletonLine} /><Skeleton className={styles.skeletonLineShort} />
        </div>
      </div>)}
    </div>
  </div>;
}

function CardSkeleton() {
  return <><Skeleton className={styles.photo} /><Skeleton className={styles.cardSkeletonDate} /><Skeleton className={styles.cardSkeletonTitle} /></>;
}

export function CollectionGallery() {
  const { member } = useAuth();
  return member ? <MemberCollection key={member.id} memberId={member.id} /> : null;
}

function MemberCollection({ memberId }: { memberId: string }) {
  const [controller] = useState(() => createCollectionController(memberId, createApiCollectionRepository()));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getServerSnapshot);
  const isMobile = useSyncExternalStore(subscribeViewport, mobileSnapshot, serverViewport);
  const dialog = useRef<HTMLDialogElement>(null);
  const canvasWrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [scale, setScale] = useState(1);
  const items = visibleCollectionItems(state);
  const start = state.page * COLLECTION_PAGE_SIZE;
  const pageItems = items.slice(start, start + COLLECTION_PAGE_SIZE);
  const selected = state.selectedId !== null;
  const listLoading = state.status === "loading";
  const detailLoading = state.detailStatus === "loading";
  const previewImage = state.detailNotFound ? undefined : state.items.find((item) => item.id === state.selectedId)?.image;
  const detailImage = <DetailImage key={state.selectedId} preview={previewImage} refreshed={state.detail?.image} loading={detailLoading} />;

  useEffect(() => {
    void controller.load();
    const restore = () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const id = hash.get("entry");
      if (id) void controller.select(id);
      else { controller.close(); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); }
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => { window.removeEventListener("popstate", restore); controller.dispose(); };
  }, [controller]);

  useEffect(() => {
    const wrapper = canvasWrapper.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 2280));
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [state.status]);

  useEffect(() => {
    if (selected && !isMobile && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected, isMobile]);

  const close = () => {
    if (window.history.state?.collectionEntry === state.selectedId) window.history.back();
    else {
      const url = new URL(window.location.href); url.hash = "";
      window.history.replaceState(window.history.state, "", url);
      controller.close(); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
    }
  };
  const open = (id: string, button: HTMLButtonElement) => {
    trigger.current = button;
    const url = new URL(window.location.href); url.hash = new URLSearchParams({ entry: id }).toString();
    window.history.pushState({ ...window.history.state, collectionEntry: id }, "", url);
    void controller.select(id);
  };
  const detailBody = state.detailStatus === "loading"
    ? <DetailSkeleton />
    : state.detailStatus === "error"
      ? <div className={styles.detailState} role="alert">
        <h2 id="collection-detail-title">{state.detailNotFound ? "기록을 찾을 수 없어요." : "이야기를 불러오지 못했어요."}</h2>
        <p>{state.detailNotFound ? "컬렉션으로 돌아가 다른 이야기를 골라 주세요." : "연결을 확인하고 다시 시도해 주세요."}</p>
        {!state.detailNotFound && <button type="button" onClick={() => void controller.select(state.selectedId!)}>다시 시도</button>}
      </div>
      : state.detail && <DetailContent detail={state.detail} />;

  return <PageShell page="collection" contentClassName={styles.content}>
    <div className={styles.gallery} inert={isMobile && selected} aria-hidden={isMobile && selected ? true : undefined}>
      <header className={styles.intro}>
        <h1>지금까지의 모든 이야기가,<br />하나의 컬렉션으로 모여요.</h1>
        <p>작은 고민도, 소중한 하루도.<br />여기, 나만의 필름 속에.</p>
      </header>
      {state.status === "error" ? <div className={styles.feedback} role="alert">
          <h2>컬렉션을 불러오지 못했어요.</h2><p>연결을 확인하고 다시 시도해 주세요.</p>
          <button type="button" onClick={() => void controller.load()}>다시 시도</button>
        </div>
          : !listLoading && !items.length ? <div className={styles.feedback}>
            <h2>{state.items.length ? "이 감정의 이야기는 아직 없어요." : "아직 모아둔 이야기가 없어요."}</h2>
            <p>{state.items.length ? "다른 감정을 골라 이야기를 만나보세요." : "오늘의 마음을 털어놓고, 첫 번째 이야기를 남겨보세요."}</p>
            {state.items.length ? <button type="button" onClick={() => controller.filter("전체")}>전체 이야기 보기</button> : <Link href="/talk">털어놓기 시작하기</Link>}
          </div>
            : <>
              <section className={styles.desktopFilm} aria-label="고민일기 필름" aria-busy={listLoading} hidden={isMobile}>
                <button className={`${styles.arrow} ${styles.previous}`} type="button" aria-label="이전 기록" disabled={listLoading || state.page === 0} onClick={() => controller.move(-1)}>‹</button>
                <div className={styles.filmWrapper} ref={canvasWrapper}>
                  <div className={styles.filmCanvas} style={{ transform: `scale(${scale})` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.ribbon} src="/images/collection/film.svg" alt="" />
                    {filmPerforations.map((hole, index) => <span key={index} aria-hidden="true" className={styles.perforation}
                      style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }}><i style={{ transform: `rotate(${hole.angle}deg)` }} /></span>)}
                    {listLoading && cardPositions.map((position, index) => <div key={index} className={styles.filmCard} aria-hidden="true"
                      style={{ left: position.x, top: position.y, transform: `rotate(${position.angle}deg)` }}><CardSkeleton /></div>)}
                    {!listLoading && pageItems.map((item, index) => <button type="button" key={item.id} className={styles.filmCard}
                      style={{ left: cardPositions[index].x, top: cardPositions[index].y, transform: `rotate(${cardPositions[index].angle}deg)` }}
                      aria-label={`${formatDate(item.date)} ${item.title}, AI가 생성한 이미지 상세 보기`} onClick={(event) => open(item.id, event.currentTarget)}>
                      <RecordImage image={item.image} /><time dateTime={item.date}>{formatDate(item.date)}</time><span>{item.title}</span>
                    </button>)}
                  </div>
                </div>
                <button className={`${styles.arrow} ${styles.next}`} type="button" aria-label="다음 기록" disabled={listLoading || start + COLLECTION_PAGE_SIZE >= items.length} onClick={() => controller.move(1)}>›</button>
                <span className={styles.srOnly} role="status">{listLoading ? "컬렉션 불러오는 중" : `${items.length}개 중 ${start + 1}부터 ${start + pageItems.length}번째 이야기`}</span>
              </section>
              <section className={styles.mobileFilm} aria-label="고민일기 목록" aria-busy={listLoading} hidden={!isMobile}>
                {listLoading && <span className={styles.srOnly} role="status">컬렉션 불러오는 중</span>}
                <div className={styles.mobileCards}>
                  {listLoading && cardPositions.map((_, index) => <div key={index} className={styles.mobileCard} aria-hidden="true"><CardSkeleton /></div>)}
                  {!listLoading && items.map((item) => <button type="button" key={item.id} className={styles.mobileCard}
                  aria-label={`${formatDate(item.date)} ${item.title}, AI가 생성한 이미지 상세 보기`} onClick={(event) => open(item.id, event.currentTarget)}>
                  <RecordImage image={item.image} /><time dateTime={item.date}>{formatDate(item.date)}</time><span>{item.title}</span>
                </button>)}</div>
              </section>
            </>}
    </div>
    {selected && (isMobile
      ? <article className={styles.mobileDetail} aria-label="고민일기 상세" aria-busy={detailLoading}>
        <div className={styles.mobileHero}>{detailImage}
          <button className={styles.backButton} type="button" aria-label="컬렉션으로 돌아가기" onClick={close} autoFocus>←</button>
        </div>
        <div className={styles.mobileDetailBody}>{detailBody}</div>
      </article>
      : <dialog ref={dialog} className={styles.dialog} aria-label="고민일기 상세" aria-busy={detailLoading} onCancel={(event) => { event.preventDefault(); close(); }}
        onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}>
        {(detailLoading || previewImage || state.detail) && <div className={styles.desktopImage}>
          {detailImage}
        </div>}
        <button className={styles.closeButton} type="button" aria-label="상세 닫기" onClick={close} autoFocus><AssetIcon name="close" /></button>
        <div className={styles.desktopSummary}>
          {detailBody}
        </div>
      </dialog>)}
  </PageShell>;
}
