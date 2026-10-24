"""Soil analysis + fertilizer recommendation data contracts."""
from typing import Optional

from pydantic import BaseModel, Field

from app.models.crop import ConfirmedValueRef


class ParameterAssessment(BaseModel):
    parameter: str
    value: Optional[float]
    unit: Optional[str] = None
    category: Optional[str] = Field(default=None, description="e.g. 'low' | 'medium' | 'high' | 'acidic' ...")
    status: str = Field(description="'ok' | 'concern' | 'insufficient_data'")
    explanation: str = ""
    rule_id: Optional[str] = None
    source: Optional[str] = None


class SoilAnalysisRequest(BaseModel):
    values: list[ConfirmedValueRef] = Field(default_factory=list)
    report_id: Optional[str] = Field(default=None)


class SoilAnalysisResponse(BaseModel):
    success: bool
    assessments: list[ParameterAssessment]
    overall_notes: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class FertilizerItem(BaseModel):
    product: str
    nutrient: str
    quantity: float
    unit: str
    unit_price: Optional[float] = None
    total_cost: Optional[float] = None
    currency: str = "INR"


class FertilizerRequest(BaseModel):
    crop: str
    values: list[ConfirmedValueRef] = Field(default_factory=list)
    report_id: Optional[str] = Field(default=None)
    area: float = Field(default=1.0, description="Farm area")
    area_unit: str = Field(default="acre", description="'acre' | 'ha'")
    target_yield_q_per_ha: Optional[float] = Field(default=None)
    prices: Optional[dict[str, float]] = Field(
        default=None, description="Optional demo prices: product name -> price per unit, e.g. {'Urea': 6.0}"
    )


class FertilizerResponse(BaseModel):
    success: bool
    crop: str
    status: str = Field(description="'calculated' | 'needs_review' | 'insufficient_data' | 'price_not_configured'")
    dose_basis: str = Field(default="workbook_rule",
                            description="'workbook_rule' | 'general_reference' — general_reference doses are published RDF, NOT soil-test adjusted")
    items: list[FertilizerItem] = Field(default_factory=list)
    total_cost: Optional[float] = None
    currency: str = "INR"
    area: float = 1.0
    area_unit: str = "acre"
    rule_id: Optional[str] = None
    inputs_used: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    explanation: str = ""
    limitations: list[str] = Field(default_factory=list)
