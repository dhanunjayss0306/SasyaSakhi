"""Crop suitability data contracts."""
from typing import Optional

from pydantic import BaseModel, Field


class CropSuitability(BaseModel):
    crop: str
    status: str = Field(description="'suitable' | 'marginal' | 'unsuitable' | 'insufficient_data'")
    parameters_in_range: Optional[int] = Field(default=None)
    parameters_compared: Optional[int] = Field(default=None)
    supporting_factors: list[str] = Field(default_factory=list)
    limiting_factors: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    rule_ids: list[str] = Field(default_factory=list)
    explanation: str = ""
    limitations: list[str] = Field(default_factory=list)


class CropSuitabilityRequest(BaseModel):
    values: list["ConfirmedValueRef"] = Field(default_factory=list)
    report_id: Optional[str] = Field(default=None, description="Use a previously confirmed report instead of values")


class ConfirmedValueRef(BaseModel):
    parameter: str
    value: Optional[float] = None
    unit: Optional[str] = None
    form: Optional[str] = None


class CropSuitabilityResponse(BaseModel):
    success: bool
    results: list[CropSuitability]
    warnings: list[str] = Field(default_factory=list)
