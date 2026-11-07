#!/usr/bin/env python3
"""Check local links, assets, and in-page anchors in the static site."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}
SITE_BASE = "/anagh/"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: value for name, value in attrs if value is not None}

        if "id" in values:
            self.ids.append(values["id"])
        if tag == "a" and "name" in values:
            self.ids.append(values["name"])

        for attr in ("href", "src"):
            if attr in values:
                self.links.append((attr, values[attr]))


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def check_page(path: Path, parsed: dict[Path, PageParser]) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()

    for anchor in parsed[path].ids:
        if anchor in seen:
            errors.append(f"{path}: duplicate id/name #{anchor}")
        seen.add(anchor)

    for attr, raw in parsed[path].links:
        value = raw.strip()
        if not value:
            errors.append(f"{path}: empty {attr}")
            continue

        parsed_url = urlparse(value)
        if parsed_url.scheme in SKIP_SCHEMES or parsed_url.netloc:
            continue

        target_path = path
        target_fragment = parsed_url.fragment

        if parsed_url.path:
            if parsed_url.path.startswith(SITE_BASE):
                target_path = Path(parsed_url.path[len(SITE_BASE):] or ".")
            elif parsed_url.path.startswith("/"):
                target_path = path.parent / parsed_url.path.lstrip("/")
            else:
                target_path = path.parent / unquote(parsed_url.path)

            if not target_path.exists():
                errors.append(f"{path}: missing {attr} target {parsed_url.path}")
                continue

            if target_path.is_dir():
                target_path = target_path / "index.html"

        if target_fragment:
            if target_path.suffix.lower() not in {".html", ".htm"}:
                errors.append(
                    f"{path}: fragment #{target_fragment} points at a non-HTML file "
                    f"({target_path.relative_to(path.parent) if target_path.is_relative_to(path.parent) else target_path})"
                )
                continue

            if target_path not in parsed:
                try:
                    parsed[target_path] = parse_page(target_path)
                except OSError as exc:
                    errors.append(f"{path}: cannot read {target_path}: {exc}")
                    continue

            if target_fragment not in parsed[target_path].ids:
                errors.append(f"{path}: missing anchor #{target_fragment} in {target_path.name}")

    return errors


def main(argv: list[str]) -> int:
    pages = [Path(item) for item in (argv[1:] or ["index.html"])]
    missing = [page for page in pages if not page.is_file()]
    if missing:
        for page in missing:
            print(f"error: file not found: {page}")
        return 1

    parsed: dict[Path, PageParser] = {}
    for page in pages:
        parsed[page] = parse_page(page)

    errors: list[str] = []
    for page in pages:
        errors.extend(check_page(page, parsed))

    # Follow local HTML links so anchors in pages outside the explicit list are checked too.
    for page in list(parsed):
        if page.suffix.lower() in {".html", ".htm"}:
            errors.extend(check_page(page, parsed))

    if errors:
        for error in dict.fromkeys(errors):
            print(f"error: {error}")
        return 1

    print(f"Checked {len(parsed)} HTML page(s): links and anchors OK")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
