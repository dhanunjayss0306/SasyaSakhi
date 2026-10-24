"""OCR service tests: real Tesseract on the synthetic sample, plus the
engine-missing degradation path."""
import shutil
from pathlib import Path

import pytest

from app.services import ocr_service
from app.services.soil_parser import parse_soil_text

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_PNG = DATA_DIR / "synthetic_sample_report.png"
FIXTURE = DATA_DIR / "sample_report_fixture.json"

requires_tesseract = pytest.mark.skipif(
    not ocr_service.tesseract_available(), reason="tesseract binary not installed")


@requires_tesseract
def test_ocr_reads_synthetic_sample():
    import json
    from PIL import Image
    expected = {f["parameter"]: f["value"] for f in json.loads(FIXTURE.read_text())["fields"]}
    with Image.open(SAMPLE_PNG) as img:
        result = ocr_service.ocr_image(img)
    assert result.ocr_available is True
    assert result.text.strip(), "OCR returned no text at all"
    parsed = parse_soil_text(result.text, result.words)
    found = {f.parameter: f.value for f in parsed.fields}
    # Every expected parameter must be extracted with the right value.
    for param, value in expected.items():
        assert param in found, f"{param} not extracted. OCR text:\n{result.text}"
        assert found[param] == pytest.approx(value, abs=0.05), \
            f"{param}: got {found[param]}, expected {value}"
    # P/K forms must be distinguished.
    forms = {f.parameter: f.form for f in parsed.fields}
    assert forms["P"] == "P2O5"
    assert forms["K"] == "K2O"


def test_ocr_unavailable_reports_gracefully(monkeypatch):
    monkeypatch.setattr(shutil, "which", lambda *a, **k: None)
    monkeypatch.setattr(ocr_service.config, "TESSERACT_CMD", "")
    from PIL import Image
    with Image.open(SAMPLE_PNG) as img:
        result = ocr_service.ocr_image(img)
    assert result.ocr_available is False
    assert any("not installed" in w for w in result.warnings)
    assert result.text == ""


def test_unsupported_file_type():
    result = ocr_service.ocr_file(Path("/tmp/report.docx"))
    assert any("Unsupported" in w for w in result.warnings)
