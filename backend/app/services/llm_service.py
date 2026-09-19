"""
app/services/llm_service.py
Wraps all Groq LLM calls: classification, severity/priority estimation,
AI summaries, and response recommendations. Every call has a rule-based
fallback so the platform keeps working even if Groq is down or rate-limited.
"""
import json
import logging
import re
from typing import Any, Dict, Optional

from groq import Groq, APIError as GroqAPIError, APIConnectionError, RateLimitError

from app.config import get_settings

logger = logging.getLogger("app.llm_service")
settings = get_settings()

_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def _extract_json(text: str) -> Optional[dict]:
    """LLMs sometimes wrap JSON in markdown fences or add extra text.
    This pulls out the first valid JSON object it can find."""
    if not text:
        return None
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        logger.warning("Failed to parse JSON from LLM output: %s", text[:300])
        return None


def _call_groq(prompt: str, system: str, temperature: float = 0.2, max_tokens: int = 600) -> Optional[str]:
    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content
    except RateLimitError:
        logger.warning("Groq rate limit hit; falling back to rule-based logic")
        return None
    except (GroqAPIError, APIConnectionError) as exc:
        logger.warning("Groq API error: %s; falling back to rule-based logic", exc)
        return None
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected error calling Groq")
        return None


# ---------- Rule-based fallback classifier ----------
_KEYWORDS = {
    "flood": ["flood", "waterlogg", "overflow", "drowning", "submerged"],
    "fire": ["fire", "burning", "smoke", "explosion", "blaze"],
    "industrial_accident": ["gas leak", "chemical", "industrial", "factory", "plant accident"],
    "road_accident": ["accident", "collision", "crash", "vehicle", "hit and run"],
    "medical_emergency": ["heart attack", "unconscious", "injured", "bleeding", "medical"],
    "structural_collapse": ["collapse", "building fell", "bridge collapse", "structure"],
}

_SEVERITY_KEYWORDS = {
    "critical": ["multiple deaths", "trapped", "mass casualty", "explosion", "life-threatening", "collapse"],
    "high": ["severe", "major", "injured", "spreading", "urgent"],
    "medium": ["moderate", "minor injuries", "contained"],
    "low": ["minor", "no injuries", "small"],
}


def _rule_based_classification(description: str) -> Dict[str, Any]:
    text = description.lower()
    incident_type = "other"
    for itype, keywords in _KEYWORDS.items():
        if any(k in text for k in keywords):
            incident_type = itype
            break

    severity = "medium"
    for level, keywords in _SEVERITY_KEYWORDS.items():
        if any(k in text for k in keywords):
            severity = level
            break

    priority_map = {"critical": "P1", "high": "P2", "medium": "P3", "low": "P4"}
    return {
        "incident_type": incident_type,
        "severity": severity,
        "priority": priority_map[severity],
        "confidence": 0.4,
        "reasoning": "Rule-based fallback classification (LLM unavailable).",
    }


def classify_incident(description: str, source: str, address: Optional[str] = None) -> Dict[str, Any]:
    """Returns dict: incident_type, severity, priority, confidence, reasoning."""
    system = (
        "You are an emergency dispatch triage AI. Classify the incident and respond with "
        "STRICT JSON ONLY, no prose, no markdown fences, matching exactly this schema: "
        '{"incident_type": one of ["flood","fire","industrial_accident","road_accident",'
        '"medical_emergency","structural_collapse","other"], '
        '"severity": one of ["low","medium","high","critical"], '
        '"priority": one of ["P1","P2","P3","P4"] (P1=critical/immediate, P4=low), '
        '"confidence": float between 0 and 1, '
        '"reasoning": short one-sentence justification}'
    )
    prompt = f"Source: {source}\nLocation: {address or 'unknown'}\nIncident report: {description}"

    raw = _call_groq(prompt, system, temperature=0.1, max_tokens=300)
    parsed = _extract_json(raw) if raw else None

    if not parsed or "incident_type" not in parsed or "severity" not in parsed:
        logger.info("Falling back to rule-based classification")
        return _rule_based_classification(description)

    parsed.setdefault("priority", {"critical": "P1", "high": "P2", "medium": "P3", "low": "P4"}.get(
        parsed.get("severity", "medium"), "P3"))
    parsed.setdefault("confidence", 0.6)
    parsed.setdefault("reasoning", "AI classification.")
    return parsed


def generate_incident_summary(incident: Dict[str, Any], related_reports_count: int = 1) -> str:
    address = incident.get("address")
    coords = f"{incident.get('location_lat')}, {incident.get('location_lng')}"
    location_str = address or coords

    system = (
        "You are an emergency operations assistant. Write a concise, factual 3-4 sentence "
        "summary for a response team, covering what happened, where, severity, and current status. "
        "No markdown, plain text only."
    )
    prompt = (
        f"Incident type: {incident.get('incident_type')}\n"
        f"Severity: {incident.get('severity')}\n"
        f"Status: {incident.get('status')}\n"
        f"Location: {location_str}\n"
        f"Number of merged reports: {related_reports_count}\n"
        f"Description: {incident.get('description')}"
    )
    result = _call_groq(prompt, system, temperature=0.3, max_tokens=250)
    if result:
        return result.strip()
    return (
        f"{incident.get('incident_type', 'Incident')} reported at {location_str} with "
        f"{incident.get('severity', 'unknown')} severity. Currently {incident.get('status', 'reported')}. "
        f"{related_reports_count} report(s) consolidated. (AI summary unavailable, auto-generated fallback.)"
    )


def generate_recommendations(incident: Dict[str, Any]) -> str:
    system = (
        "You are an emergency response advisor. Give 3-5 short, actionable bullet-point "
        "recommendations for the response team handling this incident. Plain text, use '- ' "
        "prefix per line, no markdown headers."
    )
    prompt = (
        f"Incident type: {incident.get('incident_type')}\n"
        f"Severity: {incident.get('severity')}\n"
        f"Description: {incident.get('description')}"
    )
    result = _call_groq(prompt, system, temperature=0.4, max_tokens=300)
    if result:
        return result.strip()
    return (
        "- Dispatch nearest available unit matching the incident type.\n"
        "- Verify scene safety before deploying personnel.\n"
        "- Establish communication with on-site reporter if available.\n"
        "- Escalate to higher authority if severity is high or critical.\n"
        "(Fallback recommendations, AI service unavailable.)"
    )


def semantic_similarity_check(text_a: str, text_b: str) -> Optional[float]:
    """Optional LLM-assisted semantic duplicate check, used as a secondary
    signal on top of the primary rule-based duplicate_service. Returns a
    0-1 similarity score, or None if the LLM call fails (caller should
    fall back to text/geo similarity only)."""
    system = (
        "Compare the two incident reports below. Respond with STRICT JSON ONLY: "
        '{"similarity": float between 0 and 1, "same_event": true/false}'
    )
    prompt = f"Report A: {text_a}\nReport B: {text_b}"
    raw = _call_groq(prompt, system, temperature=0.0, max_tokens=100)
    parsed = _extract_json(raw) if raw else None
    if parsed and "similarity" in parsed:
        try:
            return float(parsed["similarity"])
        except (TypeError, ValueError):
            return None
    return None