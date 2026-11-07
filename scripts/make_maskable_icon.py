#!/usr/bin/env python3
"""Build the padded maskable app icon from the standard 512px icon.

The source icon is a vertical red gradient with white "AU" lettering. The
maskable version keeps the gradient full-bleed and scales the lettering down
so it sits well inside Android's central 80% safe zone.

Requires Pillow.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "icon-512.png"
TARGET = ROOT / "assets" / "icon-maskable-512.png"
SIZE = 512
LOGO_SCALE = 0.76
TOP = (255, 68, 56)
BOTTOM = (184, 22, 14)


def vertical_gradient(size: int) -> Image.Image:
    column = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        color = tuple(round(start + (end - start) * t) for start, end in zip(TOP, BOTTOM))
        column.putpixel((0, y), color)
    return column.resize((size, size), Image.Resampling.NEAREST)


def extract_lettering(icon: Image.Image) -> Image.Image:
    """Return the white lettering as a transparent, white RGBA image."""
    pixels = icon.load()
    width, height = icon.size
    alpha = Image.new("L", icon.size)
    alpha_pixels = alpha.load()

    for y in range(height):
        left = pixels[0, y]
        right = pixels[width - 1, y]
        background = tuple((a + b) // 2 for a, b in zip(left, right))
        bg_green = background[1]
        bg_blue = background[2]
        green_range = 255 - bg_green
        blue_range = 255 - bg_blue

        for x in range(width):
            _, green, blue = pixels[x, y]
            green_alpha = (green - bg_green) / green_range if green_range else 0
            blue_alpha = (blue - bg_blue) / blue_range if blue_range else 0
            value = max(0.0, min(1.0, (green_alpha + blue_alpha) / 2))
            alpha_pixels[x, y] = round(value * 255)

    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bbox is None:
        raise SystemExit(f"No white lettering found in {SOURCE}")

    alpha = alpha.crop(bbox)
    lettering = Image.new("RGBA", alpha.size, (255, 255, 255, 0))
    lettering.putalpha(alpha)
    return lettering


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    lettering = extract_lettering(source)
    scaled_size = (
        max(1, round(lettering.width * LOGO_SCALE)),
        max(1, round(lettering.height * LOGO_SCALE)),
    )
    lettering = lettering.resize(scaled_size, Image.Resampling.LANCZOS)

    icon = vertical_gradient(SIZE).convert("RGBA")
    offset = ((SIZE - lettering.width) // 2, (SIZE - lettering.height) // 2)
    icon.alpha_composite(lettering, offset)
    icon.convert("RGB").save(TARGET, optimize=True)

    safe_radius = SIZE * 0.4
    corner_radius = math.hypot(lettering.width / 2, lettering.height / 2)
    print(f"Wrote {TARGET} ({TARGET.stat().st_size} bytes)")
    print(f"Lettering {lettering.width}x{lettering.height}; corner radius {corner_radius:.1f}px")
    print(f"Safe-zone radius {safe_radius:.1f}px; margin {safe_radius - corner_radius:.1f}px")


if __name__ == "__main__":
    main()
