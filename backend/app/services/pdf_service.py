"""PDF handling: embedded-text extraction first, page rendering second.

Uses pypdf for embedded text. If a page has no usable embedded text it is a
scan, so the page is rendered to an image with poppler's pdftoppm (via
pdf2image). Poppler must be installed (README has Windows steps).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

log = logging.getLogger("soilsaathi.pdf_service")


def extract_embedded_text(pdf_path: Path) -> tuple[str, list[int]]:
    """Return (text, scanned_page_numbers). Pages with <20 chars of embedded
    text are treated as scanned and listed for OCR rendering."""
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    texts: list[str] = []
    scanned: list[int] = []
    for i, page in enumerate(reader.pages):
        try:
            t = page.extract_text() or ""
        except Exception as exc:
            log.warning("pypdf failed on page %d: %s", i, exc)
            t = ""
        if len(t.strip()) < 20:
            scanned.append(i)
        texts.append(t)
    return "\n".join(texts), scanned


def render_pages(pdf_path: Path, pages: Optional[list[int]] = None, dpi: int = 300):
    """Render PDF pages to PIL images. Raises RuntimeError if poppler is missing."""
    from pdf2image import convert_from_path
    from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError

    first = (min(pages) + 1) if pages else None
    last = (max(pages) + 1) if pages else None
    try:
        images = convert_from_path(str(pdf_path), dpi=dpi, first_page=first, last_page=last)
    except (PDFInfoNotInstalledError, PDFPageCountError, FileNotFoundError) as exc:
        raise RuntimeError(
            "Poppler (pdftoppm) is not installed or not on PATH. "
            "Install it — see README 'Windows setup' — to OCR scanned PDFs."
        ) from exc
    if pages is not None:
        wanted = set(pages)
        images = [img for idx, img in enumerate(images) if (first - 1 + idx) in wanted]
    return images
