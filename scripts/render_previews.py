"""Render selected, public-facing certificate excerpts without copying source PDFs.

Usage: python3 scripts/render_previews.py --source-dir '/path/to/Prepared Documents'
Requires Pillow and Poppler's pdftoppm. Crops use normalized page coordinates.
"""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


SIZE = (1600, 1100)
OUT = Path(__file__).resolve().parents[1] / "docs" / "assets" / "previews"


def render_page(pdf: Path, page: int) -> Image.Image:
    with tempfile.TemporaryDirectory(prefix="portfolio-pdf-") as temporary:
        prefix = Path(temporary) / "page"
        subprocess.run(
            ["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile", "-scale-to", "2400", "-png", str(pdf), str(prefix)],
            check=True,
            capture_output=True,
        )
        with Image.open(prefix.with_suffix(".png")) as image:
            return image.convert("RGB")


def crop(image: Image.Image, bounds: tuple[float, float, float, float]) -> Image.Image:
    width, height = image.size
    return image.crop(tuple(round(value * dimension) for value, dimension in zip(bounds, (width, height, width, height))))


def fit_on_canvas(image: Image.Image, *, fill: str = "#e9ece9") -> Image.Image:
    canvas = Image.new("RGB", SIZE, fill)
    inner = ImageOps.contain(image, (1480, 940), Image.Resampling.LANCZOS)
    canvas.paste(inner, ((SIZE[0] - inner.width) // 2, (SIZE[1] - inner.height) // 2))
    return canvas


def save(image: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / f"{name}.webp", format="WEBP", quality=88, method=6)
    print(f"Wrote {OUT / (name + '.webp')}")


def omit_credential_id(image: Image.Image) -> Image.Image:
    """Cover only the small credential-number strip, not the certificate body."""
    image = image.copy()
    draw = ImageDraw.Draw(image)
    width, height = image.size
    draw.rectangle((int(width * .72), int(height * .965), width, height), fill="white")
    return image


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_inae(source_dir: Path) -> Image.Image:
    pdf = source_dir / "INAE-mentee-saha-nilabro.pdf"
    approval = crop(render_page(pdf, 2), (.055, .34, .95, .43))
    row = crop(render_page(pdf, 4), (.105, .478, .895, .568))
    canvas = Image.new("RGB", SIZE, "#e9ece9")
    draw = ImageDraw.Draw(canvas)
    draw.text((95, 55), "01 / APPROVAL EMAIL EXCERPT", fill="#203a3d", font=font(30))
    draw.text((95, 565), "02 / NAMED APPENDIX ROW", fill="#203a3d", font=font(30))
    for piece, top, maximum_height in ((approval, 120, 375), (row, 630, 375)):
        fitted = ImageOps.contain(piece, (1410, maximum_height), Image.Resampling.LANCZOS)
        left = (SIZE[0] - fitted.width) // 2
        draw.rectangle((left - 2, top - 2, left + fitted.width + 2, top + fitted.height + 2), outline="#a9b7b1", width=3)
        canvas.paste(fitted, (left, top))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    args = parser.parse_args()
    source = args.source_dir.expanduser().resolve()

    academic = source / "Academic Certificates" / "Academic-certificates-saha-nilabro.pdf"
    professional = source / "Professional Certificates" / "Professional-certificates-saha-nilabro.pdf"
    award = source / "OAL-rock-star-saha-nilabro.pdf"

    previews = (
        (academic, 1, (.015, .02, .985, .985), "opjems-2019"),
        (academic, 2, (.025, .035, .975, .95), "opjems-2020"),
        (academic, 3, (.035, .04, .965, .945), "cmeri-internship"),
        (academic, 4, (.02, .02, .98, .94), "sih-2020"),
        (academic, 5, (.025, .025, .975, .97), "inacomm-2021"),
        (professional, 1, (.065, .07, .93, .875), "oracle-goldengate"),
        (professional, 3, (.065, .07, .93, .875), "oracle-fusion-ai"),
        (award, 1, (.08, .26, .93, .335), "oracle-rock-stars"),
    )
    for pdf, page, bounds, name in previews:
        excerpt = crop(render_page(pdf, page), bounds)
        if name.startswith("oracle-") and name != "oracle-rock-stars":
            excerpt = omit_credential_id(excerpt)
        save(fit_on_canvas(excerpt), name)
    save(make_inae(source), "inae-mentee")


if __name__ == "__main__":
    main()
