"""Fail safely when a server-only Supabase credential appears in public artifacts."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRECTORIES = {".git", ".pnpm-store", ".venv", "node_modules", "venv"}
TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".log",
    ".md",
    ".mjs",
    ".py",
    ".sql",
    ".ts",
    ".tsx",
    ".txt",
}
SECRET_PATTERNS = {
    "Supabase secret key": re.compile(r"\bsb_secret_[A-Za-z0-9_-]{12,}\b"),
    "legacy service-role JWT": re.compile(
        r"\beyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b"
    ),
    "non-empty service-role assignment": re.compile(
        r"SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*[\"']?[^\s\"'#]{16,}"
    ),
}


def iter_text_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRECTORIES for part in path.parts):
            continue
        if path.name.startswith(".env") or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        files.append(path)
    return files


def matching_labels(text: str) -> list[str]:
    return [label for label, pattern in SECRET_PATTERNS.items() if pattern.search(text)]


def scan_current_files() -> list[str]:
    failures: list[str] = []
    for path in iter_text_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for label in matching_labels(text):
            failures.append(f"{path.relative_to(ROOT)}: {label}")

    for directory in (ROOT / "src", ROOT / "public", ROOT / ".next" / "static"):
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
                text = path.read_text(encoding="utf-8", errors="ignore")
                if "SUPABASE_SERVICE_ROLE_KEY" in text:
                    failures.append(f"{path.relative_to(ROOT)}: server variable name in browser artifact")
    return failures


def scan_git_history() -> list[str]:
    result = subprocess.run(
        ["git", "log", "-p", "--all", "--no-ext-diff", "--", "."],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    if result.returncode not in (0, 128):
        return ["Git history could not be inspected"]
    return [f"Git history: {label}" for label in matching_labels(result.stdout)]


def main() -> int:
    failures = sorted(set(scan_current_files() + scan_git_history()))
    if failures:
        print("Security check failed. Potential server credential exposure:")
        for failure in failures:
            print(f"- {failure}")
        print("Values are intentionally hidden. Rotate any exposed credential before continuing.")
        return 1

    print("Security check passed: public artifacts, logs, and Git history contain no service-role secret.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
