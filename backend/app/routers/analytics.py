from fastapi import APIRouter, Depends, Query
from typing import Optional

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics_data(time_range: Optional[str] = Query("7d")):
    # Compute or aggregate your metrics according to requirements
    return {
        "emergency_types": [
            {"name": "Fire / Explosion", "count": 42, "percentage": "35%"},
            {"name": "Medical Emergency", "count": 35, "percentage": "29%"},
            {"name": "Natural Disaster", "count": 20, "percentage": "17%"},
            {"name": "Industrial Accident", "count": 13, "percentage": "11%"},
            {"name": "Road Incident", "count": 10, "percentage": "8%"},
        ],
        "response_delays": [
            {"day": "Mon", "avgDelayMinutes": 8.5, "targetMinutes": 10},
            {"day": "Tue", "avgDelayMinutes": 12.2, "targetMinutes": 10},
            {"day": "Wed", "avgDelayMinutes": 9.1, "targetMinutes": 10},
            {"day": "Thu", "avgDelayMinutes": 14.8, "targetMinutes": 10},
            {"day": "Fri", "avgDelayMinutes": 11.0, "targetMinutes": 10},
            {"day": "Sat", "avgDelayMinutes": 7.4, "targetMinutes": 10},
            {"day": "Sun", "avgDelayMinutes": 6.8, "targetMinutes": 10},
        ],
        "resource_shortages": [
            {"category": "Ambulances", "available": 8, "required": 15, "shortage": 7},
            {"category": "Fire Trucks", "available": 12, "required": 14, "shortage": 2},
            {"category": "Hazmat Teams", "available": 3, "required": 6, "shortage": 3},
            {"category": "Rescue Boats", "available": 5, "required": 5, "shortage": 0},
            {"category": "Air Support", "available": 1, "required": 3, "shortage": 2},
        ],
        "affected_areas": [
            {"area": "Downtown Sector A", "incidents": 38, "riskLevel": "High"},
            {"area": "Industrial Park Zone 3", "incidents": 29, "riskLevel": "High"},
            {"area": "North River Basin", "incidents": 21, "riskLevel": "Medium"},
            {"area": "East Highway Junction", "incidents": 18, "riskLevel": "Medium"},
            {"area": "West Suburbs", "incidents": 9, "riskLevel": "Low"},
        ]
    }