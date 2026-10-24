# SasyaSakhi backend `data/` directory

## Workbook status: PRESENT

`SoilSaathi_ML_Crop_Nutrient_Datasets_800Rows.xlsx` is in this folder (copied
from the shared files on 2026-10-24). It is the file `/api/health` reports.

## What Team 1 must drop here (if replacing the file)

Place **one** of these workbook files in this folder (exact name preferred):

- `SoilSaathi_Prototype_Ready_Dataset.xlsx` (preferred), or
- `SoilSaathi_ML_Crop_Nutrient_Datasets_800Rows.xlsx`

Any other `*.xlsx` in this folder is picked up as a fallback, but the names
above are what `/api/health` reports. **Do not commit private farmer reports here.**

## Expected workbook layout (column matching is case-insensitive)

The backend looks for these logical datasets by matching sheet names and
columns. A sheet that cannot be mapped is reported as unavailable in
`/api/health` — the backend keeps running and degrades gracefully.

| Logical dataset | Sheet-name hints | Minimum columns |
|---|---|---|
| `soil_records` | soil, records, samples, data | `ph` |
| `crop_nutrient_requirements` | crop, nutrient, requirement | `crop` (+ optional per-parameter `ph_min`/`ph_max`, `ec_min`/`ec_max`, `n_min`/`n_max`, …) |
| `fertility_reference_ranges` | fertility, reference, range, rating | `parameter` |
| `fertilizer_rules` (STCR) | fertilizer, stcr, recommendation, dose | `crop`, `nutrient`, `target_yield_q_ha`, `nr`, `cs`, `cf` |
| `ocr_test_cases` | ocr, test | (any) |

STCR columns: `nr` = kg nutrient per quintal of produce, `cs` = soil-test
efficiency factor, `cf` = fertiliser efficiency factor. Dose is computed as
`(nr × target_yield_q_ha − cs × soil_test_value) / cf`.

## What happens without the workbook

Everything still runs. `/api/health` reports `"workbook_found": false` and
which datasets are missing; crop suitability uses built-in agronomic defaults
(labelled `BUILTIN_*`); fertiliser recommendations return `needs_review` with a
labelled general reference instead of a soil-test-based dose. Nothing is
fabricated to look like workbook data.

## Demo fixture (synthetic)

`sample_report_fixture.json` is the **synthetic** sample report used by
`GET /api/demo/sample-report` and the OCR tests. `synthetic_sample_report.png`
is a generated image of a fake soil health card with the same values — it is
not a real lab report and is labelled synthetic everywhere it is used.
