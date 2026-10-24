"""Generate the synthetic demo soil report image + expected-values fixture.

The PNG is a fake "soil health card" rendered with PIL — clearly labelled
SYNTHETIC/SAMPLE. It exists so the OCR pipeline and the demo endpoint have a
known input. It is NOT a real lab report.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

DATA_DIR = Path(__file__).resolve().parent

# (label as printed, canonical parameter, value, unit, form)
ROWS = [
    ("pH", "pH", 6.8, None, None),
    ("EC", "EC", 0.42, "dS/m", None),
    ("Organic Carbon", "OC", 0.62, "%", None),
    ("Nitrogen (N)", "N", 310, "kg/ha", None),
    ("Phosphorus (P2O5)", "P", 28, "kg/ha", "P2O5"),
    ("Potassium (K2O)", "K", 190, "kg/ha", "K2O"),
    ("Sulphur (S)", "S", 12, "ppm", None),
    ("Zinc (Zn)", "Zn", 0.8, "ppm", None),
    ("Iron (Fe)", "Fe", 5.2, "ppm", None),
]

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def main() -> None:
    title_f = ImageFont.truetype(FONT_BOLD, 44)
    head_f = ImageFont.truetype(FONT_BOLD, 30)
    body_f = ImageFont.truetype(FONT, 30)

    lines = [
        ("title", "SOIL HEALTH CARD"),
        ("head", "SAMPLE - SYNTHETIC DEMO REPORT (not a real lab report)"),
        ("head", "Demo Soil Testing Lab, Vijayawada"),
        ("blank", ""),
    ]
    for label, _p, v, u, _f in ROWS:
        lines.append(("row", f"{label}: {v}" + (f" {u}" if u else "")))

    W, PAD, LH = 1100, 60, 58
    H = PAD * 2 + 100 + len(lines) * LH
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    y = PAD
    for kind, text in lines:
        if kind == "blank":
            y += LH // 2
            continue
        f = title_f if kind == "title" else head_f if kind == "head" else body_f
        fill = (180, 30, 30) if kind == "head" and "SYNTHETIC" in text else (20, 20, 20)
        d.text((PAD, y), text, font=f, fill=fill)
        y += LH + (20 if kind == "title" else 0)

    png_path = DATA_DIR / "synthetic_sample_report.png"
    img.save(png_path)

    fixture = {
        "synthetic": True,
        "label": "SYNTHETIC SAMPLE — predefined demo values, NOT produced by OCR.",
        "source_image": "synthetic_sample_report.png",
        "fields": [
            {"parameter": p, "label": label, "value": v, "unit": u, "form": f}
            for label, p, v, u, f in ROWS
        ],
    }
    (DATA_DIR / "sample_report_fixture.json").write_text(json.dumps(fixture, indent=2), encoding="utf-8")
    print(f"wrote {png_path} and sample_report_fixture.json")


if __name__ == "__main__":
    main()
