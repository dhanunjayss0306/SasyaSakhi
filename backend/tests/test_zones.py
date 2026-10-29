"""Zone lookup: Vizag resolves, unknown districts never get a guessed zone."""

from app.services import zone_service


def test_visakhapatnam_resolves_to_its_zone():
    result = zone_service.lookup("Visakhapatnam")
    assert result["found"] is True
    assert result["zone"]["zone_id"] == "AP-AZ-002"
    assert "Visakhapatnam" in result["zone"]["districts"]
    assert result["zone"]["overall_water_mm"] is not None


def test_unknown_district_returns_no_zone():
    result = zone_service.lookup("Nowhereville")
    assert result["found"] is False
    assert "zone" not in result


def test_districts_list_is_nonempty():
    districts = zone_service.districts()
    assert "Visakhapatnam" in districts
    assert len(districts) > 100
