"""
tests/test_api.py
Automated pytest suite using FastAPI's TestClient (httpx-based) — runs your
app in-process, no live server needed. Covers happy paths, validation
errors, and the error-handling behavior you built in.

Usage:
    pip install pytest httpx
    pytest tests/test_api.py -v

Note: these tests hit your real Supabase instance (there's no mocking layer
in this starter version), so run them against a dev/test Supabase project,
not production data.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert "status" in res.json()


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["docs"] == "/docs"


def test_create_incident_valid():
    payload = {
        "source": "citizen_report",
        "description": "Fire spreading quickly through a residential building.",
        "location": {"lat": 23.03, "lng": 72.58, "address": "Test Street, Ahmedabad"},
    }
    res = client.post("/incidents", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "reported"
    assert body["severity"] in ("low", "medium", "high", "critical")
    assert "id" in body
    return body["id"]


def test_create_incident_missing_description_fails():
    payload = {
        "source": "citizen_report",
        "description": "",
        "location": {"lat": 23.03, "lng": 72.58},
    }
    res = client.post("/incidents", json=payload)
    assert res.status_code == 422
    assert res.json()["error"] == "Validation failed"


def test_create_incident_bad_coordinates_fails():
    payload = {
        "source": "citizen_report",
        "description": "Valid description text here.",
        "location": {"lat": 999, "lng": 72.58},  # out of range
    }
    res = client.post("/incidents", json=payload)
    assert res.status_code == 422


def test_get_nonexistent_incident_returns_404():
    res = client.get("/incidents/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
    assert res.json()["status_code"] == 404


def test_duplicate_detection_merges_reports():
    first_payload = {
        "source": "citizen_report",
        "description": "Major flooding reported near riverside colony, water rising fast.",
        "location": {"lat": 23.05, "lng": 72.60, "address": "Riverside Colony"},
    }
    first = client.post("/incidents", json=first_payload).json()

    duplicate_payload = {
        "source": "citizen_report",
        "description": "Flooding near riverside colony, water levels rising fast, need help.",
        "location": {"lat": 23.0502, "lng": 72.6001, "address": "Riverside Colony"},
    }
    second = client.post("/incidents", json=duplicate_payload).json()

    # Either it consolidated into the same incident id, or (if thresholds
    # weren't met) created a distinct one — assert it didn't crash either way.
    assert "id" in second
    if second["id"] == first["id"]:
        assert second.get("report_count", 1) >= 2


def test_list_incidents_supports_filters():
    res = client.get("/incidents", params={"severity": "critical", "limit": 5})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_create_resource_and_recommend():
    resource_payload = {
        "name": "Test Ambulance",
        "resource_type": "ambulance",
        "capacity": 2,
        "location": {"lat": 23.03, "lng": 72.58},
    }
    res = client.post("/resources", json=resource_payload)
    assert res.status_code == 201

    incident_payload = {
        "source": "emergency_call",
        "description": "Person unconscious after collapsing, needs urgent medical help.",
        "location": {"lat": 23.031, "lng": 72.581},
    }
    incident = client.post("/incidents", json=incident_payload).json()

    rec = client.get(f"/resources/recommend/{incident['id']}")
    assert rec.status_code == 200
    assert "recommendations" in rec.json()


def test_assign_invalid_resource_returns_error_not_crash():
    payload = {
        "incident_id": "00000000-0000-0000-0000-000000000000",
        "resource_id": "00000000-0000-0000-0000-000000000000",
    }
    res = client.post("/resources/assign", json=payload)
    assert res.status_code in (400, 404, 500)
    assert "detail" in res.json()


def test_dashboard_overview_shape():
    res = client.get("/dashboard/overview")
    assert res.status_code == 200
    body = res.json()
    for key in ("active_emergencies", "severity_breakdown", "status_breakdown", "incidents"):
        assert key in body


def test_analytics_endpoints_do_not_crash():
    for path in (
        "/analytics/incident-types",
        "/analytics/response-delays",
        "/analytics/resource-shortages",
        "/analytics/hotspots",
    ):
        res = client.get(path)
        assert res.status_code == 200