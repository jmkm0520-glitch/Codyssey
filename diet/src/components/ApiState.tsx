import type { ReactNode } from "react";
import type { ApiError } from "../types/api";
import styles from "./ApiState.module.css";

type ApiStateProps = {
  loading?: boolean;
  error?: ApiError | null;
  children: ReactNode;
  loadingMessage?: string;
};

export function ApiState({
  loading = false,
  error = null,
  children,
  loadingMessage = "불러오는 중이에요...",
}: ApiStateProps) {
  if (loading) {
    return (
      <p className={styles.status} role="status" aria-live="polite">
        {loadingMessage}
      </p>
    );
  }

  if (error) {
    return (
      <p className={styles.error} role="alert">
        {error.message}
      </p>
    );
  }

  return <>{children}</>;
}
