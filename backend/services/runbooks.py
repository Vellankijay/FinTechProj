"""
Operational runbooks for common risk scenarios.
"""
from typing import Dict, List


def get_runbook(scenario: str) -> Dict[str, any]:
    """
    Get operational runbook for a given scenario.

    Args:
        scenario: Scenario identifier (e.g., 'order-flow anomaly', 'var breach')

    Returns:
        Runbook with steps and metadata
    """
    runbooks = {
        "order-flow anomaly": _order_flow_anomaly_runbook(),
        "var breach": _var_breach_runbook(),
        "concentration risk": _concentration_risk_runbook(),
        "market dislocation": _market_dislocation_runbook(),
        "data latency": _data_latency_runbook(),
        "data latency alert": _data_latency_runbook(),
    }

    scenario_lower = scenario.lower().strip()

    if scenario_lower not in runbooks:
        return {
            "scenario": scenario,
            "title": "Unknown Scenario",
            "steps": ["No runbook available for this scenario. Please consult risk management team."],
            "severity": "UNKNOWN",
        }

    return runbooks[scenario_lower]


def list_runbooks() -> List[str]:
    """
    List all available runbook scenarios.

    Returns:
        List of scenario names
    """
    return [
        "order-flow anomaly",
        "var breach",
        "concentration risk",
        "market dislocation",
        "data latency",
    ]


def _order_flow_anomaly_runbook() -> Dict[str, any]:
    """Runbook for order-flow anomalies."""
    return {
        "scenario": "order-flow anomaly",
        "title": "Order-Flow Anomaly Response",
        "severity": "HIGH",
        "description": (
            "Unexpected trading patterns detected that deviate from normal behavior. "
            "Could indicate system issues, fat-finger errors, or market manipulation."
        ),
        "steps": [
            "1. TRIAGE: Identify affected venue/system - check if anomaly is isolated to specific exchange or spans multiple venues",
            "2. THROTTLE: If order rate exceeds normal by >3x, engage order throttling controls immediately",
            "3. ALERT DESK: Notify affected desk head and risk manager via escalation protocol",
            "4. VERIFY OMS: Check Order Management System logs for unexpected automation or config changes in last 24h",
            "5. ASSESS IMPACT: Calculate P&L impact and position delta vs. intended strategy",
            "6. ISOLATE: If issue persists >2 min, halt automated trading for affected strategies",
            "7. ROLLBACK CRITERIA: If P&L impact >$500K or position deviation >20%, initiate position unwind protocol",
            "8. DOCUMENT: Capture all order IDs, timestamps, and system logs for post-mortem analysis",
        ],
        "escalation": ["Desk Head", "Risk Manager", "CTO (if system-wide)"],
        "tools": ["OMS logs", "Venue APIs", "Real-time P&L dashboard"],
        "sla": "Initial triage within 2 minutes, containment within 10 minutes",
    }


def _var_breach_runbook() -> Dict[str, any]:
    """Runbook for VaR breach events."""
    return {
        "scenario": "var breach",
        "title": "VaR Breach Response Protocol",
        "severity": "CRITICAL",
        "description": (
            "Value-at-Risk has exceeded regulatory or firm limits. "
            "Requires immediate validation, exposure reduction, and senior management notification."
        ),
        "steps": [
            "1. VALIDATE DATA: Confirm breach is real (not data error) - cross-check with independent pricing sources",
            "2. CONFIRM EXPOSURE: Run position reconciliation to verify gross/net exposure calculations are accurate",
            "3. ROOT CAUSE: Identify primary drivers - market moves, concentration, correlation breakdown, or volatility spike",
            "4. REDUCE RISK: Begin systematic de-risking starting with highest-contribution positions (top 20% contributing 80% of VaR)",
            "5. HEDGES: Evaluate cost-effective hedging alternatives (options, futures, CDS) before unwinding profitable positions",
            "6. COMMS TEMPLATE: Notify CFO and Chief Risk Officer within 15 minutes using standard breach notification",
            "7. REGULATORY: If breach exceeds regulatory threshold, prepare regulator notification per compliance protocol",
            "8. POST-MORTEM STUB: Schedule debrief within 24h to review model assumptions, limit calibration, and early warning signals",
        ],
        "escalation": ["Chief Risk Officer", "CFO", "Compliance (if regulatory threshold)"],
        "tools": ["VaR decomposition report", "Stress testing suite", "Position concentration analyzer"],
        "sla": "Validation within 5 minutes, notification within 15 minutes, de-risking plan within 1 hour",
        "thresholds": {
            "yellow": "95% of limit",
            "orange": "100% of limit",
            "red": ">110% of limit or regulatory threshold",
        }
    }


def _concentration_risk_runbook() -> Dict[str, any]:
    """Runbook for concentration risk scenarios."""
    return {
        "scenario": "concentration risk",
        "title": "Concentration Risk Management",
        "severity": "MEDIUM",
        "description": (
            "Single position or correlated group exceeds concentration limits. "
            "May amplify losses during adverse market conditions."
        ),
        "steps": [
            "1. IDENTIFY: Determine which positions exceed concentration thresholds (typically >25% of book)",
            "2. CORRELATION CHECK: Assess if multiple positions have hidden correlation (same sector, geography, or risk factor)",
            "3. LIQUIDITY ANALYSIS: Evaluate market depth and typical bid-ask spreads for concentrated positions",
            "4. UNWIND PLAN: Create staged reduction plan to avoid market impact - target 3-5% reduction per day",
            "5. ALTERNATIVES: Consider options overlays or swaps to reduce economic exposure without selling physical positions",
            "6. LIMIT REVIEW: Discuss with CRO whether concentration limits need adjustment based on market conditions",
            "7. MONITORING: Increase surveillance frequency to real-time updates until concentration falls below threshold",
        ],
        "escalation": ["Portfolio Manager", "Risk Manager"],
        "tools": ["Concentration dashboard", "Correlation matrix", "Liquidity analyzer"],
        "sla": "Assessment within 30 minutes, reduction plan within 4 hours",
    }


def _market_dislocation_runbook() -> Dict[str, any]:
    """Runbook for market dislocation events."""
    return {
        "scenario": "market dislocation",
        "title": "Market Dislocation Response",
        "severity": "CRITICAL",
        "description": (
            "Abnormal market conditions with extreme volatility, liquidity shortage, "
            "or price discontinuities across multiple assets."
        ),
        "steps": [
            "1. CONFIRM DISLOCATION: Verify market-wide event (not isolated issue) - check VIX, credit spreads, FX volatility",
            "2. FREEZE NEW RISK: Halt new position initiation until market conditions stabilize",
            "3. LIQUIDITY RESERVE: Ensure access to emergency liquidity lines and collateral availability",
            "4. MARGIN CALLS: Pre-emptively calculate potential margin requirements under stressed scenarios",
            "5. CLIENT COMMS: Prepare client communication regarding market conditions and any restrictions",
            "6. TRADING PLAN: Decide on approach - hold positions, reduce risk, or opportunistically add with approval",
            "7. SCENARIO ANALYSIS: Run extreme stress tests (3-5 sigma events) to understand tail risk exposure",
            "8. ESCALATION: Activate crisis management team if dislocation persists >2 hours or spreads to new markets",
        ],
        "escalation": ["CEO", "CRO", "CFO", "Crisis Management Team"],
        "tools": ["Market volatility dashboard", "Liquidity stress tests", "Margin calculator"],
        "sla": "Crisis team activation within 30 minutes if criteria met",
    }


def _data_latency_runbook() -> Dict[str, any]:
    """Runbook for data latency alert investigation."""
    return {
        "scenario": "data latency",
        "title": "Data Latency Alert Investigation",
        "severity": "HIGH",
        "description": (
            "Market data feed or internal data pipeline experiencing delays that could "
            "impact trading decisions, risk calculations, or compliance reporting."
        ),
        "steps": [
            "1. CHECK INGESTION PIPELINE: Verify data ingestion pipeline timestamps (Kafka/Kinesis topics, message queues)",
            "2. VERIFY HEARTBEAT: Check latest feed heartbeat in monitoring dashboard - confirm last successful update time",
            "3. COMPARE LAG: Compare upstream vs. downstream lag to identify bottleneck location (source, network, processing, or storage)",
            "4. ASSESS IMPACT: Determine which systems/strategies are affected - risk calculations, trading algos, compliance reports",
            "5. RESTART IF NEEDED: If lag exceeds 60 seconds, initiate data source restart or resync procedure",
            "6. FALLBACK DATA: Switch to backup data feed or alternative source if primary feed remains degraded >5 minutes",
            "7. HALT DEPENDENT TRADING: Suspend automated trading strategies that depend on affected data feed",
            "8. NOTIFY OPS: Alert operations channel with affected systems, estimated resolution time, and workaround status",
            "9. DOCUMENT: Log incident details, root cause, resolution steps, and data gaps for audit trail",
        ],
        "escalation": ["Data Operations Team", "Platform Engineering", "Risk Manager (if risk calculations affected)"],
        "tools": [
            "Data pipeline monitoring dashboard",
            "Feed heartbeat monitor",
            "Kafka/Kinesis lag metrics",
            "Network latency analyzer"
        ],
        "sla": "Initial triage within 2 minutes, resolution or fallback within 10 minutes",
        "thresholds": {
            "warning": "Lag > 15 seconds",
            "critical": "Lag > 60 seconds or data gap > 5 minutes",
            "emergency": "Complete feed outage or lag > 5 minutes with no fallback"
        }
    }
