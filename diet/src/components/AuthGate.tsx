"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  FormEvent,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ApiClientError, fetchApi } from "../services/apiClient";
import {
  OPEN_TARGET_WEIGHT_MENU_EVENT,
  readTargetWeight,
  saveTargetWeight,
} from "../services/targetWeight";
import type { Member } from "../types/auth";
import styles from "./AuthGate.module.css";

type Mode = "login" | "signup" | "verify";

type SiteMenuContextValue = { isMenuOpen: boolean; openMenu: () => void };

const SiteMenuContext = createContext<SiteMenuContextValue | null>(null);

const MENU_BUTTON_ID = "site-menu-button";

/** Return focus to the header button after the side menu closes. */
function focusMenuButton() {
  window.setTimeout(() => document.getElementById(MENU_BUTTON_ID)?.focus(), 0);
}

/** Hamburger button for the site header. Renders nothing until a member is signed in. */
export function SiteMenuButton() {
  const menu = useContext(SiteMenuContext);
  if (!menu) return null;

  return (
    <button
      aria-controls="account-side-menu"
      aria-expanded={menu.isMenuOpen}
      aria-label="메뉴 열기"
      className={styles.menuButton}
      id={MENU_BUTTON_ID}
      type="button"
      onClick={menu.openMenu}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </button>
  );
}

function TargetWeightMenuItem() {
  const [targetWeightInput, setTargetWeightInput] = useState(() => {
    const savedTargetWeight = readTargetWeight();
    return savedTargetWeight === null ? "" : String(savedTargetWeight);
  });
  const [configuredTargetWeight, setConfiguredTargetWeight] = useState(readTargetWeight);
  const [targetWeightError, setTargetWeightError] = useState<string | null>(null);

  function updateTargetWeightInput(value: string) {
    setTargetWeightInput(value);
    if (!value.trim()) {
      setTargetWeightError(null);
      return;
    }

    const parsedTargetWeight = Number(value);
    setTargetWeightError(
      !Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0
        ? "0보다 큰 숫자를 입력해 주세요."
        : null,
    );
  }

  function handleTargetWeightSave() {
    const parsedTargetWeight = Number(targetWeightInput);
    if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) {
      setTargetWeightError("0보다 큰 숫자를 입력해 주세요.");
      return;
    }

    saveTargetWeight(parsedTargetWeight);
    setConfiguredTargetWeight(parsedTargetWeight);
    setTargetWeightError(null);
  }

  return (
    <section className={styles.targetWeightMenu} aria-labelledby="menu-target-weight-title">
      <div>
        <p className={styles.targetWeightMenuEyebrow}>목표 관리</p>
        <h2 id="menu-target-weight-title">목표 몸무게</h2>
      </div>
      <label className={styles.targetWeightMenuLabel} htmlFor="menu-target-weight">
        목표 체중
      </label>
      <div className={styles.targetWeightMenuInputRow}>
        <input
          id="menu-target-weight"
          inputMode="decimal"
          max="300"
          min="1"
          onChange={(event) => updateTargetWeightInput(event.target.value)}
          placeholder="예: 50"
          step="0.1"
          type="number"
          value={targetWeightInput}
        />
        <span>kg</span>
        <button onClick={handleTargetWeightSave} type="button">
          {configuredTargetWeight === null ? "설정" : "수정"}
        </button>
      </div>
      {targetWeightError ? (
        <p className={styles.targetWeightMenuError}>{targetWeightError}</p>
      ) : null}
    </section>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [status, setStatus] = useState("");
  const [token, setToken] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldFocusTargetWeight, setShouldFocusTargetWeight] = useState(false);
  const sideMenuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedPendingEmail = window.sessionStorage.getItem("pendingSignupEmail") ?? "";
    const pendingStateTimer = window.setTimeout(() => {
      if (savedPendingEmail) {
        setPendingEmail(savedPendingEmail);
        setToken("");
        setMode("verify");
      }
    }, 0);
    fetchApi<Member>("/api/authentication?action=session")
      .then((authenticated) => {
        setMember(authenticated);
      })
      .catch(() => undefined)
      .finally(() => {
        setLoading(false);
      });
    return () => window.clearTimeout(pendingStateTimer);
  }, []);

  useEffect(() => {
    function openTargetWeightSettings() {
      setShouldFocusTargetWeight(true);
      setIsMenuOpen(true);
    }

    window.addEventListener(OPEN_TARGET_WEIGHT_MENU_EVENT, openTargetWeightSettings);
    return () => window.removeEventListener(OPEN_TARGET_WEIGHT_MENU_EVENT, openTargetWeightSettings);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => sideMenuRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      focusMenuButton();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen || !shouldFocusTargetWeight) return;

    const focusTimer = window.setTimeout(() => {
      document.getElementById("menu-target-weight")?.focus();
      setShouldFocusTargetWeight(false);
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [isMenuOpen, shouldFocusTargetWeight]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? pendingEmail);
    const payload: Record<string, string> = { email };
    if (mode === "verify") {
      payload.token = token;
    } else {
      payload.password = String(form.get("password") ?? "");
      if (mode === "signup") payload.display_name = String(form.get("displayName") ?? "");
    }
    try {
      if (mode === "signup") {
        await fetchApi<{ email: string; verificationRequired: boolean }>(
          "/api/authentication?action=signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        setPendingEmail(email);
        window.sessionStorage.setItem("pendingSignupEmail", email);
        setToken("");
        setMode("verify");
        setStatus("인증 메일을 보냈습니다. 이메일의 6자리 인증번호를 입력해 주세요.");
        return;
      }
      const endpoint = mode === "verify" ? "verify_email" : "login";
      const authenticated = await fetchApi<Member>(`/api/authentication?action=${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMember(authenticated);
      window.sessionStorage.removeItem("pendingSignupEmail");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!pendingEmail) {
      setError("먼저 가입에 사용한 이메일을 입력해 주세요.");
      return;
    }
    setError("");
    try {
      await fetchApi<{ sent: boolean }>("/api/authentication?action=resend_verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      setStatus("인증 메일을 다시 보냈습니다.");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : "인증 메일을 보내지 못했습니다.",
      );
    }
  }

  async function logout() {
    await fetchApi<{ loggedOut: boolean }>("/api/authentication?action=logout", {
      method: "POST",
    });
    setMember(null);
    setMode("login");
    setShouldFocusTargetWeight(false);
    setIsMenuOpen(false);
  }

  function closeMenu() {
    setShouldFocusTargetWeight(false);
    setIsMenuOpen(false);
    focusMenuButton();
  }

  if (loading) return <main className={styles.center}>로그인 상태를 확인하고 있어요.</main>;

  if (!member) {
    return (
      <main className={styles.center}>
        <div className={styles.authShell}>
          <section className={styles.authIntro} aria-label="오늘도 가볍게 소개">
            <Image src="/broccoli-logo.png" alt="" width={72} height={72} priority />
            <p>오늘도 가볍게</p>
            <h2>
              한 끼씩 기록하는
              <br />
              나만의 건강 루틴
            </h2>
            <span>
              식단과 체중의 작은 변화를
              <br />
              부담 없이 이어가 보세요.
            </span>
          </section>
          <section className={styles.card} aria-labelledby="auth-title">
            <h1 id="auth-title">
              {mode === "signup" ? "회원가입" : mode === "verify" ? "이메일 인증" : "로그인"}
            </h1>
            <p>
              {mode === "signup"
                ? "이메일 인증을 완료하면 나만의 식단과 체중 기록을 시작할 수 있습니다."
                : mode === "verify"
                  ? "가입한 이메일로 보낸 인증번호를 입력해 주세요."
                  : "식단과 체중 기록을 보려면 로그인해 주세요."}
            </p>
            {/*
            Two things had to change so the verification field starts empty.

            Keys: the token and password inputs share a slot, so without them
            React reuses the DOM node and an uncontrolled input keeps what was
            typed.

            The form key: Chrome ties saved credentials to a form. Reusing the
            same form element after a password was submitted lets it fill the
            field that takes the password's place, whatever autocomplete says.
            Remounting the form gives the browser a form it has not seen.
          */}
            <form
              autoComplete="off"
              className={styles.form}
              key={mode === "verify" ? "verify-form" : "credentials-form"}
              onSubmit={submit}
            >
              {mode === "signup" && (
                <label>
                  이름
                  <input name="displayName" maxLength={50} required autoComplete="name" />
                </label>
              )}
              <label>
                이메일
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={mode === "verify" ? pendingEmail : undefined}
                  onChange={
                    mode === "verify" ? (event) => setPendingEmail(event.target.value) : undefined
                  }
                />
              </label>
              {mode === "verify" ? (
                <label key="verification-token">
                  6자리 인증번호
                  <input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    name="token"
                    pattern="[0-9]{6}"
                    required
                    type="text"
                    value={token}
                    onChange={(event) => setToken(event.target.value.replace(/\D/g, ""))}
                  />
                </label>
              ) : (
                <label key="password">
                  비밀번호
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </label>
              )}
              {status && (
                <p className={styles.status} role="status">
                  {status}
                </p>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button type="submit" disabled={submitting}>
                {submitting
                  ? "처리 중…"
                  : mode === "signup"
                    ? "인증 메일 받기"
                    : mode === "verify"
                      ? "인증하고 가입 완료"
                      : "로그인"}
              </button>
            </form>
            {mode === "verify" && (
              <button className={styles.switch} type="button" onClick={resendVerification}>
                인증 메일 다시 보내기
              </button>
            )}
            {mode !== "verify" && (
              <button
                className={styles.switch}
                type="button"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup" ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 회원가입"}
              </button>
            )}
            {mode === "verify" && (
              <button className={styles.switch} type="button" onClick={() => setMode("login")}>
                로그인으로 돌아가기
              </button>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <SiteMenuContext.Provider value={{ isMenuOpen, openMenu: () => setIsMenuOpen(true) }}>
      {isMenuOpen ? (
        <>
          <button
            aria-label="메뉴 닫기"
            className={styles.menuBackdrop}
            type="button"
            onClick={closeMenu}
          />
          <aside
            aria-label="사용자 메뉴"
            aria-modal="true"
            className={styles.sideMenu}
            id="account-side-menu"
            ref={sideMenuRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className={styles.sideMenuHeader}>
              <div>
                <span>로그인 계정</span>
                <strong>{member.displayName}님</strong>
              </div>
              <button aria-label="메뉴 닫기" type="button" onClick={closeMenu}>
                ×
              </button>
            </div>
            <nav aria-label="추가 메뉴" className={styles.sideMenuNav}>
              <Link href="/import" onClick={() => setIsMenuOpen(false)}>
                <span aria-hidden="true">⇧</span>
                <span>
                  <strong>가져오기</strong>
                  <small>CSV 기록 불러오기</small>
                </span>
                <b aria-hidden="true">›</b>
              </Link>
              <TargetWeightMenuItem />
            </nav>
            <button className={styles.logoutButton} type="button" onClick={logout}>
              로그아웃
            </button>
          </aside>
        </>
      ) : null}
      {children}
    </SiteMenuContext.Provider>
  );
}
