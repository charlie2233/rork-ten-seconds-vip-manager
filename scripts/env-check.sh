#!/usr/bin/env bash
set -euo pipefail

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
dim() { printf "\033[2m%s\033[0m\n" "$*"; }
warn() { printf "\033[33m%s\033[0m\n" "$*"; }
err() { printf "\033[31m%s\033[0m\n" "$*"; }

bold "Ten Seconds VIP Manager — environment check"
dim "Repo: $(pwd)"
echo

missing=0

if command -v git >/dev/null 2>&1; then
  dim "git: $(git --version | head -n 1)"
else
  warn "git: not found (install Xcode Command Line Tools on macOS: xcode-select --install)"
  missing=1
fi

if command -v node >/dev/null 2>&1; then
  node_ver="$(node -v | sed 's/^v//')"
  node_major="${node_ver%%.*}"
  dim "node: v${node_ver}"
  if [[ "${node_major}" -lt 18 ]]; then
    warn "node: v${node_ver} is quite old for modern Expo; Node 18+ recommended."
  fi
else
  warn "node: not found"
  dim "Install with nvm (safe): https://github.com/nvm-sh/nvm"
  dim "Then run: nvm install && nvm use"
  missing=1
fi

if command -v bun >/dev/null 2>&1; then
  dim "bun: v$(bun --version)"
else
  warn "bun: not found"
  dim "Install (safe): https://bun.sh/docs/installation"
  missing=1
fi

echo
if [[ -f .env || -f .env.local ]]; then
  dim "env: found .env/.env.local"
else
  warn "env: no .env found (optional)"
  dim "If you need it: cp .env.example .env"
fi

if [[ -d node_modules ]]; then
  dim "deps: node_modules/ present"
else
  warn "deps: node_modules/ missing"
  dim "Install deps: bun i"
fi

echo
bold "Next commands"
printf "%s\n" "  bun i" "  bun run start-web" "  bun run start" "  bun run lint"

echo
if [[ "${missing}" -eq 1 ]]; then
  err "Missing required tooling. See notes above."
  exit 1
fi

dim "Looks good."

