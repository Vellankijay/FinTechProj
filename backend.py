"""
Free-tier stock/industry risk model using:
- Alpha Vantage (fundamentals & volatility)
- Yahoo Finance (latest price data)
- Finnhub (news + insider sentiment)
- New York Times (industry macro news)
"""

import requests, numpy as np, pandas as pd, yfinance as yf
from datetime import datetime, timedelta
import finnhub

# === API KEYS ===
ALPHA_KEY = "8I2SPDA2XM9I2XFH"
FINNHUB_KEY = "d3o52hhr01qmj82vre4gd3o52hhr01qmj82vre50"
NYT_KEY = "BrUBATGdrL5rZdvFDvNQYWtfyWGncG1t"

def get_nyt_sentiment(query):
    """Approximate sentiment of recent NYT business/tech/health articles."""
    end = datetime.now()
    start = end - timedelta(days=14)
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    params = {
        "q": query,
        "api-key": NYT_KEY,
        "begin_date": start.strftime("%Y%m%d"),
        "end_date": end.strftime("%Y%m%d"),
        "sort": "newest",
        "fq": 'section_name:("Business" "Technology" "Health")'
    }

    try:
        js = requests.get(url, params=params, timeout=10).json()
        docs = js.get("response", {}).get("docs", [])
        if not docs:
            print(f"No NYT articles found for '{query}'.")
            return 0

        pos, neg = 0, 0
        for d in docs:
            text = (d.get("headline", {}).get("main", "") + " " + d.get("snippet", "")).lower()
            if any(w in text for w in ["growth", "gain", "record", "strong", "innovation", "expansion", "profit"]):
                pos += 1
            if any(w in text for w in ["loss", "lawsuit", "decline", "cut", "drop", "risk", "concern", "negative"]):
                neg += 1

        score = (pos - neg) / max(1, pos + neg)
        print(f"NYT sentiment for {query}: {score:.2f}")
        return np.clip(score, -1, 1)
    except Exception as e:
        print("NYT error:", e)
        return 0


# -----------------------------------------------------
# 2. Finnhub Sentiment (free endpoint)
# -----------------------------------------------------
def get_finnhub_sentiment(symbol):
    """Get insider sentiment score for a stock using Finnhub."""
    end = datetime.now()
    start = end - timedelta(days=180)  # 6 months back
    finnhub_client = finnhub.Client(api_key=FINNHUB_KEY)
    data = finnhub_client.stock_insider_sentiment(
      symbol, _from=start.strftime("%Y-%m-%d"), to=end.strftime("%Y-%m-%d")
    )
    print(data)

    mspr_data = data.get("data", [])  # <-- extract the list correctly

    if not mspr_data:
      print(f"No insider sentiment data found for {symbol}.")
      return 0.5  # neutral risk

# Compute average normalized mspr
    msprs = [d["mspr"] / 100 for d in mspr_data if "mspr" in d]
    avg_sentiment = np.mean(msprs)

# Risk = 1 - sentiment
    risk_score = 1 - ((avg_sentiment + 1) / 2)
    print(f"Insider risk score for {symbol}: {risk_score:.3f}")

    return np.clip(risk_score, 0, 1)



# -----------------------------------------------------
# 3. Alpha Vantage Fundamentals
# -----------------------------------------------------
def get_alpha_fundamentals(symbol):
    """Retrieve PE ratio and debt/equity ratio from Alpha Vantage (free overview endpoint)."""
    url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={ALPHA_KEY}"
    try:
        data = requests.get(url, timeout=10).json()
        if "Note" in data:  # hit rate limit (5 calls/min)
            print("Alpha Vantage rate limit hit, waiting 60 s…")
            time.sleep(60)
            data = requests.get(url, timeout=10).json()
        pe = float(data.get("PERatio", 15)) if data.get("PERatio") else 15
        debt_eq = float(data.get("DebtToEquity", 1)) if data.get("DebtToEquity") else 1
        print(f"Alpha Vantage fundamentals for {symbol}: PE={pe:.1f}, Debt/Equity={debt_eq:.1f}")
        return pe, debt_eq
    except Exception as e:
        print("Alpha Vantage error:", e)
        return 15, 1


# -----------------------------------------------------
# 4. Combined Risk Calculation
# -----------------------------------------------------
def compute_risk(symbol=None, industry=None):
    """Compute overall risk score for a company (preferred) or fallback industry."""
    if symbol:
        print(f"\n🔍 Analyzing company: {symbol}")
        sentiment_finnhub = get_finnhub_sentiment(symbol)
        sentiment_nyt = get_nyt_sentiment(symbol)
        pe, debt_eq = get_alpha_fundamentals(symbol)
    elif industry:
        print(f"\n🏭 Analyzing industry: {industry}")
        # fallback example tickers
        sample = "AAPL" if industry.lower() == "technology" else "JNJ"
        sentiment_finnhub = get_finnhub_sentiment(sample)
        sentiment_nyt = get_nyt_sentiment(industry)
        pe, debt_eq = (20, 0.8) if industry.lower() == "technology" else (15, 0.6)
    else:
        raise ValueError("Please specify either a company symbol or an industry.")

    avg_sentiment = (sentiment_finnhub + sentiment_nyt) / 2

    # Dynamic weights
    if abs(avg_sentiment) < 0.2:   # neutral case
        w_sentiment, w_fund = 0.6, 0.4
    else:
        w_sentiment, w_fund = 0.7, 0.3

    # Normalize
    sentiment_risk = 1 - np.clip((avg_sentiment + 1) / 2, 0, 1)
    pe_risk = np.clip(pe / 40, 0, 1)
    debt_risk = np.clip(debt_eq / 2, 0, 1)
    fundamentals_risk = (pe_risk + debt_risk) / 2

    # Combine
    total_risk = w_sentiment * sentiment_risk + w_fund * fundamentals_risk
    total_risk = np.clip(total_risk, 0, 1)

    print(f"→ Combined Risk Score: {total_risk:.3f} (0 = safe, 1 = risky)")
    return total_risk


# -----------------------------------------------------
# Example Usage
# -----------------------------------------------------
if __name__ == "__main__":
    # Company-first
    company_symbol = "AAPL"   # try "JNJ", "MSFT", etc.
    risk_score = compute_risk(symbol=company_symbol)
    print(f"\n📊 {company_symbol} Overall Risk Score = {risk_score:.3f}")