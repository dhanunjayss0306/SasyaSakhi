"""Health endpoint: service + OCR engine + dataset readiness."""
from fastapi import APIRouter

from app import config
from app.services import ocr_service
from app.services.data_loader import loader

router = APIRouter()


@router.get("/health")
def health() -> dict:
    ds = loader.status.summary()
    return {
        "status": "ok",
        "service": config.APP_NAME,
        "version": config.APP_VERSION,
        "ocr": {
            "available": ocr_service.tesseract_available(),
            "engine": "tesseract" if ocr_service.tesseract_available() else None,
            "note": None if ocr_service.tesseract_available()
            else "Tesseract not installed — OCR endpoints will report ocr_available=false. See README.",
        },
        "dataset": ds,
        "ready_for_demo": True,
        "limitations": [
            l for l in [
                None if ds["workbook_found"] else
                "Workbook missing: crop/fertiliser rules fall back to built-in defaults / needs_review until Team 1 drops the file in data/.",
                None if ocr_service.tesseract_available() else
                "OCR engine missing: uploads cannot be scanned until Tesseract is installed.",
            ] if l
        ],
    }
