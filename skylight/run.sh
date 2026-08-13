#!/usr/bin/env sh
set -e

pnpm start &
SERVER_PID=$!

node /apply-options.js || echo "[run] apply-options.js failed, continuing with existing config"

wait "$SERVER_PID"
