#!/usr/bin/env bash
set -euo pipefail

repo="an9gh/an9gh"
file="docs/github-profile-README.md"
branch="main"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required: https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login" >&2
  exit 1
fi

login="$(gh api user --jq .login)"
if [ "$login" != "an9gh" ]; then
  echo "Authenticated as '$login', not 'an9gh'." >&2
  echo "Run: gh auth login   # choose the an9gh account" >&2
  exit 1
fi

if [ ! -f "$file" ]; then
  echo "Missing $file" >&2
  exit 1
fi

content="$(python3 -c 'import base64, sys; print(base64.b64encode(open(sys.argv[1], "rb").read()).decode())' "$file")"
sha="$(gh api "repos/$repo/contents/README.md" --jq .sha 2>/dev/null || true)"

if [ -n "$sha" ]; then
  gh api -X PUT "repos/$repo/contents/README.md" \
    -f message="Update profile README" \
    -f content="$content" \
    -f sha="$sha" \
    -f branch="$branch" >/dev/null
else
  gh api -X PUT "repos/$repo/contents/README.md" \
    -f message="Add profile README" \
    -f content="$content" \
    -f branch="$branch" >/dev/null
fi

echo "Updated https://github.com/$repo"
