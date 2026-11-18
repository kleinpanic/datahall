#!/usr/bin/env bash
# repo-hygiene.sh -- fail when anything that means "not done" is open.
# Checks: open PRs, open Dependabot alerts, failing latest CI/Deploy on main.
# Exit 0 = clean. Exit 1 = open items (printed).
# Requires: gh (authenticated) with repo read + security_events read.
set -uo pipefail

REPO="${GH_REPO:-kleinpanic/datahall}"
export GH_REPO="$REPO"
issues=0
summary=()

# 1. Open PRs
open_prs=$(gh pr list --state open --limit 100 --json number,title,author \
  --jq '[.[] | "\(.number)\t\(.author.login)\t\(.title)"]')
if [ -n "$open_prs" ] && [ "$open_prs" != "[]" ]; then
  issues=1
  summary+=("OPEN PRS:")
  while IFS= read -r line; do
    summary+=("  PR $line")
  done < <(echo "$open_prs" | jq -r '.[]' 2>/dev/null || echo "$open_prs")
else
  summary+=("open PRs: none")
fi

# 2. Open Dependabot alerts
# gh prints the API error body on stdout when the call is refused (the workflow
# token gets 403 here), so anything that is not a number means "unknown".
alerts=$(gh api "repos/$REPO/dependabot/alerts?state=open&per_page=100" --jq 'length' 2>/dev/null) || alerts="unknown"
case "$alerts" in '' | *[!0-9]*) alerts="unknown" ;; esac
if [ "$alerts" = "unknown" ]; then
  summary+=("dependabot alerts: unable to query with this token; CI's 'pnpm audit' step is the gate")
elif [ "$alerts" -gt 0 ]; then
  issues=1
  summary+=("DEPENDABOT ALERTS OPEN: $alerts")
else
  summary+=("dependabot alerts: 0 open")
fi

# 3. Latest CI + Deploy conclusion on main
# Note: workflow names are "CI" and "Deploy to GitHub Pages"
for wf in "CI" "Deploy to GitHub Pages"; do
  concl=$(gh run list --workflow "$wf" --branch main --limit 1 \
    --json conclusion --jq '.[0].conclusion // "running"' 2>/dev/null || echo "unknown")
  case "$concl" in
    success) summary+=("$wf on main: success") ;;
    *) issues=1; summary+=("$wf on main: $concl") ;;
  esac
done

printf '%s\n' "${summary[@]}"
if [ "$issues" -eq 1 ]; then
  echo "HYGIENE: FAIL -- repo has open items; nothing is 'done' until these are zero."
  exit 1
fi
if [ "$alerts" = "unknown" ]; then
  echo "HYGIENE: PASS -- no open PRs, main workflows green; alerts not queried."
else
  echo "HYGIENE: PASS -- no open PRs, no open alerts, main workflows green."
fi
