"""Validate the OCR parser against Team 1's 100-case OCR ground truth.

Honest two-track design, mirroring the sheet's own intent:
- Needs_Human_Review=No cases: parser must extract the right value AND the
  canonical unit.
- Needs_Human_Review=Yes cases (biological outliers like 'pH 68', decimal
  shifts like 'SOIL_N 2200'): the parser must FLAG them (needs_review=True);
  the Ground_Truth_Value is what a human reviewer would correct them to, so
  value agreement is not asserted there.
"""
import pandas as pd

from app.services.data_loader import loader
from app.services.soil_parser import CANONICAL_UNITS, parse_soil_text

CODE_TO_PARAM = {
    "SOIL_PH": "pH", "SOIL_EC": "EC", "SOIL_OC": "OC", "SOIL_N": "N",
    "SOIL_P2O5": "P", "SOIL_K2O": "K", "SOIL_ZN": "Zn", "SOIL_S": "S",
    "SOIL_FE": "Fe",
}


def test_parser_against_ground_truth():
    loader.load()
    df = loader.get("ocr_test_cases")
    assert df is not None, "OCR ground truth sheet not loaded"
    total = matched = flagged = 0
    failures = []
    for _, row in df.iterrows():
        param = CODE_TO_PARAM.get(str(row["Canonical_Code"]).strip())
        if param is None:
            continue
        raw = str(row["Extracted_Text_Raw"])
        try:
            gt_value = float(row["Ground_Truth_Value"])
        except (ValueError, TypeError):
            continue
        needs_review = str(row["Needs_Human_Review"]).strip().lower() == "yes"
        parsed = parse_soil_text(raw)
        found = next((f for f in parsed.fields if f.parameter == param), None)
        total += 1
        if needs_review:
            # Must be found and flagged — value correction is the human's job.
            if found is not None and found.needs_review:
                flagged += 1
                matched += 1
            else:
                failures.append((row["Test_Case_ID"], raw, "NOT FLAGGED"))
            continue
        ok = (found is not None and found.value is not None
              and abs(found.value - gt_value) <= max(0.05, abs(gt_value) * 0.02)
              and (found.canonical_unit or found.unit) == CANONICAL_UNITS[param])
        if ok:
            matched += 1
        else:
            failures.append((row["Test_Case_ID"], raw,
                             found.value if found else None,
                             (found.canonical_unit or found.unit) if found else None,
                             gt_value, CANONICAL_UNITS[param]))
    rate = matched / total if total else 0
    print(f"\nOCR ground-truth agreement: {matched}/{total} = {rate:.1%} "
          f"({flagged} outlier cases correctly flagged for review)")
    for f in failures[:12]:
        print("  MISS:", f)
    assert total >= 90, f"expected ~100 usable cases, got {total}"
    assert rate >= 0.80, f"parser agreement {rate:.1%} below 80% threshold"
