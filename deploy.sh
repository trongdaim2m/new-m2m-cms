#!/usr/bin/env bash
# Usage: ./deploy.sh        (NO_PULL=1 to skip git pull)
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production — create it before deploying." >&2
  exit 1
fi

if [[ "${NO_PULL:-}" != "1" ]]; then
  git pull --ff-only
fi

npm install --include=dev
npm run build

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 ls
