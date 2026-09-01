#!/usr/bin/env bash
set -euo pipefail

COUNT="$(python3 -c 'import json; print(json.load(open("watch.json"))["count"])')"
BODY_FILE="watch.md"
export MARKER="<!-- sentry-preview-watch -->"

if [ -z "${PR_NUMBER:-}" ] || [ "$PR_NUMBER" = "null" ]; then
  if [ "$COUNT" = "0" ]; then
    echo "Preview Sentry watch: clear"
    exit 0
  fi
  echo "Preview Sentry watch: $COUNT unresolved issue(s) — fix before merging to main"
  cat "$BODY_FILE"
  exit 1
fi

COMMENTS_JSON="$(gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments")"
COMMENT_ID="$(printf '%s' "$COMMENTS_JSON" | python3 -c '
import json, os, sys
marker = os.environ["MARKER"]
comments = json.loads(sys.stdin.read() or "[]")
for comment in comments:
    if marker in (comment.get("body") or ""):
        print(comment["id"])
        break
')"

if [ -z "$COMMENT_ID" ]; then
  gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -f body="$(cat "$BODY_FILE")" >/dev/null
else
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments/${COMMENT_ID}" \
    -f body="$(cat "$BODY_FILE")" >/dev/null
fi

if [ "$COUNT" = "0" ]; then
  echo "Preview Sentry watch: clear"
  exit 0
fi

echo "Preview Sentry watch: $COUNT unresolved issue(s) — fix before merging to main"
exit 1
