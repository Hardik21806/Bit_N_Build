"""
seed_synthetic_data.py
Generates a realistic synthetic dataset (resources + incidents, including
deliberate near-duplicates) and pushes it through your running API so you
can test classification, duplicate consolidation, resource matching,
dashboard, and analytics end-to-end without a frontend.

Usage:
    pip install faker requests
    uvicorn app.main:app --reload      # in another terminal
    python seed_synthetic_data.py
"""
import random
import time

import requests
from faker import Faker

BASE_URL = "http://localhost:8000"
fake = Faker("en_IN")
Faker.seed(42)
random.seed(42)

# Roughly centered on Ahmedabad so distances/duplicate checks are meaningful
CENTER_LAT, CENTER_LNG = 23.0225, 72.5714


def jitter(base, spread=0.05):
    return round(base + random.uniform(-spread, spread), 6)


RESOURCE_TEMPLATES = [
    ("Rescue Team Alpha", "rescue_team", 10),
    ("Rescue Team Bravo", "rescue_team", 15),
    ("Fire Unit 1", "fire_truck", 6),
    ("Fire Unit 2", "fire_truck", 6),
    ("Ambulance 101", "ambulance", 2),
    ("Ambulance 102", "ambulance", 2),
    ("Medical Response Team", "medical_team", 5),
    ("Police Unit Central", "police_unit", 4),
    ("Rapid Response Helicopter", "helicopter", 1),
    ("Flood Equipment Depot", "equipment", 20),
]

INCIDENT_TEMPLATES = [
    ("citizen_report", "flood", [
        "Heavy flooding on the main road, water entering ground-floor homes.",
        "Street submerged after continuous rain, vehicles stranded.",
    ]),
    ("sensor", "fire", [
        "Smoke detector triggered high smoke density in warehouse sector 4.",
        "Thermal sensor reports abnormal heat spike near storage unit 12.",
    ]),
    ("emergency_call", "road_accident", [
        "Two-vehicle collision reported, one person injured and trapped.",
        "Truck overturned on highway, fuel leaking, traffic blocked.",
    ]),
    ("field_team", "industrial_accident", [
        "Gas leak detected at chemical plant, workers evacuating the area.",
    ]),
    ("hospital", "medical_emergency", [
        "Mass casualty incoming, hospital requesting additional ambulances.",
    ]),
]


def seed_resources():
    created = []
    for name, r_type, capacity in RESOURCE_TEMPLATES:
        payload = {
            "name": name,
            "resource_type": r_type,
            "capacity": capacity,
            "location": {
                "lat": jitter(CENTER_LAT),
                "lng": jitter(CENTER_LNG),
                "address": fake.address(),
            },
            "contact": fake.email(),
        }
        try:
            res = requests.post(f"{BASE_URL}/resources", json=payload, timeout=10)
            res.raise_for_status()
            created.append(res.json())
            print(f"[resource created] {name}")
        except requests.RequestException as exc:
            print(f"[FAILED] resource {name}: {exc}")
    return created


def seed_incidents():
    created = []
    for source, incident_type, descriptions in INCIDENT_TEMPLATES:
        base_lat, base_lng = jitter(CENTER_LAT, 0.08), jitter(CENTER_LNG, 0.08)
        for i, desc in enumerate(descriptions):
            payload = {
                "source": source,
                "description": desc,
                "location": {
                    "lat": jitter(base_lat, 0.01),
                    "lng": jitter(base_lng, 0.01),
                    "address": fake.address(),
                },
                "reporter_contact": fake.phone_number(),
            }
            try:
                res = requests.post(f"{BASE_URL}/incidents", json=payload, timeout=20)
                res.raise_for_status()
                incident = res.json()
                created.append(incident)
                print(f"[incident created] {incident_type} -> {incident.get('id')} "
                      f"severity={incident.get('severity')} priority={incident.get('priority')}")
            except requests.RequestException as exc:
                print(f"[FAILED] incident '{desc[:40]}...': {exc}")
            time.sleep(0.5)

        # Fire a deliberate near-duplicate right after, at almost the same
        # location and similar wording, to test consolidation.
        dup_payload = {
            "source": "citizen_report",
            "description": descriptions[0] + " Please send help urgently.",
            "location": {
                "lat": jitter(base_lat, 0.002),
                "lng": jitter(base_lng, 0.002),
                "address": fake.address(),
            },
        }
        try:
            res = requests.post(f"{BASE_URL}/incidents", json=dup_payload, timeout=20)
            res.raise_for_status()
            dup = res.json()
            print(f"[duplicate test] report_count={dup.get('report_count')} "
                  f"status={dup.get('status')} id={dup.get('id')}")
        except requests.RequestException as exc:
            print(f"[FAILED] duplicate test: {exc}")

    return created


def simulate_sensor_stream(n=5, delay_seconds=3):
    """Simulates a live sensor feed firing incidents at intervals, useful for
    watching /ws/dashboard update in real time while this script runs."""
    print(f"\nSimulating {n} live sensor incidents every {delay_seconds}s...")
    for i in range(n):
        payload = {
            "source": "sensor",
            "description": f"Auto-sensor alert #{i+1}: water level rising rapidly near riverbank sensor node.",
            "location": {"lat": jitter(CENTER_LAT), "lng": jitter(CENTER_LNG)},
        }
        try:
            res = requests.post(f"{BASE_URL}/incidents", json=payload, timeout=20)
            res.raise_for_status()
            print(f"  [sensor incident {i+1}] id={res.json().get('id')}")
        except requests.RequestException as exc:
            print(f"  [FAILED sensor incident {i+1}]: {exc}")
        time.sleep(delay_seconds)


if __name__ == "__main__":
    print("== Seeding resources ==")
    seed_resources()

    print("\n== Seeding incidents (with deliberate duplicates) ==")
    seed_incidents()

    print("\n== Fetching dashboard overview ==")
    try:
        overview = requests.get(f"{BASE_URL}/dashboard/overview", timeout=10).json()
        print(overview)
    except requests.RequestException as exc:
        print(f"[FAILED] dashboard overview: {exc}")

    simulate_sensor_stream()