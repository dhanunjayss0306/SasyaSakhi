"""Data loader: missing/malformed workbook handling and sheet mapping."""
import pandas as pd

from app.services.data_loader import DataLoader


def test_missing_workbook_reports_missing(tmp_path):
    loader = DataLoader(data_dir=tmp_path)
    status = loader.load()
    assert status.workbook_found is False
    assert status.workbook_error is not None
    for logical, info in status.datasets.items():
        assert info["available"] is False
    assert loader.get("crop_nutrient_requirements") is None


def test_malformed_workbook_reports_error(tmp_path):
    bad = tmp_path / "SoilSaathi_Prototype_Ready_Dataset.xlsx"
    bad.write_bytes(b"not a real xlsx")
    loader = DataLoader(data_dir=tmp_path)
    status = loader.load()
    assert status.workbook_found is True
    assert status.workbook_error is not None
    assert loader.get("soil_records") is None


def test_minimal_workbook_maps_sheets(tmp_path):
    wb = tmp_path / "SoilSaathi_Prototype_Ready_Dataset.xlsx"
    with pd.ExcelWriter(wb) as w:
        pd.DataFrame({"Crop_Name": ["paddy"], "Optimum_pH_Min": [5.5],
                      "Optimum_pH_Max": [7.5]}).to_excel(
            w, sheet_name="Crop Requirements", index=False)
        pd.DataFrame({"pH": [6.8]}).to_excel(w, sheet_name="Soil Records", index=False)
    loader = DataLoader(data_dir=tmp_path)
    status = loader.load()
    assert status.workbook_found is True
    assert status.datasets["crop_nutrient_requirements"]["available"] is True
    assert status.datasets["soil_records"]["available"] is True
    # Sheet missing a required column -> reported unavailable, not crashed on.
    assert status.datasets["fertilizer_rules"]["available"] is False


def test_sheet_missing_required_column(tmp_path):
    wb = tmp_path / "data.xlsx"
    with pd.ExcelWriter(wb) as w:
        pd.DataFrame({"SomethingElse": [1]}).to_excel(w, sheet_name="Crop Nutrient Requirements", index=False)
    loader = DataLoader(data_dir=tmp_path)
    status = loader.load()
    assert status.datasets["crop_nutrient_requirements"]["available"] is False
