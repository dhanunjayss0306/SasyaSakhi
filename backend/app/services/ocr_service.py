"""OCR service: images -> text via Tesseract, PDFs via embedded text + OCR.

Honesty rules:
- If the Tesseract binary is missing, every OCR attempt reports
  `ocr_available: false` with a setup hint. Nothing is faked.
- Confidence is returned only when Tesseract provides word-level data.
  Otherwise it is None — never invented.
- Raw text is preserved for debugging; the parser never fills missing
  values with zero.
"""
from __future__ import annotations

import logging
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps

from app import config

log = logging.getLogger("soilsaathi.ocr_service")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}


def tesseract_available() -> bool:
    if config.TESSERACT_CMD and Path(config.TESSERACT_CMD).is_file():
        return True
    return shutil.which("tesseract") is not None


def _tesseract_cmd() -> Optional[str]:
    if config.TESSERACT_CMD and Path(config.TESSERACT_CMD).is_file():
        return config.TESSERACT_CMD
    return shutil.which("tesseract")


@dataclass
class OCRResult:
    ocr_available: bool
    text: str = ""
    words: list[dict] = field(default_factory=list)  # {text, conf, ...}
    engine: Optional[str] = None
    warnings: list[str] = field(default_factory=list)


def preprocess(image: Image.Image) -> Image.Image:
    """Light cleanup that helps Tesseract: grayscale, autocontrast, upscale tiny images."""
    img = ImageOps.exif_transpose(image).convert("L")
    img = ImageOps.autocontrast(img, cutoff=1)
    w, h = img.size
    if max(w, h) < 1500:  # small phone photos of reports need upscaling
        img = img.resize((w * 2, h * 2), Image.LANCZOS)
    return img


def ocr_image(image: Image.Image) -> OCRResult:
    cmd = _tesseract_cmd()
    if cmd is None:
        return OCRResult(
            ocr_available=False,
            warnings=[
                "Tesseract OCR is not installed. Install it to enable report scanning "
                "(see README 'Windows setup'), or use manual entry / demo mode."
            ],
        )
    import pytesseract

    if config.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_CMD
    img = preprocess(image)
    try:
        text = pytesseract.image_to_string(img, lang="eng")
        data = pytesseract.image_to_data(img, lang="eng", output_type=pytesseract.Output.DICT)
    except Exception as exc:
        log.error("tesseract failed: %s", exc)
        return OCRResult(ocr_available=True, engine="tesseract",
                         warnings=[f"OCR engine error: {exc}"])
    words: list[dict] = []
    n = len(data.get("text", []))
    for i in range(n):
        t = (data["text"][i] or "").strip()
        if not t:
            continue
        try:
            conf = float(data["conf"][i])
        except (ValueError, TypeError):
            conf = -1.0
        words.append({"text": t, "conf": conf if conf >= 0 else None})
    return OCRResult(ocr_available=True, text=text, words=words, engine="tesseract")


def ocr_file(path: Path) -> OCRResult:
    """Run OCR over an uploaded report file (image or PDF)."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        return ocr_pdf(path)
    if ext in IMAGE_EXTS:
        with Image.open(path) as img:
            return ocr_image(img.copy())
    return OCRResult(ocr_available=tesseract_available(),
                     warnings=[f"Unsupported file type: {ext}"])


def ocr_pdf(pdf_path: Path) -> OCRResult:
    from app.services import pdf_service

    warnings: list[str] = []
    try:
        embedded, scanned = pdf_service.extract_embedded_text(pdf_path)
    except Exception as exc:
        return OCRResult(ocr_available=tesseract_available(),
                         warnings=[f"Could not read PDF: {exc}"])

    texts = [embedded] if embedded.strip() else []
    all_words: list[dict] = []
    engine: Optional[str] = None

    if scanned:
        if not tesseract_available():
            warnings.append(
                f"PDF has {len(scanned)} scanned page(s) but Tesseract is not installed — "
                "their content could not be read. Install Tesseract (see README) or use manual entry."
            )
        else:
            try:
                images = pdf_service.render_pages(pdf_path, scanned)
            except RuntimeError as exc:
                warnings.append(str(exc))
                images = []
            for img in images:
                r = ocr_image(img)
                if r.text.strip():
                    texts.append(r.text)
                all_words.extend(r.words)
                engine = r.engine or engine
                warnings.extend(r.warnings)

    if not texts and not warnings:
        warnings.append("No readable text found in this PDF.")
    return OCRResult(
        ocr_available=tesseract_available() or bool(embedded.strip()),
        text="\n".join(texts),
        words=all_words,
        engine=engine or ("embedded-text" if embedded.strip() else None),
        warnings=warnings,
    )
