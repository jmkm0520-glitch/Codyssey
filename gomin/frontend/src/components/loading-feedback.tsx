import styles from "./loading-feedback.module.css";

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`${styles.skeleton} ${className}`} aria-hidden="true" />;
}

export function LoadingSpinner({ label }: { label: string }) {
  return <div className={styles.spinnerContainer} role="status" aria-label={label}>
    <span className={styles.spinner} aria-hidden="true" />
  </div>;
}
