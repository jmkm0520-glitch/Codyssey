#!/bin/bash

set -e

APP_DIR="$HOME/Applications"
DOWNLOAD_DIR="$HOME/Downloads/app-installer"
WORK_DIR="$HOME/.app-installer-work"
HOMEBREW_DIR="$HOME/homebrew"
NVM_DIR="$HOME/.nvm"
NVM_VERSION="v0.40.3"
NODE_VERSION="lts/*"
ACTIVE_MOUNT_POINT=""

step() {
    echo ""
    echo "=================================================="
    echo "STEP $1 : $2"
    echo "=================================================="
}

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

cleanup() {
    if [ -n "$ACTIVE_MOUNT_POINT" ]; then
        hdiutil detach "$ACTIVE_MOUNT_POINT" >/dev/null 2>&1 || true
    fi

    rm -rf "$WORK_DIR"
}

trap cleanup EXIT

mkdir -p "$APP_DIR"
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$WORK_DIR"

install_dmg() {
    local name="$1"
    local url="$2"
    local step_no="$3"
    local dmg="$DOWNLOAD_DIR/$name.dmg"

    step "$step_no" "$name 다운로드"
    curl -L --progress-bar -o "$dmg" "$url"

    step "$step_no-1" "$name DMG 마운트"

    ACTIVE_MOUNT_POINT="$(
        hdiutil attach "$dmg" -nobrowse \
            | sed -n 's|^.*\(/Volumes/.*\)$|\1|p' \
            | tail -1
    )"

    echo "MOUNT_POINT=$ACTIVE_MOUNT_POINT"

    if [ -z "$ACTIVE_MOUNT_POINT" ]; then
        echo "DMG 마운트 실패: $name" >&2
        exit 1
    fi

    step "$step_no-2" "$name APP 검색"

    local app_path
    app_path="$(find "$ACTIVE_MOUNT_POINT" -maxdepth 1 -name '*.app' -print -quit)"

    echo "APP_PATH=$app_path"

    if [ -z "$app_path" ]; then
        echo ".app 파일을 찾지 못했습니다: $name" >&2
        exit 1
    fi

    step "$step_no-3" "$name APP 복사"

    local app_name
    app_name="$(basename "$app_path")"

    rm -rf "$APP_DIR/$app_name"
    ditto "$app_path" "$APP_DIR/$app_name"

    log "$app_name 설치 완료"

    step "$step_no-4" "$name DMG 언마운트"
    hdiutil detach "$ACTIVE_MOUNT_POINT"
    ACTIVE_MOUNT_POINT=""
}

install_homebrew() {
    step "1" "Homebrew 설치"

    if [ -x "$HOMEBREW_DIR/bin/brew" ]; then
        log "Homebrew 이미 설치됨"
    else
        git clone https://github.com/Homebrew/brew "$HOMEBREW_DIR"
    fi

    if ! grep -q "homebrew/bin/brew shellenv" "$HOME/.zshrc" 2>/dev/null; then
        cat <<EOF >> "$HOME/.zshrc"

# Homebrew
eval "\$($HOME/homebrew/bin/brew shellenv)"
EOF
    fi

    eval "$("$HOME/homebrew/bin/brew" shellenv)"
    "$HOME/homebrew/bin/brew" --version
}

install_codex_app() {
    install_dmg \
        "Codex" \
        "https://persistent.oaistatic.com/codex-app-prod/Codex-latest-x64.dmg" \
        "2"
}

install_node() {
    step "3" "Node.js / npm 설치"

    if command -v npm >/dev/null 2>&1; then
        log "기존 npm 발견: $(command -v npm)"
    fi

    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh" | bash
    fi

    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        echo "nvm 설치 파일을 찾지 못했습니다: $NVM_DIR/nvm.sh" >&2
        exit 1
    fi

    . "$NVM_DIR/nvm.sh"

    nvm install "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"
    nvm use default

    log "nvm 기반 npm 사용: $(command -v npm)"
    node --version
    npm --version

    log "Node.js / npm 설치 완료 (nvm)"
}

install_pnpm() {
    step "4" "pnpm 설치"

    if ! command -v npm >/dev/null 2>&1; then
        echo "npm 명령어를 찾지 못했습니다. npm을 먼저 설치하세요." >&2
        exit 1
    fi

    npm install -g pnpm@latest-11
    hash -r

    if ! command -v pnpm >/dev/null 2>&1; then
        echo "pnpm 명령어를 찾지 못했습니다." >&2
        exit 1
    fi

    log "pnpm 설치 완료: $(command -v pnpm)"
}

install_github_cli() {
    step "5" "GitHub CLI 설치"

    if [ ! -x "$HOMEBREW_DIR/bin/brew" ]; then
        echo "Homebrew를 찾지 못했습니다: $HOMEBREW_DIR/bin/brew" >&2
        exit 1
    fi

    eval "$("$HOMEBREW_DIR/bin/brew" shellenv)"

    if command -v gh >/dev/null 2>&1; then
        log "GitHub CLI 이미 설치됨: $(command -v gh)"
        gh --version
        return
    fi

    "$HOMEBREW_DIR/bin/brew" install gh
    hash -r

    if ! command -v gh >/dev/null 2>&1; then
        echo "gh 명령어를 찾지 못했습니다." >&2
        exit 1
    fi

    log "GitHub CLI 설치 완료: $(command -v gh)"
    gh --version
}

install_vercel_cli() {
    step "6" "Vercel CLI 설치"

    if ! command -v npm >/dev/null 2>&1; then
        echo "npm 명령어를 찾지 못했습니다. npm을 먼저 설치하세요." >&2
        exit 1
    fi

    npm install -g vercel@latest
    hash -r

    if ! command -v vercel >/dev/null 2>&1; then
        echo "vercel 명령어를 찾지 못했습니다." >&2
        exit 1
    fi

    log "Vercel CLI 설치 완료: $(command -v vercel)"
    vercel --version
}

install_ditto_pet() {
    step "7" "Ditto Codex pet 설치"

    if ! command -v npx >/dev/null 2>&1; then
        echo "npx 명령어를 찾지 못했습니다. Node.js를 먼저 설치하세요." >&2
        exit 1
    fi

    npx codex-pets add ditto

    log "Ditto Codex pet 설치 완료"
}

if [ "$(uname -s)" != "Darwin" ]; then
    echo "이 스크립트는 macOS에서만 실행할 수 있습니다." >&2
    exit 1
fi

step "0" "설치 준비"

echo "APP_DIR=$APP_DIR"
echo "DOWNLOAD_DIR=$DOWNLOAD_DIR"
echo "WORK_DIR=$WORK_DIR"

install_homebrew
install_codex_app
install_node
install_pnpm
install_github_cli
install_vercel_cli
install_ditto_pet

step "8" "설치 완료"

echo ""
echo "설치된 앱"

find "$APP_DIR" \
    -maxdepth 1 \
    -name '*.app' \
    -type d

echo ""
echo "새 터미널을 열면 PATH와 셸 설정이 적용됩니다."
