"""Soil report upload (OCR), confirmation, and demo-sample endpoints."""
import json
import logging
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app import config
from app.models.soil import (
    ConfirmRequest,
    ConfirmResponse,
    ExtractResponse,
    FieldProvenance,
    SoilField,
    SoilRecord,
)
from app.services import ocr_service, soil_parser
from app.services.report_store import get_report, save_confirmed, save_report

log = logging.getLogger("soilsaathi.soil_reports")
router = APIRouter()

ALLOWED_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}


@router.post("/soil-reports/extract", response_model=ExtractResponse)
async def extract_report(file: UploadFile = File(...), include_raw_text: bool = False):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use PDF, JPG or PNG.")
    data = await file.read()
    max_bytes = int(config.MAX_UPLOAD_MB * 1024 * 1024)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (>{config.MAX_UPLOAD_MB} MB).")

    report_id = f"report-{uuid.uuid4().hex[:8]}"
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    try:
        tmp.write(data)
        tmp.close()
        result = ocr_service.ocr_file(Path(tmp.name))
    finally:
        Path(tmp.name).unlink(missing_ok=True)  # never keep uploads on disk

    warnings = list(result.warnings)
    if not result.ocr_available:
        # Engine missing: store an empty record so the flow can continue via manual entry.
        record = SoilRecord(report_id=report_id, status="needs_confirmation",
                            missing_fields=[p["name"] for p in soil_parser.PARAMETERS],
                            raw_text_available=False, ocr_engine=None)
        save_report(record)
        return ExtractResponse(
            success=False, report_id=report_id, status="needs_confirmation",
            fields=[], missing_fields=record.missing_fields, raw_text_available=False,
            message="OCR engine unavailable — enter values manually or use demo mode.",
            warnings=warnings)

    parsed = soil_parser.parse_soil_text(result.text, result.words)
    if not result.text.strip():
        warnings.append("No text could be read from this file — it may be blank, blurred, or hand-written.")
    record = SoilRecord(
        report_id=report_id, status="needs_confirmation",
        fields=parsed.fields, missing_fields=parsed.missing,
        raw_text_available=bool(result.text.strip()), ocr_engine=result.engine)
    save_report(record)
    return ExtractResponse(
        success=True, report_id=report_id, status="needs_confirmation",
        fields=parsed.fields, missing_fields=parsed.missing,
        raw_text_available=bool(result.text.strip()),
        message="Review the extracted values before analysis. Values marked for review need your confirmation.",
        warnings=warnings,
        debug={"raw_text": result.text[:4000]} if include_raw_text else None,
    )


@router.post("/soil-reports/{report_id}/confirm", response_model=ConfirmResponse)
def confirm_report(report_id: str, body: ConfirmRequest):
    record = get_report(report_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Unknown report_id '{report_id}'.")
    values: dict[str, dict] = {}
    for v in body.values:
        values[v.parameter] = {"value": v.value, "unit": v.unit, "form": v.form,
                               "provenance": v.provenance.value}
    save_confirmed(report_id, values)
    record.status = "confirmed"
    save_report(record)
    still_missing = [p["name"] for p in soil_parser.PARAMETERS if p["name"] not in values]
    return ConfirmResponse(
        success=True, report_id=report_id, status="confirmed",
        confirmed_count=len(values), still_missing=still_missing,
        message=f"{len(values)} value(s) confirmed. Missing parameters stay missing — never zero-filled.")


@router.get("/soil-reports/{report_id}")
def get_report_status(report_id: str):
    record = get_report(report_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Unknown report_id '{report_id}'.")
    return record


@router.get("/demo/sample-report")
def demo_sample_report():
    """Explicitly labelled demo data — NOT from OCR. For the 5-minute recording."""
    fixture_path = Path(__file__).resolve().parent.parent.parent / "data" / "sample_report_fixture.json"
    try:
        fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Demo fixture missing — see data/README.md.")
    report_id = f"demo-{uuid.uuid4().hex[:8]}"
    fields = [SoilField(parameter=f["parameter"], label=f.get("label"), value=f["value"],
                        unit=f.get("unit"), form=f.get("form"), needs_review=False,
                        provenance=FieldProvenance.DEMO) for f in fixture["fields"]]
    record = SoilRecord(report_id=report_id, status="needs_confirmation", fields=fields,
                        missing_fields=[], raw_text_available=False, is_demo=True)
    save_report(record)
    save_confirmed(report_id, {f["parameter"]: {"value": f["value"], "unit": f.get("unit"),
                                                "form": f.get("form"), "provenance": "demo"}
                               for f in fixture["fields"]})
    return {
        "success": True,
        "is_demo": True,
        "demo_label": "SYNTHETIC SAMPLE — values are predefined demo data, NOT read from any upload by OCR.",
        "report_id": report_id,
        "status": "confirmed",
        "fields": fields,
        "message": "Demo sample loaded and pre-confirmed. Proceed straight to analysis.",
    }
