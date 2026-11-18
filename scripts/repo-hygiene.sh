#!/usr/bin/env bash
# repo-hygiene.sh -- fail when anything that means "not done" is open.
# Checks: open PRs older than HYGIENE_PR_GRACE_DAYS (3), open Dependabot alerts,
# failing latest CI/Deploy on main.
# Exit 0 = clean. Exit 1 = open items (printed).
# Requires: gh (authenticated) with repo read + security_events read.
set -uo pipefail

REPO="${GH_REPO:-kleinpanic/datahall}"
export GH_REPO="$REPO"
issues=0
summary=()

# 1. Open PRs. A pull request whose last push is younger than the grace window
# is pending, not a failure: pnpm's one-day minimumReleaseAge makes a fresh
# Dependabot lockfile fail CI on day one, and auto-merge re-runs it the day
# after. A pull request older than the window is stuck and fails the check.
grace_days="${HYGIENE_PR_GRACE_DAYS:-3}"
now_s=$(date -u +%s)
stuck=()
pending=()
# REST, not `gh pr list --json commits`: that GraphQL query exceeds the node
# limit and prints nothing, which would read as "no open PRs".
if ! prs=$(gh api "repos/$REPO/pulls?state=open&per_page=100" \
  --jq '.[] | [.number, .user.login, .head.sha, .title] | @tsv' 2>/dev/null); then
  issues=1
  summary+=("OPEN PRS: unable to list (gh api failed)")
  prs=""
fi
while IFS=$'\t' read -r number author sha title; do
  [ -n "$number" ] || continue
  pushed=$(gh api "repos/$REPO/commits/$sha" --jq '.commit.committer.date' 2>/dev/null || echo "")
  pushed_s=$(date -u -d "$pushed" +%s 2>/dev/null || echo 0)
  age_days=$(((now_s - pushed_s) / 86400))
  if [ -z "$pushed" ] || [ "$age_days" -ge "$grace_days" ]; then
    stuck+=("  PR $number\t$author\t$title (last push ${age_days}d ago)")
  else
    pending+=("  PR $number\t$author\t$title (last push ${age_days}d ago)")
  fi
done <<< "$prs"
if [ "${#stuck[@]}" -gt 0 ]; then
  issues=1
  summary+=("OPEN PRS older than ${grace_days} days:")
  for line in "${stuck[@]}"; do summary+=("$(printf '%b' "$line")"); done
else
  summary+=("open PRs older than ${grace_days} days: none")
fi
if [ "${#pending[@]}" -gt 0 ]; then
  summary+=("open PRs inside the ${grace_days}-day window (pending, not a failure):")
  for line in "${pending[@]}"; do summary+=("$(printf '%b' "$line")"); done
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
  echo "HYGIENE: PASS -- no stuck PRs, main workflows green; alerts not queried."
else
  echo "HYGIENE: PASS -- no stuck PRs, no open alerts, main workflows green."
fi
