from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def latest_generated_png(generated_root: Path) -> Path:
    return max(generated_root.rglob("*.png"), key=lambda path: path.stat().st_mtime)


def clean_chroma(crop: Image.Image) -> Image.Image:
    crop = crop.convert("RGBA")
    px = crop.load()
    width, height = crop.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            green_strength = g - max(r, b)
            if g > 120 and green_strength > 24:
                px[x, y] = (r, g, b, 0)
            elif g > 90 and green_strength > 8:
                px[x, y] = (r, min(g, max(r, b) + 8), b, a)

    alpha = crop.getchannel("A")
    alpha_px = alpha.load()
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or alpha_px[x, y] < 16:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            points: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                for nx in (cx - 1, cx, cx + 1):
                    for ny in (cy - 1, cy, cy + 1):
                        if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in seen:
                            continue
                        if alpha_px[nx, ny] >= 16:
                            seen.add((nx, ny))
                            queue.append((nx, ny))
            components.append(points)

    if components:
        components.sort(key=len, reverse=True)
        keep: set[tuple[int, int]] = set()
        largest = len(components[0])
        center_x, center_y = width / 2, height / 2
        for points in components:
            size = len(points)
            min_x = min(point[0] for point in points)
            max_x = max(point[0] for point in points)
            min_y = min(point[1] for point in points)
            max_y = max(point[1] for point in points)
            comp_x = (min_x + max_x) / 2
            comp_y = (min_y + max_y) / 2
            central = abs(comp_x - center_x) < width * 0.45 and abs(comp_y - center_y) < height * 0.48
            if size == largest or size > 120 or (size > 45 and central):
                keep.update(points)

        for y in range(height):
            for x in range(width):
                if alpha_px[x, y] >= 16 and (x, y) not in keep:
                    r, g, b, _ = px[x, y]
                    px[x, y] = (r, g, b, 0)

    bbox = crop.getchannel("A").getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad = 10
        crop = crop.crop((max(0, left - pad), max(0, top - pad), min(width, right + pad), min(height, bottom + pad)))
    return crop


def process_sheet(repo: Path, source: Path, theme: str, kind: str, version: str) -> None:
    out_dir = repo / "assets" / "monsters" / "unique"
    sheet_dir = repo / "assets" / "monsters" / "sheets"
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet_dir.mkdir(parents=True, exist_ok=True)

    sheet_out = sheet_dir / f"{theme}-{kind}-sheet-{version}.png"
    preview_out = sheet_dir / f"{theme}-{kind}-preview-{version}.png"
    image = Image.open(source).convert("RGBA")
    image.save(sheet_out)

    width, height = image.size
    cell_width, cell_height = width / 4, height / 4
    crops: list[Image.Image] = []

    for index in range(16):
        col = index % 4
        row = index // 4
        crop = image.crop(
            (
                round(col * cell_width),
                round(row * cell_height),
                round((col + 1) * cell_width),
                round((row + 1) * cell_height),
            )
        )
        crop = clean_chroma(crop)
        name = f"{theme}_{kind}_{index + 1:02d}"
        crop.save(out_dir / f"{name}.png")
        crops.append(crop.copy())

    preview = Image.new("RGBA", (880, 880), (18, 22, 34, 255))
    for index, crop in enumerate(crops):
        crop.thumbnail((202, 202), Image.Resampling.LANCZOS)
        x = (index % 4) * 220 + (220 - crop.width) // 2
        y = (index // 4) * 220 + (220 - crop.height) // 2
        preview.alpha_composite(crop, (x, y))
    preview.save(preview_out)
    print(f"source={source}")
    print(f"sheet={sheet_out}")
    print(f"preview={preview_out}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--generated-root", required=True)
    parser.add_argument("--theme", required=True)
    parser.add_argument("--kind", choices=["monster", "boss"], required=True)
    parser.add_argument("--version", default="v1")
    parser.add_argument("--source")
    args = parser.parse_args()

    source = Path(args.source) if args.source else latest_generated_png(Path(args.generated_root))
    process_sheet(Path(args.repo), source, args.theme, args.kind, args.version)


if __name__ == "__main__":
    main()
