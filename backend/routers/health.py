import yfinance as yf
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/health")

# ------------------------------
# SYMBOLS & INDUSTRY MAP
# ------------------------------
HEALTHCARE_SYMBOLS = {
    "UNH": 1, "JNJ": 1, "LLY": 1, "PFE": 1, "MRK": 1,
    "ABBV": 1, "AMGN": 1, "TMO": 1, "GILD": 1, "BMY": 1
}

HEALTHCARE_INDUSTRY_MAP = {
    "UNH": "Healthcare Insurance",
    "JNJ": "Pharmaceuticals",
    "LLY": "Pharmaceuticals",
    "PFE": "Pharmaceuticals",
    "MRK": "Pharmaceuticals",
    "ABBV": "Biotech",
    "AMGN": "Biotech",
    "TMO": "Medical Technology",
    "GILD": "Biotech",
    "BMY": "Pharmaceuticals"
}

INDUSTRY_COLORS = {
    "Pharmaceuticals": "#3b82f6",
    "Biotech": "#a855f7",
    "Medical Technology": "#22c55e",
    "Healthcare Insurance": "#ef4444",
}


# ------------------------------
# GLOBAL CACHE & STORE
# ------------------------------
historical_cache = {}
today_cache = {}
TODAY_CACHE_EXPIRY_HOURS = 3
cs = []

companies_store = {}
for s in HEALTHCARE_SYMBOLS.keys():
    companies_store[s] = {
        "ticker": s,
        "name": s,
        "shares": HEALTHCARE_SYMBOLS[s],
        "active": True
    }

# ------------------------------
# HELPERS
# ------------------------------
def safe_float(val, fallback=0.0):
    try:
        if val is None or np.isnan(val):
            return fallback
        return float(val)
    except Exception:
        return fallback

def get_today_price(symbol: str) -> float:
    now = datetime.now()
    if symbol in today_cache:
        last_update = today_cache[symbol]["last_update"]
        if (now - last_update).total_seconds() / 3600 < TODAY_CACHE_EXPIRY_HOURS:
            return today_cache[symbol]["data"]
    try:
        t = yf.Ticker(symbol)
        last = safe_float(t.fast_info.last_price, fallback=None)
        if last is None:
            hist = t.history(period="2d")
            if not hist.empty:
                last = safe_float(hist["Close"].iloc[-1])
    except Exception:
        last = None
    if last is None:
        raise ValueError(f"Failed to fetch today's price for {symbol}")
    today_cache[symbol] = {"data": last, "last_update": now}
    return last

def get_historical(symbol: str) -> pd.DataFrame:
    if symbol not in historical_cache:
        df = yf.Ticker(symbol).history(period="3mo")
        df.index = pd.to_datetime(df.index, errors="coerce")
        df.index = df.index.tz_localize(None)
        historical_cache[symbol] = df
    return historical_cache[symbol]
def calculate_tech_risk(total_mv, avg_perf, avg_vol, num_companies, diversification, perf_split):
    """
    Returns: full risk object with score, rating, and factor breakdown
    avg_vol should be decimal (e.g. 0.15 for 15%)
    """
    diversification_score = min(100, diversification * 15)   # more industries = safer
    volatility_score = max(0, 100 - (avg_vol * 100))         # avg_vol decimal -> percent contribution
    performance_score = (perf_split["positive"] / max(1, num_companies)) * 100
    exposure_score = min(100, (perf_split["positive"] / max(1, perf_split["negative"])) * 40)

    final_score = (
        diversification_score * 0.25 +
        volatility_score * 0.30 +
        performance_score * 0.25 +
        exposure_score * 0.20
    )

    if final_score >= 80:
        rating, color = "Low Risk", "#22c55e"
    elif final_score >= 60:
        rating, color = "Moderate Risk", "#eab308"
    elif final_score >= 40:
        rating, color = "Elevated Risk", "#f97316"
    else:
        rating, color = "High Risk", "#ef4444"

    return {
        "score": int(final_score),
        "rating": rating,
        "color": color,
        "recommendation": "Portfolio shows stable trends with manageable volatility." if final_score >= 60
                          else "High volatility detected. Consider reallocating high-risk positions.",
        "factors": {
            "diversification": {
                "score": int(diversification_score),
                "weight": 25,
                "explanation": f"Portfolio spans {diversification} industries."
            },
            "volatility": {
                "score": int(volatility_score),
                "weight": 30,
                "explanation": "Lower price volatility leads to safer long-term profile."
            },
            "performance": {
                "score": int(performance_score),
                "weight": 25,
                "explanation": f"{perf_split['positive']} companies are appreciating while {perf_split['negative']} are declining."
            },
            "exposure": {
                "score": int(exposure_score),
                "weight": 20,
                "explanation": "Balance of winners vs losers based on last 3 months."
            }
        }
    }

def compute_company_risk(price_series: pd.Series) -> dict:
    returns = price_series.pct_change().dropna()
    if returns.empty:
        return {"volatility": 0, "performance": 0, "score": 0, "rating": "Insufficient Data", "perf3m": 0.0}
    vol_3m = safe_float(returns.std() * np.sqrt(63))
    perf = safe_float((price_series.iloc[-1] - price_series.iloc[0]) / price_series.iloc[0])
    vol_pct = vol_3m * 100
    perf_pct = perf * 100
    if vol_3m == 0:
        rating, score = "No Risk", 100
    elif vol_3m < 0.18 and perf > 0:
        rating, score = "Low Risk", 80
    elif vol_3m < 0.25:
        rating, score = "Moderate Risk", 60
    elif vol_3m < 0.35:
        rating, score = "Elevated Risk", 40
    else:
        rating, score = "High Risk", 20
    return {"volatility": vol_pct, "performance": perf_pct, "score": score, "rating": rating, "perf3m": perf}

# ------------------------------
# Pydantic Models
# ------------------------------
class UpdateSharesItem(BaseModel):
    ticker: str
    shares: int

class AddCompanyItem(BaseModel):
    ticker: str
    sector: str
    shares: int = 1
    name: str = None

# ------------------------------
# ENDPOINTS
# ------------------------------
@router.get("/companies")
def list_companies():
    global cs
    if cs:
        return cs
    return health_portfolio()

@router.post("/add")
def add_company(payload: AddCompanyItem):
    t = payload.ticker.upper()
    if t in companies_store and companies_store[t]["active"]:
        raise HTTPException(status_code=400, detail="Ticker already exists.")
    companies_store[t] = {
        "ticker": t,
        "name": payload.name or t,
        "sector": payload.sector,
        "shares": payload.shares,
        "active": True
    }
    historical_cache.pop(t, None)
    today_cache.pop(t, None)
    HEALTHCARE_SYMBOLS[t] = payload.shares
    global cs
    cs = []
    return {"status": "ok", "company": companies_store[t]}

@router.patch("/update-shares")
def update_shares(changes: list[UpdateSharesItem]):
    global cs
    updated = []
    for item in changes:
        t = item.ticker.upper()
        if t not in companies_store:
            continue
        companies_store[t]["shares"] = item.shares
        HEALTHCARE_SYMBOLS[t] = item.shares
        updated.append({"ticker": t, "shares": item.shares})
    cs = []
    return {"status": "ok", "updated": updated}

@router.delete("/remove/{ticker}")
def remove_company(ticker: str):
    t = ticker.upper()
    if t not in companies_store:
        raise HTTPException(status_code=404, detail="Ticker not found")
    companies_store[t]["active"] = False
    today_cache.pop(t, None)
    historical_cache.pop(t, None)
    HEALTHCARE_SYMBOLS.pop(t, None)
    global cs
    cs = []
    return {"status": "ok", "ticker": t}

# ------------------------------
# MAIN ENDPOINT (portfolio)
# ------------------------------
@router.get("/portfolio")
def health_portfolio():
    global cs
    companies = []
    industries = {}
    total_market_value = 0.0
    per_stock_vol_pct = {}
    returns_map = {}
    positive = negative = 0
    overall_change = 0.0

    for ticker, shares in HEALTHCARE_SYMBOLS.items():
        hist = get_historical(ticker)
        if hist.empty or len(hist) < 2:
            continue

        today_close = safe_float(hist["Close"].iloc[-1])
        yesterday_close = safe_float(hist["Close"].iloc[-2])
        daily_change = 0.0 if yesterday_close == 0 else (today_close - yesterday_close) / yesterday_close * 100
        overall_change += daily_change

        pos_mv = shares * today_close
        total_market_value += pos_mv

        try:
            info = yf.Ticker(ticker).info
            industry = info.get("industry") or HEALTHCARE_INDUSTRY_MAP.get(ticker, "Other")
        except Exception:
            industry = HEALTHCARE_INDUSTRY_MAP.get(ticker, "Other")
        industries[industry] = industries.get(industry, 0.0) + pos_mv

        company_risk = compute_company_risk(hist["Close"])
        if company_risk["perf3m"] >= 0:
            positive += 1
        else:
            negative += 1

        returns = hist["Close"].pct_change().dropna()
        if not returns.empty:
            returns_map[ticker] = returns.rename(ticker)
        per_stock_vol_pct[ticker] = safe_float(company_risk["volatility"]/100)

        companies.append({
            "ticker": ticker,
            "name": companies_store[ticker].get("name", ticker),
            "industry": industry,
            "marketValue": pos_mv,
            "priceToday": today_close,
            "priceYesterday": yesterday_close,
            "dailyChangePercent": daily_change,
            "priceChangePercent": company_risk["perf3m"],
            "shares": shares,
            "companyVolatility": company_risk["volatility"],
            "companyPerformance": company_risk["performance"],
            "companyRiskScore": company_risk["score"],
            "companyRiskRating": company_risk["rating"],
        })

    num_companies = len(companies)
    avg_individual_vol_decimal = sum(per_stock_vol_pct.values()) / num_companies if num_companies else 0.0
    rets_df = pd.concat(returns_map.values(), axis=1).dropna(how="all") if returns_map else pd.DataFrame()

    # Portfolio volatility
    portfolio_vol_3m = 0.0
    if not rets_df.empty and total_market_value > 0:
        cov_daily = rets_df.cov().fillna(0).values
        weights = np.array([companies_store[t]["shares"]*get_today_price(t)/total_market_value for t in rets_df.columns], dtype=float)
        port_var_daily = float(weights @ cov_daily @ weights.T)
        portfolio_vol_3m = np.sqrt(max(0.0, port_var_daily)) * np.sqrt(63)
    if portfolio_vol_3m == 0.0:
        portfolio_vol_3m = avg_individual_vol_decimal

    avg_perf_decimal = np.mean([c["priceChangePercent"] for c in companies]) if num_companies else 0.0
    avg_change = round(overall_change / max(1, num_companies), 3)

    # Compute risk
    from copy import deepcopy
    risk = calculate_tech_risk(
        total_mv=total_market_value,
        avg_perf=avg_perf_decimal,
        avg_vol=portfolio_vol_3m,
        num_companies=num_companies,
        diversification=len(industries),
        perf_split={"positive": positive, "negative": negative}
    )

    # Portfolio KPIs
    kpis = [
        {
            "id": "total-value",
            "label": "Total Healthcare Investment",
            "value": total_market_value,
            "unit": "$",
            "change": avg_change,
            "trend": "up" if overall_change > 0 else ("neutral" if overall_change == 0 else "down"),
            "status": "normal",
        },
        {
            "id": "positions",
            "label": "Number of Companies",
            "value": num_companies,
            "change": 0,
            "trend": "neutral",
            "status": "normal",
        },
        {
            "id": "avg-performance",
            "label": "Average 3-Month Performance",
            "value": avg_perf_decimal,
            "unit": "%",
            "change": "Positive Growth" if avg_perf_decimal > 0.025 else "Neutral",
            "trend": "up" if avg_perf_decimal > 0 else "down",
            "status": "normal" if avg_perf_decimal > 0 else "warning",
        },
        {
            "id": "volatility",
            "label": "Average Volatility",
            "value": portfolio_vol_3m,
            "unit": "%",
            "change": "Low" if portfolio_vol_3m < 0.18 else ("High" if portfolio_vol_3m > 0.28 else "Neutral"),
            "trend": "up" if portfolio_vol_3m < 0.18 else ("down" if portfolio_vol_3m > 0.28 else "neutral"),
            "status": "normal",
        },
    ]

    # Donut chart data
    donut = [
        {
            "name": ind,
            "value": val,
            "percentage": (val / total_market_value) * 100 if total_market_value > 0 else 0,
            "color": INDUSTRY_COLORS.get(ind, "#22c55e"),
        }
        for ind, val in industries.items()
    ]

    # Top companies by market value
    top = sorted(companies, key=lambda x: x["marketValue"], reverse=True)[:10]
    top_companies = [
        {
            "bucket": c["ticker"],
            "count": c["marketValue"],
            "percentage": (c["marketValue"] / total_market_value) * 100 if total_market_value > 0 else 0,
            "color": "#22c55e",
        }
        for c in top
    ]

    # Performance buckets
    perf_ranges = [
        ("Strong Growth (>5%)", 0.05, 9999, "#22c55e"),
        ("Growth (0-5%)", 0.0, 0.05, "#3b82f6"),
        ("Decline (0 to -5%)", -0.05, 0.0, "#eab308"),
        ("Strong Decline (<-5%)", -9999, -0.05, "#ef4444"),
    ]
    performance_data = []
    for label, minv, maxv, color in perf_ranges:
        count = len([c for c in companies if minv < c["priceChangePercent"] <= maxv])
        performance_data.append({
            "bucket": label,
            "count": count,
            "percentage": (count / max(num_companies, 1)) * 100,
            "color": color,
        })

    cs = deepcopy(companies)
    return {
        "kpis": kpis,
        "companies": companies,
        "donutData": donut,
        "topCompanies": top_companies,
        "performanceData": performance_data,
        "totalMarketValue": total_market_value,
        "riskScore": risk,
    }


