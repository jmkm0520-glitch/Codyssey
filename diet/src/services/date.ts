/** Format a Date using the user's local calendar date, without UTC shifting. */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isLocalDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && formatLocalDate(date) === value;
}

/** Return whether a valid local calendar date is later than today. */
export function isFutureLocalDate(value: string, today: Date = new Date()): boolean {
  return isLocalDate(value) && value > formatLocalDate(today);
}

/** Read a valid selected date from the current page URL in the browser. */
export function readDateFromUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const date = new URLSearchParams(window.location.search).get("date");
  return isLocalDate(date) ? date : fallback;
}

/** Keep the selected date in the current URL without navigating away from the page. */
export function writeDateToUrl(date: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("date", date);
  window.history.replaceState(null, "", url);
}

/** Remove the selected date from the current page URL. */
export function clearDateFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("date");
  window.history.replaceState(null, "", url);
}
