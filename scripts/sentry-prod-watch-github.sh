#!/usr/bin/env bash
set -euo pipefail

COUNT="$(python3 -c 'import json; print(json.load(open("watch.json"))["count"])')"
SKIPPED="$(python3 -c 'import json; print("true" if json.load(open("watch.json")).get("skipped") else "false")')"
TITLE="Production Sentry errors"
LABEL="sentry-watch"
BODY_FILE="watch.md"

if [ "$SKIPPED" = "true" ]; then
  echo "Production Sentry watch: skipped (no SENTRY_AUTH_TOKEN)"
  exit 0
fi

gh label create "$LABEL" --description "Auto-synced production Sentry errors" --color B60205 >/dev/null 2>&1 || true

EXISTING="$(gh issue list --label "$LABEL" --state all --limit 20 --json number,title,state \
  --jq ".[] | select(.title==\"$TITLE\") | .number" | head -n 1)"

if [ "$COUNT" = "0" ]; then
  if [ -n "$EXISTING" ]; then
    gh issue close "$EXISTING" --comment "Production is clear. No unresolved environment:production issues." >/dev/null || true
  fi
  echo "Production Sentry watch: clear"
  exit 0
fi

if [ -z "$EXISTING" ]; then
  gh issue create --title "$TITLE" --label "$LABEL" --body-file "$BODY_FILE" >/dev/null
else
  gh issue reopen "$EXISTING" >/dev/null 2>&1 || true
  gh issue edit "$EXISTING" --body-file "$BODY_FILE" >/dev/null
fi

echo "Production Sentry watch: $COUNT unresolved issue(s)"
exit 1
