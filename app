#!/usr/bin/env sh
set -eu

# Load variables from .env if present
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

ENVIRONMENT="${NODE_ENV:-development}"

# Detect docker compose v2 or v1
if docker compose version >/dev/null 2>&1; then
  COMPOSE_BIN="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_BIN="docker-compose"
else
  echo "Error: docker compose/docker-compose not found in PATH" >&2
  exit 1
fi

FILES="-f docker-compose.yml"
if [ "$ENVIRONMENT" != "production" ]; then
  FILES="$FILES -f docker-compose.dev.yml"
fi

CMD="${1:-}"
if [ -z "$CMD" ]; then
  echo "Usage: $0 {up|down} [args]" >&2
  exit 1
fi
shift || true

case "$CMD" in
  up)
    ARGS="--build$*"
    sh -c "$COMPOSE_BIN $FILES up $ARGS"
    ;;
  down)
    sh -c "$COMPOSE_BIN $FILES down $*"
    ;;
  *)
    echo "Unknown command: $CMD. Use 'up' or 'down'." >&2
    exit 1
    ;;
esac


