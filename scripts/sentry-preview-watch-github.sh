#!/usr/bin/env bash
set -euo pipefail

COUNT="$(python3 -c 'import json; print(json.load(open("watch.json"))["count"])')"
SKIPPED="$(python3 -c 'import json; print("true" if json.load(open("watch.json")).get("skipped") else "false")')"
BODY_FILE="watch.md"
export MARKER="<!-- sentry-preview-watch -->"

if [ "$SKIPPED" = "true" ]; then
  echo "Preview Sentry watch: skipped (no SENTRY_AUTH_TOKEN)"
  if [ -z "${PR_NUMBER:-}" ] || [ "$PR_NUMBER" = "null" ]; then
    exit 0
  fi
fi

if [ -z "${PR_NUMBER:-}" ] || [ "$PR_NUMBER" = "null" ]; then
  if [ "$SKIPPED" = "true" ] || [ "$COUNT" = "0" ]; then
    echo "Preview Sentry watch: clear"
    exit 0
  fi
  echo "Preview Sentry watch: $COUNT unresolved issue(s) — fix before merging to main"
  cat "$BODY_FILE"
  exit 1
fi

COMMENT_ID=""
if COMMENTS_JSON="$(gh api "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" 2>&1)"; then
  COMMENT_ID="$(printf '%s' "$COMMENTS_JSON" | python3 -c '
import json, os, sys
marker = os.environ["MARKER"]
comments = json.loads(sys.stdin.read() or "[]")
for comment in comments:
    if marker in (comment.get("body") or ""):
        print(comment["id"])
        break
')"
else
  echo "Warning: Failed to list PR comments (gh api returned: $COMMENTS_JSON)"
  echo "Will attempt to post a new comment instead"
fi

if [ -z "$COMMENT_ID" ]; then
  if ! gh api "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -f body="$(cat "$BODY_FILE")" >/dev/null 2>&1; then
    echo "Warning: Failed to post PR comment"
  fi
else
  if ! gh api -X PATCH "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments/${COMMENT_ID}" \
    -f body="$(cat "$BODY_FILE")" >/dev/null 2>&1; then
    echo "Warning: Failed to update PR comment"
  fi
fi

if [ "$SKIPPED" = "true" ] || [ "$COUNT" = "0" ]; then
  echo "Preview Sentry watch: clear"
  exit 0
fi

echo "Preview Sentry watch: $COUNT unresolved issue(s) — fix before merging to main"
exit 1
