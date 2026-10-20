#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/.venv"
VENV_PYTHON="$VENV_DIR/bin/python"
REQUIREMENTS_FILE="$PROJECT_ROOT/requirements.txt"
REQUIREMENTS_STAMP="$VENV_DIR/.requirements-installed"
VERCEL_PROJECT_FILE="$PROJECT_ROOT/.vercel/project.json"
VERCEL_UV_VERSION="0.10.11"
USE_REMOTE_VERCEL_ENV=true

for arg in "$@"; do
  if [[ "$arg" == "--local" || "$arg" == "-L" ]]; then
    USE_REMOTE_VERCEL_ENV=false
    break
  fi
done

if ! command -v python3.12 >/dev/null 2>&1; then
  echo "Python 3.12를 찾을 수 없습니다. python3.12 명령을 설치한 뒤 다시 실행해 주세요." >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI를 찾을 수 없습니다. 'pnpm add --global vercel'로 설치해 주세요." >&2
  exit 1
fi

cd "$PROJECT_ROOT"

if [[ "$USE_REMOTE_VERCEL_ENV" == true ]]; then
  if [[ ! -f "$VERCEL_PROJECT_FILE" ]]; then
    echo "Vercel 프로젝트 연결 정보가 없습니다. 기존 프로젝트를 선택해 연결합니다."
    vercel link
  fi

  echo "Vercel Development 환경변수와 프로젝트 설정을 가져옵니다."
  vercel pull --yes --environment=development
fi

if [[ ! -x "$VENV_PYTHON" ]]; then
  echo "Python 3.12 가상환경을 .venv에 생성합니다."
  python3.12 -m venv "$VENV_DIR"
fi

VENV_VERSION="$($VENV_PYTHON -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
if [[ "$VENV_VERSION" != "3.12" ]]; then
  echo ".venv가 Python $VENV_VERSION으로 생성되어 있습니다." >&2
  echo ".venv를 제거한 뒤 다시 실행해 Python 3.12 환경을 생성해 주세요." >&2
  exit 1
fi

if [[ ! -f "$REQUIREMENTS_STAMP" || "$REQUIREMENTS_FILE" -nt "$REQUIREMENTS_STAMP" ]]; then
  echo ".venv에 Python 의존성을 설치합니다."
  "$VENV_PYTHON" -m pip install --disable-pip-version-check -r "$REQUIREMENTS_FILE"
  touch "$REQUIREMENTS_STAMP"
fi

# Vercel CLI는 uv를 찾지 못하면 선택된 Python에 `pip install --user`로
# 설치를 시도합니다. 프로젝트 가상환경에서는 --user 설치가 허용되지
# 않으므로, PATH에 가상환경을 추가하기 전에 uv를 선제적으로 설치합니다.
INSTALLED_UV_VERSION="$($VENV_PYTHON -c 'import importlib.metadata; print(importlib.metadata.version("uv"))' 2>/dev/null || true)"
if [[ "$INSTALLED_UV_VERSION" != "$VERCEL_UV_VERSION" ]]; then
  echo ".venv에 Vercel 빌더용 uv ${VERCEL_UV_VERSION}을 설치합니다."
  "$VENV_PYTHON" -m pip install \
    --disable-pip-version-check \
    --no-cache-dir \
    "uv==$VERCEL_UV_VERSION"
fi

# Vercel CLI가 프로젝트의 .venv를 직접 감지하도록 외부 가상환경 상태를 제거합니다.
unset VIRTUAL_ENV
unset PYTHONHOME
export PATH="$VENV_DIR/bin:$PATH"

echo "Python $VENV_VERSION ($VENV_PYTHON)으로 vercel dev를 실행합니다."
exec vercel dev "$@"
