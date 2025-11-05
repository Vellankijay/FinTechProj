"""
Risk API client for fetching metrics, alerts, and running stress tests.
"""
import requests
from typing import Dict, Any, List, Optional
from ..infra.secrets import get_config
from ..infra.audit import log as audit_log


def _get_base_url() -> str:
    """Get Risk API base URL from config."""
    config = get_config()
    return config["RISK_API_BASE"]


def _log_request(endpoint: str, method: str, params: Optional[Dict] = None):
    """Log API request (redact secrets)."""
    print(f"[RISK_API] {method} {endpoint} {params or ''}")


def _log_error(endpoint: str, error: Exception):
    """Log API error."""
    print(f"[RISK_API ERROR] {endpoint}: {error}")


def get_metric(book: str, metric: str, window: str = "30m") -> Dict[str, Any]:
    """
    Get a risk metric for a specific book.

    Args:
        book: Book/portfolio identifier
        metric: Metric name (VaR, Exposure, PnL, etc.)
        window: Time window (30m, 1h, 1d, etc.)

    Returns:
        Metric data including value, trend, and historical points

    Example response:
        {
            "book": "PM_BOOK1",
            "metric": "VaR",
            "value": 1250000,
            "unit": "USD",
            "window": "30m",
            "trend": "up",
            "change_pct": 5.2,
            "history": [{"timestamp": "...", "value": 1200000}, ...]
        }
    """
    base_url = _get_base_url()
    endpoint = f"{base_url}/metrics"
    params = {"book": book, "metric": metric, "window": window}

    _log_request(endpoint, "GET", params)

    try:
        # For demo purposes, return mock data
        # In production, this would make an actual HTTP request:
        # response = requests.get(endpoint, params=params, timeout=10)
        # return response.json()

        return {
            "book": book,
            "metric": metric,
            "value": 1250000 if metric == "VaR" else 50000000,
            "unit": "USD",
            "window": window,
            "trend": "up",
            "change_pct": 5.2,
            "timestamp": "2025-11-05T10:30:00Z",
            "history": [
                {"timestamp": "2025-11-05T10:00:00Z", "value": 1200000},
                {"timestamp": "2025-11-05T10:15:00Z", "value": 1225000},
                {"timestamp": "2025-11-05T10:30:00Z", "value": 1250000},
            ]
        }

    except Exception as e:
        _log_error(endpoint, e)
        raise Exception(f"Failed to fetch metric: {str(e)}")


def get_explain(alert_id: str) -> Dict[str, Any]:
    """
    Get detailed explanation for an alert.

    Args:
        alert_id: Alert identifier

    Returns:
        Alert details with root cause analysis

    Example response:
        {
            "alert_id": "VAR_BREACH_12345",
            "type": "VAR_BREACH",
            "book": "PM_BOOK1",
            "timestamp": "2025-11-05T10:32:00Z",
            "severity": "HIGH",
            "explanation": "VaR increased by 15% due to...",
            "contributing_factors": [
                {"factor": "Market volatility spike", "impact": 0.6},
                {"factor": "Position concentration", "impact": 0.4}
            ],
            "recommended_actions": [...]
        }
    """
    base_url = _get_base_url()
    endpoint = f"{base_url}/alerts/{alert_id}/explain"

    _log_request(endpoint, "GET")

    try:
        # Mock response for demo
        return {
            "alert_id": alert_id,
            "type": "VAR_BREACH",
            "book": "PM_BOOK1",
            "timestamp": "2025-11-05T10:32:00Z",
            "severity": "HIGH",
            "explanation": (
                "VaR breach triggered at 10:32 AM due to a 15% increase in portfolio volatility. "
                "Primary driver was a sudden 8% drop in AAPL combined with high concentration (35% of book). "
                "Correlation with market sentiment turned negative (-0.7) following disappointing earnings guidance."
            ),
            "contributing_factors": [
                {"factor": "AAPL price drop (-8%)", "impact": 0.5},
                {"factor": "Position concentration (35%)", "impact": 0.3},
                {"factor": "Negative sentiment shift", "impact": 0.2}
            ],
            "recommended_actions": [
                "Review position sizing for AAPL",
                "Consider hedging concentration risk",
                "Monitor broader tech sector sentiment"
            ]
        }

    except Exception as e:
        _log_error(endpoint, e)
        raise Exception(f"Failed to fetch alert explanation: {str(e)}")


def run_stress(
    book: str,
    scenario_id: Optional[str] = None,
    shock_pct: Optional[float] = None
) -> Dict[str, Any]:
    """
    Run a stress test on a book.

    Args:
        book: Book to stress test
        scenario_id: Predefined scenario (e.g., "market_crash", "rate_spike")
        shock_pct: Custom shock percentage (e.g., -0.1 for -10%)

    Returns:
        Stress test results

    Example response:
        {
            "book": "PM_BOOK1",
            "scenario": "market_crash",
            "baseline_value": 100000000,
            "stressed_value": 92000000,
            "impact": -8000000,
            "impact_pct": -8.0,
            "new_var": 1500000,
            "breach": true,
            "details": {...}
        }
    """
    base_url = _get_base_url()
    endpoint = f"{base_url}/stress/run"

    payload = {"book": book}
    if scenario_id:
        payload["scenario_id"] = scenario_id
    if shock_pct is not None:
        payload["shock_pct"] = shock_pct

    _log_request(endpoint, "POST", payload)

    try:
        # Mock response for demo
        shock = shock_pct if shock_pct is not None else -0.1
        baseline = 100000000
        stressed = baseline * (1 + shock)
        impact = stressed - baseline

        return {
            "book": book,
            "scenario": scenario_id or f"custom_shock_{shock_pct}",
            "baseline_value": baseline,
            "stressed_value": stressed,
            "impact": impact,
            "impact_pct": shock * 100,
            "new_var": abs(impact) * 1.2,  # VaR increases
            "breach": abs(impact) > 5000000,
            "timestamp": "2025-11-05T10:35:00Z",
            "details": {
                "positions_at_risk": 15,
                "largest_losers": ["AAPL", "MSFT", "GOOGL"]
            }
        }

    except Exception as e:
        _log_error(endpoint, e)
        raise Exception(f"Failed to run stress test: {str(e)}")


def url_for_chart(
    books: List[str],
    metric: str = "VaR",
    window: str = "30m"
) -> str:
    """
    Generate URL for a chart visualization.

    Args:
        books: List of books to chart
        metric: Metric to visualize
        window: Time window

    Returns:
        URL to chart endpoint or dashboard
    """
    base_url = _get_base_url()
    books_param = ",".join(books)
    return f"{base_url}/charts?books={books_param}&metric={metric}&window={window}"


def list_alerts(books: List[str], window: str = "30m") -> List[Dict[str, Any]]:
    """
    List recent alerts for given books.

    Args:
        books: List of books to check
        window: Time window

    Returns:
        List of alert objects
    """
    base_url = _get_base_url()
    endpoint = f"{base_url}/alerts"
    params = {"books": ",".join(books), "window": window}

    _log_request(endpoint, "GET", params)

    try:
        # Mock response for demo
        return [
            {
                "alert_id": "VAR_BREACH_12345",
                "type": "VAR_BREACH",
                "book": books[0] if books else "PM_BOOK1",
                "timestamp": "2025-11-05T10:32:00Z",
                "severity": "HIGH",
                "message": "VaR exceeded limit by 15%"
            },
            {
                "alert_id": "CONCENTRATION_12346",
                "type": "CONCENTRATION_WARNING",
                "book": books[0] if books else "PM_BOOK1",
                "timestamp": "2025-11-05T09:45:00Z",
                "severity": "MEDIUM",
                "message": "Single position exceeds 30% of book"
            }
        ]

    except Exception as e:
        _log_error(endpoint, e)
        return []
