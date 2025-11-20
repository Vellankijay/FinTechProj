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

router = APIRouter(prefix="/api/tech")
historical_cache = {}
today_cache = {}
TODAY_CACHE_EXPIRY_HOURS = 3

TECH_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "ORCL", "CRM", "SAP",
                "AMD", "QCOM", "AVGO", "TSM", "ASL"]
TECH_MAP = {
    "AAPL": "Consumer Tech",
    "META": "Consumer Tech",
    "TSLA": "Consumer Tech",
    "AMZN": "Consumer Tech",

    "GOOGL": "Cloud & Enterprise",
    "MSFT": "Cloud & Enterprise",
    "ORCL": "Cloud & Enterprise",
    "CRM": "Cloud & Enterprise",
    "SAP": "Cloud & Enterprise",

    "NVDA": "Semiconductors",
    "AMD": "Semiconductors",
    "QCOM": "Semiconductors",
    "AVGO": "Semiconductors",
    "TSM": "Semiconductors",
    "ASL": "Semiconductors"
}

TECH_COLORS = {
    "Consumer Tech": "#3b82f6",
    "Cloud & Enterprise": "#a855f7",
    "Semiconductors": "#22c55e"
}



def get_today_price(symbol):
    """
    Fetches only today's price (1d data) with 3-hour cache.
    Does NOT modify the historical 3-month cache.
    """
    now = datetime.now()

    # If cached and fresh → return cached value
    if symbol in today_cache:
        last_update = today_cache[symbol]["last_update"]
        age_hours = (now - last_update).total_seconds() / 3600

        if age_hours < TODAY_CACHE_EXPIRY_HOURS:
            return today_cache[symbol]["data"]

    # Fetch fresh today's data
    tdy = yf.Ticker(symbol).fast_info.last_price
    # tdy.index = pd.to_datetime(tdy.index, errors="coerce")

# Now safely remove timezone (this NEVER errors for DatetimeIndex)
    # tdy.index = tdy.index.tz_localize(None)/

    if not tdy:
        raise ValueError(f"Failed to pull today's data for {symbol}")

    # Update cache
    today_cache[symbol] = {
        "data": tdy,
        "last_update": now
    }

    return tdy


def get_historical(symbol) -> pd.DataFrame:
    today_str = pd.Timestamp.today().strftime("%Y-%m-%d")

    if symbol not in historical_cache:
        df = yf.Ticker(symbol).history(period="3mo")
        df.index = pd.to_datetime(df.index, errors="coerce")

# Now safely remove timezone (this NEVER errors for DatetimeIndex)
        df.index = df.index.tz_localize(None)

        historical_cache[symbol] = df
        return df

    df = historical_cache[symbol]

    if today_str in df.index.strftime("%Y-%m-%d"):
        return df

    today_data = yf.Ticker(symbol).history(period="1d")
    today_data.index = pd.to_datetime(today_data.index, errors="coerce")

# Now safely remove timezone (this NEVER errors for DatetimeIndex)
    today_data.index = today_data.index.tz_localize(None)
    if not today_data.empty:
        df = pd.concat([df, today_data])
        df = df[~df.index.duplicated(keep="last")]

        cutoff = pd.Timestamp.today() - pd.Timedelta(days=90)

        df = df[df.index >= cutoff]

        historical_cache[symbol] = df
    
    return df

# Simple in-memory cache to avoid hitting Yahoo Finance too often
def calculate_tech_risk(total_mv, avg_perf, avg_vol, num_companies, diversification, perf_split):
    """
    Returns: full risk object with score, rating, and factor breakdown
    """

    diversification_score = min(100, diversification * 15)   # more industries = safer
    volatility_score = max(0, 100 - (avg_vol * 400))
    performance_score = (perf_split["positive"] / max(1, num_companies)) * 100
    exposure_score = min(100, (perf_split["positive"] / max(1, perf_split["negative"])) * 40)

    # Weighted portfolio score (percent system)
    final_score = (
        diversification_score * 0.25 +
        volatility_score * 0.30 +
        performance_score * 0.25 +
        exposure_score * 0.20
    )

    # Convert color & rating
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
                "explanation": f"Portfolio spans {diversification} healthcare industries."
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


# ------------------------------
# MAIN ENDPOINT
# ------------------------------

@router.get("/portfolio")
def tech_portfolio():
    companies = []
    industries = {}
    total_market_value = 0
    vol_sum = 0
    perf_sum = 0
    overall_change = 0
    positive = negative = 0

    for symbol in TECH_SYMBOLS:
        hist = get_historical(symbol)

        if hist.empty:
            continue

    # NEW — get only today's price
        td = get_today_price(symbol)
        print(td)

    # Today’s close and yesterday’s close
        today_close = float(hist["Close"].iloc[-1])
        # print(today_close)
        yesterday_close = float(hist["Close"].iloc[-2])
        # print(yesterday_close)  # last price from historical

    # Compute daily % change
        daily_change = (today_close - yesterday_close) / yesterday_close * 100
        overall_change += daily_change
        # print(daily_change)


    # 3-month metrics using historical data
        returns = hist["Close"].pct_change().dropna()
        vol = float(returns.std())
        perf_3m = float((hist["Close"][-1] - hist["Close"][0]) / hist["Close"][0])

        info = yf.Ticker(symbol).info
        market_cap = info.get("marketCap", 0)

        industry = TECH_MAP.get(symbol, "Healthcare")

    # Aggregations
        total_market_value += market_cap
        vol_sum += vol
        perf_sum += perf_3m

        if perf_3m >= 0:
            positive += 1
        else:
            negative += 1

        companies.append({
            "symbol": symbol,
            "industry": industry,
            "marketValue": market_cap,
            "priceToday": today_close,
            "priceYesterday": yesterday_close,
            "dailyChangePercent": daily_change,
            "priceChangePercent": perf_3m,
            "highLowSpread": vol,
        })

        industries[industry] = industries.get(industry, 0) + market_cap


    num_companies = len(companies)
    diversification = len(industries)

    avg_perf = perf_sum / max(1, num_companies)
    avg_vol = vol_sum / max(1, num_companies)
    avg_change = overall_change/ max(1, num_companies)

    risk = calculate_tech_risk(
        total_mv=total_market_value,
        avg_perf=avg_perf,
        avg_vol=avg_vol,
        num_companies=num_companies,
        diversification=diversification,
        perf_split={"positive": positive, "negative": negative},
    )
    print(risk)

    # ------------------------------
    # VISUALIZATION DATA SHAPES
    # ------------------------------

    # KPI metrics for frontend
    # print(overall_change)
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
            "value": avg_perf,
            "unit": "%",
            "change": 1.8,
            "trend": "up" if avg_perf > 0 else "down",
            "status": "normal" if avg_perf > 0 else "warning",
        },
        {
            "id": "volatility",
            "label": "Average Volatility",
            "value": avg_vol * 100,
            "unit": "%",
            "change": -0.5,
            "trend": "down",
            "status": "normal",
        },
    ]

    # Donut chart
    donut = [
        {
            "name": ind,
            "value": val,
            "percentage": (val / total_market_value) * 100,
            "color": TECH_COLORS.get(ind, "#22c55e"),
        }
        for ind, val in industries.items()
    ]

    # Top companies
    top = sorted(companies, key=lambda x: x["marketValue"], reverse=True)[:10]
    top_companies = [
        {
            "bucket": c["symbol"],
            "count": c["marketValue"],
            "percentage": (c["marketValue"] / total_market_value) * 100,
            "color": "#22c55e",
        }
        for c in top
    ]

    # Performance distribution
    perf_ranges = [
        ("Strong Growth (>5%)", 5, 9999, "#22c55e"),
        ("Growth (0-5%)", 0, 5, "#3b82f6"),
        ("Decline (0 to -5%)", -5, 0, "#eab308"),
        ("Strong Decline (<-5%)", -9999, -5, "#ef4444"),
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
        "donutData": donut,
        "topCompanies": top_companies,
        "performanceData": performance_data,
        "totalMarketValue": total_market_value,
        "riskScore": risk,
    }

