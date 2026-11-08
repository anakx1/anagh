#!/usr/bin/env python3
"""Write a Markdown summary of Lighthouse CI results to the GitHub step summary."""

from __future__ import annotations

import glob
import json
import os
from pathlib import Path

CATEGORIES = ("performance", "accessibility", "best-practices", "seo")


def score(category: dict, key: str) -> str:
    value = category.get(key, {}).get("score")
    return "—" if value is None else str(round(value * 100))


def main() -> int:
    rows = []
    for path in glob.glob(".lighthouseci/lhr-*.json"):
        report = json.loads(Path(path).read_text(encoding="utf-8"))
        url = (
            report.get("finalDisplayedUrl")
            or report.get("finalUrl")
            or report.get("requestedUrl")
            or path
        )
        rows.append((url, report.get("categories", {})))

    if rows:
        lines = [
            "| Page | Performance | Accessibility | Best practices | SEO |",
            "|---|---:|---:|---:|---:|",
        ]
        for url, categories in sorted(rows):
            values = " | ".join(score(categories, key) for key in CATEGORIES)
            lines.append(f"| {url} | {values} |")
        summary = "\n".join(lines)
    else:
        summary = "No Lighthouse reports were found."

    print(summary)
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        Path(summary_path).write_text(summary + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
