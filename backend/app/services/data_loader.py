"""Workbook loader.

Loads Team 1's Excel workbook ONCE at startup (or on explicit reload).
If the workbook is missing or malformed, the backend keeps running and every
rule-based service degrades to explicit `insufficient_data` / `needs_review`
instead of inventing values.

Expected workbook (see data/README.md for the full contract):

    SoilSaathi_Prototype_Ready_Dataset.xlsx   (preferred)
    SoilSaathi_ML_Crop_Nutrient_Datasets_800Rows.xlsx

Column matching is case-insensitive and tolerant of extra whitespace, but the
loader never guesses a missing column: a dataset that cannot be mapped is
reported as unavailable.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import pandas as pd

from app import config

log = logging.getLogger("soilsaathi.data_loader")

CANDIDATE_FILES = [
    "SoilSaathi_Prototype_Ready_Dataset.xlsx",
    "SoilSaathi_ML_Crop_Nutrient_Datasets_800Rows.xlsx",
]

# Logical datasets the backend wants, with the sheet-name hints and the
# minimum columns each sheet must have to be usable. All matching is
# case-insensitive on normalised (lower, stripped) names.
REQUIRED_DATASETS: dict[str, dict[str, Any]] = {
    "soil_records": {
        "sheet_hints": ["soil", "records", "samples", "data"],
        "min_columns": ["ph"],
    },
    "crop_nutrient_requirements": {
        "sheet_hints": ["crop", "nutrient", "requirement"],
        "min_columns": ["crop_name"],
    },
    "fertility_reference_ranges": {
        "sheet_hints": ["fertility", "reference", "range", "rating"],
        "min_columns": [],  # special-cased: headerless chart, see _read_fertility_chart
        "headerless": True,
    },
    "fertilizer_rules": {
        "sheet_hints": ["fertilizer", "stcr", "recommendation", "dose"],
        "min_columns": ["target_crop"],
    },
    "ocr_test_cases": {
        "sheet_hints": ["ocr", "test"],
        "min_columns": [],
    },
}

# Column names assigned to the headerless Soil_Fertility_Rating_Chart.
FERTILITY_CHART_COLUMNS = [
    "param_id", "parameter", "unit", "method",
    "very_low", "low", "medium", "high", "very_high",
    "threshold_note", "importance",
]


def _norm(name: str) -> str:
    return str(name).strip().lower()


@dataclass
class DatasetStatus:
    workbook_found: bool = False
    workbook_path: Optional[str] = None
    workbook_error: Optional[str] = None
    sheets: list[str] = field(default_factory=list)
    datasets: dict[str, dict[str, Any]] = field(default_factory=dict)

    def summary(self) -> dict[str, Any]:
        return {
            "workbook_found": self.workbook_found,
            "workbook_path": self.workbook_path,
            "workbook_error": self.workbook_error,
            "sheets": self.sheets,
            "datasets": self.datasets,
        }


class DataLoader:
    """Loads and holds the workbook dataframes in memory."""

    def __init__(self, data_dir: Optional[Path] = None) -> None:
        self.data_dir = Path(data_dir or config.DATA_DIR)
        self.status = DatasetStatus()
        self.frames: dict[str, pd.DataFrame] = {}
        self.mapped: dict[str, dict[str, Any]] = {}

    # ------------------------------------------------------------------ load
    def find_workbook(self) -> Optional[Path]:
        for name in CANDIDATE_FILES:
            p = self.data_dir / name
            if p.is_file():
                return p
        # Fall back to any .xlsx in data/ so a renamed file still gets noticed.
        xlsx = sorted(self.data_dir.glob("*.xlsx"))
        return xlsx[0] if xlsx else None

    def load(self) -> DatasetStatus:
        self.frames = {}
        self.mapped = {}
        self.status = DatasetStatus()
        wb = self.find_workbook()
        if wb is None:
            self.status.workbook_error = (
                f"No workbook found in {self.data_dir}. Expected one of: "
                + ", ".join(CANDIDATE_FILES)
                + ". See data/README.md — Team 1 must drop the file there."
            )
            log.warning(self.status.workbook_error)
            self._mark_all_missing("workbook not found")
            return self.status
        try:
            xls = pd.ExcelFile(wb)
        except Exception as exc:  # malformed file
            self.status.workbook_found = True
            self.status.workbook_path = str(wb)
            self.status.workbook_error = f"Could not read workbook {wb.name}: {exc}"
            log.error(self.status.workbook_error)
            self._mark_all_missing("workbook unreadable")
            return self.status

        self.status.workbook_found = True
        self.status.workbook_path = str(wb)
        self.status.sheets = list(xls.sheet_names)
        for logical, spec in REQUIRED_DATASETS.items():
            sheet = self._pick_sheet(xls.sheet_names, spec["sheet_hints"])
            if sheet is None:
                self._mark_missing(logical, "no matching sheet")
                continue
            try:
                if spec.get("headerless"):
                    df = pd.read_excel(wb, sheet_name=sheet, header=None)
                    df.columns = FERTILITY_CHART_COLUMNS[: len(df.columns)]
                else:
                    df = xls.parse(sheet)
            except Exception as exc:
                self._mark_missing(logical, f"sheet '{sheet}' unreadable: {exc}")
                continue
            cols = {_norm(c): c for c in df.columns}
            missing_cols = [c for c in spec["min_columns"] if c not in cols]
            if missing_cols:
                self._mark_missing(logical, f"sheet '{sheet}' lacks columns: {missing_cols}")
                continue
            self.frames[logical] = df
            self.mapped[logical] = {"sheet": sheet, "columns": {k: cols[k] for k in cols}}
            self.status.datasets[logical] = {
                "available": True,
                "sheet": sheet,
                "rows": int(len(df)),
                "columns": list(df.columns),
            }
        return self.status

    # ---------------------------------------------------------------- helpers
    def _mark_all_missing(self, reason: str) -> None:
        for logical in REQUIRED_DATASETS:
            self._mark_missing(logical, reason)

    def _mark_missing(self, logical: str, reason: str) -> None:
        self.status.datasets[logical] = {"available": False, "reason": reason}

    @staticmethod
    def _pick_sheet(sheet_names: list[str], hints: list[str]) -> Optional[str]:
        scored: list[tuple[int, str]] = []
        for s in sheet_names:
            n = _norm(s)
            score = sum(1 for h in hints if h in n)
            if score:
                scored.append((score, s))
        if not scored:
            return None
        scored.sort(reverse=True)
        return scored[0][1]

    # ------------------------------------------------------------- accessors
    def get(self, logical: str) -> Optional[pd.DataFrame]:
        """Return the dataframe for a logical dataset, or None if unavailable."""
        return self.frames.get(logical)

    def is_available(self, logical: str) -> bool:
        return self.frames.get(logical) is not None

    def reload(self) -> DatasetStatus:
        return self.load()


# Singleton used by the API routers.
loader = DataLoader()
