"""In-memory report store. Prototype only: reports live for the process lifetime.
Nothing is written to disk; uploads are processed from temp files and deleted."""
from __future__ import annotations

from typing import Optional

from app.models.soil import SoilRecord

_reports: dict[str, SoilRecord] = {}
# report_id -> {parameter: {'value': float|None, 'unit': str|None, 'form': str|None}}
_confirmed: dict[str, dict[str, dict]] = {}


def save_report(record: SoilRecord) -> None:
    _reports[record.report_id] = record


def get_report(report_id: str) -> Optional[SoilRecord]:
    return _reports.get(report_id)


def save_confirmed(report_id: str, values: dict[str, dict]) -> None:
    _confirmed[report_id] = values


def get_confirmed(report_id: str) -> Optional[dict[str, dict]]:
    return _confirmed.get(report_id)


def resolve_values(report_id: Optional[str], values: list) -> tuple[Optional[dict], Optional[str]]:
    """Return (values_dict, error). values_dict maps parameter -> {value, unit, form}."""
    if values:
        out: dict[str, dict] = {}
        for v in values:
            d = v.model_dump() if hasattr(v, "model_dump") else dict(v)
            out[str(d.get("parameter"))] = {
                "value": d.get("value"), "unit": d.get("unit"), "form": d.get("form")}
        return out, None
    if report_id:
        confirmed = get_confirmed(report_id)
        if confirmed is None:
            return None, f"Report {report_id} has no confirmed values yet — confirm the extracted values first."
        return confirmed, None
    return None, "Provide either 'values' or a confirmed 'report_id'."
