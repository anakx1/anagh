#!/usr/bin/env python3
"""Verify the meta CSP and inline-style/script hashes on static pages."""

from __future__ import annotations

import base64
import hashlib
import re
import sys
from pathlib import Path

PAGES = [
    "index.html",
    "lab.html",
    "404.html",
    "resume.html",
    "homelab.html",
    "writing.html",
]
CSP_RE = re.compile(
    r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*/?>',
    re.IGNORECASE,
)
REFERRER_RE = re.compile(
    r'<meta\s+name="referrer"\s+content="([^"]+)"\s*/?>',
    re.IGNORECASE,
)
SCRIPT_RE = re.compile(r"<script(\s[^>]*)?>(.*?)</script>", re.IGNORECASE | re.DOTALL)
STYLE_RE = re.compile(r"<style(\s[^>]*)?>(.*?)</style>", re.IGNORECASE | re.DOTALL)


def digest(text: str) -> str:
    encoded = hashlib.sha256(text.encode()).digest()
    return "'sha256-" + base64.b64encode(encoded).decode() + "'"


def directives(policy: str) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for part in policy.split(";"):
        tokens = part.strip().split()
        if tokens:
            result[tokens[0].lower()] = tokens[1:]
    return result


def check_page(path: Path) -> list[str]:
    html = path.read_text()
    errors: list[str] = []

    csp_match = CSP_RE.search(html)
    if not csp_match:
        return [f"{path}: missing Content-Security-Policy meta"]

    policy = directives(csp_match.group(1))
    if "script-src" not in policy:
        errors.append(f"{path}: CSP has no script-src directive")
    if "style-src" not in policy:
        errors.append(f"{path}: CSP has no style-src directive")
    if "'unsafe-inline'" in policy.get("script-src", []):
        errors.append(f"{path}: script-src must not allow 'unsafe-inline'")
    if "'unsafe-inline'" in policy.get("style-src", []):
        errors.append(f"{path}: style-src must not allow 'unsafe-inline'")

    referrer = REFERRER_RE.search(html)
    if not referrer or referrer.group(1) != "strict-origin-when-cross-origin":
        errors.append(f"{path}: missing strict-origin-when-cross-origin referrer policy")

    for match in SCRIPT_RE.finditer(html):
        attrs = (match.group(1) or "").lower()
        if "src=" in attrs or "application/ld+json" in attrs:
            continue
        value = digest(match.group(2))
        if value not in policy.get("script-src", []):
            errors.append(f"{path}: inline script hash {value} is missing from script-src")

    for match in STYLE_RE.finditer(html):
        value = digest(match.group(2))
        if value not in policy.get("style-src", []):
            errors.append(f"{path}: inline style hash {value} is missing from style-src")

    return errors


def main() -> int:
    pages = sys.argv[1:] or PAGES
    errors: list[str] = []
    for name in pages:
        path = Path(name)
        if not path.exists():
            errors.append(f"{name}: file not found")
            continue
        errors.extend(check_page(path))

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Checked CSP and referrer policy on {len(pages)} page(s): OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
