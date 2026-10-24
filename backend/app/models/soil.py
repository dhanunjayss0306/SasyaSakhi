"""Soil record data contracts — shared by OCR extraction, confirmation, and analysis."""
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class FieldProvenance(str, Enum):
    """How a soil value came to exist. Never trust OCR output without review."""
    EXTRACTED = "extracted"   # came from OCR, not yet reviewed
    MANUAL = "manual"         # typed by the farmer
    CORRECTED = "corrected"   # OCR value the farmer edited
    DEMO = "demo"             # explicitly labelled sample data


class SoilField(BaseModel):
    """One extracted soil parameter with its review state."""
    parameter: str = Field(..., description="Canonical name, e.g. 'pH', 'EC', 'N'")
    label: Optional[str] = Field(default=None, description="Raw label seen in the report")
    value: Optional[float] = Field(default=None, description="Numeric value; None if unreadable")
    unit: Optional[str] = Field(default=None, description="Unit as read; falls back to the canonical unit")
    canonical_unit: Optional[str] = Field(default=None, description="Conventional unit for this parameter")
    form: Optional[str] = Field(default=None, description="Nutrient form, e.g. 'P2O5' vs 'P', 'K2O' vs 'K'")
    confidence: Optional[float] = Field(
        default=None,
        description="OCR word confidence 0-100 when the engine provides it; None otherwise (never invented)",
    )
    needs_review: bool = Field(default=True)
    provenance: FieldProvenance = Field(default=FieldProvenance.EXTRACTED)
    original_text: Optional[str] = Field(default=None, description="Raw OCR snippet for debugging")


class ConfirmedValue(BaseModel):
    """A farmer-confirmed soil value."""
    parameter: str
    value: Optional[float] = Field(default=None, description="None means: measured but unreadable -> stays missing")
    unit: Optional[str] = None
    form: Optional[str] = None
    provenance: FieldProvenance = Field(default=FieldProvenance.CORRECTED)


class ConfirmRequest(BaseModel):
    values: list[ConfirmedValue] = Field(..., description="Farmer-corrected values; missing params stay missing")
    area_acre: Optional[float] = Field(default=None, description="Farm area for cost estimates")
    area_unit: str = Field(default="acre")


class SoilRecord(BaseModel):
    report_id: str
    status: str = Field(description="'needs_confirmation' | 'confirmed'")
    fields: list[SoilField] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    raw_text_available: bool = False
    ocr_engine: Optional[str] = None
    is_demo: bool = False


class ExtractResponse(BaseModel):
    success: bool
    report_id: str
    status: str
    fields: list[SoilField]
    missing_fields: list[str]
    raw_text_available: bool
    message: str
    warnings: list[str] = Field(default_factory=list)
    debug: Optional[dict[str, Any]] = Field(default=None, description="Raw OCR text etc.; dev only")


class ConfirmResponse(BaseModel):
    success: bool
    report_id: str
    status: str
    confirmed_count: int
    still_missing: list[str]
    message: str
