"""
Tech Portfolio Risk Router
Provides endpoints for tech stock portfolio risk analysis
"""
from fastapi import APIRouter, HTTPException
import yfinance as yf
import numpy as np
import traceback
import time
from datetime import datetime, timedelta
import pandas as pd
from pydantic import BaseModel

router = APIRouter(prefix="/api/tech")
historical_cache = {}
today_cache = {}
TODAY_CACHE_EXPIRY_HOURS = 3
cs = []


TECH_SYMBOLS = {"AAPL":1, "MSFT":1, "GOOGL":1, "AMZN":1, "NVDA":1, "META":1, "TSLA":1, "ORCL":1, "CRM":1, "SAP":1,
                "AMD":1, "QCOM":1, "AVGO":1, "TSM":1}

TECH_COLORS = {
    "Consumer Tech": "#3b82f6",
    "Cloud & Enterprise": "#a855f7",
    "Semiconductors": "#22c55e"
}

# ----------------------
# In-memory "companies" store (replace with DB later)
# ----------------------
# Prepopulate companies from TECH_SYMBOLS with default shares=1
companies_store = {}
for s in TECH_SYMBOLS.keys():
    companies_store[s] = {
        "ticker": s,
        "name": s,               # placeholder — can be replaced with full name later
        "shares": 1,
        "active": True
    }

# ----------------------
# Helpers
# ----------------------

def get_today_price(symbol):
    """
    Fetches today's last price with a small cache.
    Returns float price.
    """
    now = datetime.now()

    if symbol in today_cache:
        last_update = today_cache[symbol]["last_update"]
        age_hours = (now - last_update).total_seconds() / 3600
        if age_hours < TODAY_CACHE_EXPIRY_HOURS:
            return today_cache[symbol]["data"]

    # Best-effort fetch
    try:
        t = yf.Ticker(symbol)
        last = t.fast_info.last_price
    except Exception:
        last = None

    if last is None:
        # Fallback: use last close from history
        try:
            hist = t.history(period="2d")
            if not hist.empty:
                last = float(hist["Close"].iloc[-1])
        except Exception:
            last = None

    if last is None:
        raise ValueError(f"Failed to pull today's data for {symbol}")

    today_cache[symbol] = {"data": float(last), "last_update": now}
    return float(last)


def get_historical(symbol) -> pd.DataFrame:
    today_str = pd.Timestamp.today().strftime("%Y-%m-%d")

    if symbol not in historical_cache:
        df = yf.Ticker(symbol).history(period="3mo")
        df.index = pd.to_datetime(df.index, errors="coerce")
        # remove tz if any
        df.index = df.index.tz_localize(None)
        historical_cache[symbol] = df
        return df

    df = historical_cache[symbol]

    if today_str in df.index.strftime("%Y-%m-%d"):
        return df

    today_data = yf.Ticker(symbol).history(period="1d")
    today_data.index = pd.to_datetime(today_data.index, errors="coerce")
    today_data.index = today_data.index.tz_localize(None)
    if not today_data.empty:
        df = pd.concat([df, today_data])
        df = df[~df.index.duplicated(keep="last")]
        cutoff = pd.Timestamp.today() - pd.Timedelta(days=90)
        df = df[df.index >= cutoff]
        historical_cache[symbol] = df

    return df

# ----------------------
# Risk calculation (unchanged logic, but expects avg_vol as decimal)
# ----------------------
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
    """
    Compute risk metrics for a single company's historical prices.
    Returns annualized 3m volatility, 3m performance, rating, score.
    """
    # Daily returns
    returns = price_series.pct_change().dropna()
    if returns.empty:
        return {
            "volatility": 0,
            "performance": 0,
            "score": 0,
            "rating": "Insufficient Data",
            "perf3m": 0.0
        }

    # Annualized 3-month volatility
    daily_vol = float(returns.std())
    vol_3m = daily_vol * np.sqrt(63)   # decimal

    # 3-month performance
    perf = float((price_series.iloc[-1] - price_series.iloc[0]) / price_series.iloc[0])

    # Risk scoring
    vol_pct = vol_3m * 100
    perf_pct = perf * 100

    # Simple but effective rating model
    if vol_3m ==0:
        rating = "No Risk"
        score=100
    elif vol_3m < 0.18 and perf > 0.0:
        rating = "Low Risk"
        score = 80
    elif vol_3m < 0.25:
        rating = "Moderate Risk"
        score = 60
    elif vol_3m < 0.35:
        rating = "Elevated Risk"
        score = 40
    else:
        rating = "High Risk"
        score = 20

    return {
        "volatility": vol_pct,    # %
        "performance": perf_pct,  # %
        "rating": rating,
        "score": score,
        "perf3m": perf
    }


# ----------------------
# New API models
# ----------------------
class UpdateSharesItem(BaseModel):
    ticker: str
    shares: int

class AddCompanyItem(BaseModel):
    ticker: str
    sector: str
    shares: int = 1
    name: str = None

# ----------------------
# Endpoints for managing companies
# ----------------------

@router.get("/companies")
def list_companies():
    """Return all companies (active and inactive flag included)."""
    if len(cs) != 0:
        return list(cs)
    else:
        return portfolio()


@router.post("/add")
def add_company(payload: AddCompanyItem):
    t = payload.ticker.upper()
    if t in companies_store and companies_store[t]["active"]:
        raise HTTPException(status_code=400, detail="Ticker already exists in portfolio.")
    companies_store[t] = {
        "ticker": t,
        "name": payload.name or t,
        "sector": payload.sector,
        "shares": int(payload.shares),
        "active": True
    }
    # clear any historical cache for new tickers to force re-fetch
    historical_cache.pop(t, None)
    today_cache.pop(t, None)
    if t in TECH_SYMBOLS:
        TECH_SYMBOLS[t] += int(payload.shares)
    else:
        TECH_SYMBOLS[t] = int(payload.shares) or 1
    # TECH_SYMBOLS.pop(t, None)
    return {"status": "ok", "company": companies_store[t]}


@router.patch("/update-shares")
def update_shares(changes: list[UpdateSharesItem]):
     global cs
     updated = []

     for item in changes:
        t = item.ticker.upper()
        new_shares = int(item.shares)

        # Update TECH_SYMBOLS if ticker exists
        if t in TECH_SYMBOLS:
            TECH_SYMBOLS[t] = new_shares
            updated.append({"ticker": t, "shares": new_shares})

        # Update cs list (frontend cache) and companies_store
        for c in cs:
            if c["ticker"] == t:
                c["shares"] = new_shares
                # Also update market value based on new shares
                if "priceToday" in c and c["priceToday"] is not None:
                    c["marketValue"] = new_shares * c["priceToday"]

        if t in companies_store:
            companies_store[t]["shares"] = new_shares

        # Invalidate caches so next portfolio recomputes with new shares/prices
        today_cache.pop(t, None)
        historical_cache.pop(t, None)

     # To ensure frontend receives fresh recomputed portfolio if it wants:
     cs = []
     return {"status": "ok", "updated": updated}


@router.delete("/remove/{ticker}")
def remove_company(ticker: str):
    t = ticker.upper()
    if t not in companies_store:
        raise HTTPException(status_code=404, detail="Ticker not found")
    companies_store[t]["active"] = False
    # Invalidate caches
    today_cache.pop(t, None)
    historical_cache.pop(t, None)
    TECH_SYMBOLS.pop(t, None)
    # clear cs so next /companies call regenerates
    global cs
    cs = []
    return {"status": "ok", "ticker": t}

# ------------------------------
# MAIN ENDPOINT (portfolio)
# ------------------------------
@router.get("/portfolio")
def portfolio():
    global cs
    companies = []
    industries = {}
    total_market_value = 0.0
    per_stock_vol_pct = {}     # per-stock 3m vol in decimal (e.g. 0.15)
    returns_map = {}           # for building returns DataFrame
    position_market_values = {}  # market value per position (price * shares)
    overall_change = 0.0
    positive = negative = 0
    total_stocks = 0.0

    # Gather per-stock data
    for ticker, shares in TECH_SYMBOLS.items():
        hist = get_historical(ticker)
        if hist.empty or "Close" not in hist.columns or len(hist) < 2:
            continue

        try:
            today_close = float(hist["Close"].iloc[-1])
            yesterday_close = float(hist["Close"].iloc[-2])
        except Exception:
            continue

        # compute daily change percent
        daily_change = (today_close - yesterday_close) / yesterday_close * 100
        overall_change += daily_change
        total_stocks += today_close

        # compute returns series for covariance & per-stock vol
        returns = hist["Close"].pct_change().dropna()
        daily_vol = float(returns.std()) if not returns.empty else 0.0
        vol_3m = daily_vol * np.sqrt(63)            # decimal e.g. 0.12
        per_stock_vol_pct[ticker] = vol_3m

        # 3-month performance (decimal)
        perf_3m = float((hist["Close"].iloc[-1] - hist["Close"].iloc[0]) / hist["Close"].iloc[0])

        # market cap (best-effort)
        try:
            info = yf.Ticker(ticker).info
            market_cap = info.get("marketCap", 0) or 0
        except Exception:
            market_cap = 0

        # shares from store
        # shares = int(companies_store[ticker].get("shares", 1))
        # position market value = shares * price (use float)
        pos_mv = shares * today_close
        position_market_values[ticker] = pos_mv
        total_market_value += pos_mv

        industry = info.get("industry")
        # print(industry)
        company_risk = compute_company_risk(hist["Close"])
        companies.append({
            "ticker": ticker,
            "symbol": ticker,
            "name": companies_store[ticker].get("name", ticker),
            "industry": industry,
            "marketValue": pos_mv,
            "priceToday": today_close,
            "priceYesterday": yesterday_close,
            "dailyChangePercent": daily_change,
            "priceChangePercent": company_risk["perf3m"],   # decimal
            "shares": shares,
            "companyVolatility": company_risk["volatility"],       # %
            "companyPerformance": company_risk["performance"],     # %
            "companyRiskScore": company_risk["score"],
            "companyRiskRating": company_risk["rating"],
        })
        industries[industry] = industries.get(industry, 0) + pos_mv

        # positive / negative counts from company perf (decimal)
        if company_risk["perf3m"] >= 0:
            positive += 1
        else:
            negative += 1

        # store returns series with ticker column name (for covariance)
        # align to the same index later via concat
        if not returns.empty:
            returns_map[ticker] = returns.rename(ticker)

    num_companies = len(companies)
    diversification = len(industries)
    cs = companies
    num_shares = sum(c["shares"] for c in companies)

    # build returns DataFrame (aligned)
    if len(returns_map) >= 1:
        rets_df = pd.concat(returns_map.values(), axis=1).dropna(how="all").dropna(axis=1, how="all")
    else:
        rets_df = pd.DataFrame()

    # -----------------------------------------
    #   INDIVIDUAL → AGGREGATED RISK INPUTS
    # -----------------------------------------
    # Compute simple aggregates from per-company metrics
    sum_vol_decimal = sum(per_stock_vol_pct.get(c["ticker"], 0.0) for c in companies)  # decimals
    sum_perf_decimal = sum(c["priceChangePercent"] for c in companies)  # decimals
    avg_perf_decimal = sum((c["marketValue"] / total_market_value) * c["priceChangePercent"] for c in companies) if num_companies else 0.0
    avg_change = round(overall_change / max(1, num_companies), 3)

    avg_individual_vol_decimal = (sum_vol_decimal / num_companies) if num_companies > 0 else 0.0

    # -----------------------------------------
    #   PORTFOLIO VOLATILITY (CORRELATED RISK)
    # -----------------------------------------
    portfolio_vol_3m = 0.0

    if not rets_df.empty and total_market_value > 0:
        cov_daily = rets_df.cov().fillna(0).values
        # weights by position MV for the tickers present in rets_df.columns
        weights = np.array([position_market_values.get(ticker, 0.0) / total_market_value for ticker in rets_df.columns], dtype=float)
        # portfolio daily variance
        port_var_daily = float(weights @ cov_daily @ weights.T)
        port_std_daily = np.sqrt(max(0.0, port_var_daily))
        portfolio_vol_3m = port_std_daily * np.sqrt(63)  # decimal

    # If covariance fails, fall back to mean per-stock vol (decimal)
    if portfolio_vol_3m == 0.0:
        portfolio_vol_3m = avg_individual_vol_decimal

    # convert to percent for UI where needed (avg_vol_percent_for_ui is percent)
    avg_vol_percent_for_ui = float(portfolio_vol_3m)

    # avg_perf for UI in percent
    avg_perf_percent_for_ui = float(avg_perf_decimal)

    weighted_risk_contributions = []
    portfolio_weighted_risk_total = 0.0
    for c in companies:
        score = float(c.get("companyRiskScore", 50.0))
        # risk_factor in [0..1], higher => more risky
        risk_factor = (100.0 - score) / 100.0
        weight = (c["marketValue"] / total_market_value) if total_market_value > 0 else (c["shares"] / max(1, sum(ci["shares"] for ci in companies)))
        contribution = risk_factor * weight
        portfolio_weighted_risk_total += contribution
        weighted_risk_contributions.append({
            "ticker": c["ticker"],
            "weight": weight,
            "risk_factor": risk_factor,
            "weighted_contribution": contribution,
            "companyRiskScore": c.get("companyRiskScore"),
            "companyRiskRating": c.get("companyRiskRating")
        })

    # normalize portfolio weighted risk to 0..1 scale (already between 0..1, but keep for clarity)
    portfolio_exposure = portfolio_weighted_risk_total

    # Convert to a portfolio-level "exposure score" for human readability (0..100)
    portfolio_exposure_score = int(max(0, min(100, (portfolio_exposure * 100))))

    # Calculate risk using avg_vol as decimal (e.g. 0.12)
    risk = calculate_tech_risk(
        total_mv=total_market_value,
        avg_perf=avg_perf_decimal,
        avg_vol=portfolio_vol_3m,
        num_companies=num_companies,
        diversification=diversification,
        perf_split={"positive": positive, "negative": negative},
    )
    risk["portfolioExposure"] = {
        "raw": portfolio_exposure,
        "score": portfolio_exposure_score,
        "byCompany": weighted_risk_contributions
    }


    # KPIs as before but return companies array to frontend
    kpis = [
        {
            "id": "total-value",
            "label": "Total Tech Investment",
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
            "value": avg_perf_percent_for_ui,   # percent for UI
            "unit": "%",
            "change": " Positive Growth" if avg_perf_decimal > 0.025 else "Neutral",
            "trend": "up" if avg_perf_decimal > 0 else "down",
            "status": "normal" if avg_perf_decimal > 0 else "warning",
        },
        {
            "id": "volatility",
            "label": "Average Volatility",
            "value": avg_vol_percent_for_ui,
            "unit": "%",
            "change": "Low" if portfolio_vol_3m < 0.18 else ("High" if portfolio_vol_3m > 0.28 else "Neutral"),
            "trend": "up" if portfolio_vol_3m < 0.18 else ("down" if portfolio_vol_3m > 0.28 else "neutral"),
            "status": "normal",
        },
    ]

    donut = [
        {
            "name": ind,
            "value": val,
            "percentage": (val / total_market_value) * 100 if total_market_value > 0 else 0,
            "color": TECH_COLORS.get(ind, "#22c55e"),
        }
        for ind, val in industries.items()
    ]

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

    return {
        "kpis": kpis,
        "companies": companies,
        "donutData": donut,
        "topCompanies": top_companies,
        "performanceData": performance_data,
        "totalMarketValue": total_market_value,
        "riskScore": risk,
    }
