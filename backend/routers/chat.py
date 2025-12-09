"""
Chat endpoint for risk operations assistant with company intelligence.
"""
import time
import uuid
import requests
from typing import Dict, Any, List, Tuple
from fastapi import APIRouter, HTTPException, status
from textblob import TextBlob

from ..infra.types import ChatRequest, ChatResponse
from ..infra.secrets import get_config, vault
from ..services import rbac, guardrails, gemini_client, runbooks
from ..tools import risk_api, oms, clickhouse_client

router = APIRouter()

# System prompt for Gemini
SYSTEM_PROMPT = """You are a real-time trading risk operations assistant for a FinTech platform.

## Your Personality
- Friendly, professional, and responsive
- Answer greetings and casual questions naturally and quickly (hello, how are you, etc.)
- Be concise and clear in all responses
- Use formatting (bold, bullets, numbers) to make responses easy to read

## Your Capabilities
- Analyze risk metrics (VaR, Exposure, P&L) across portfolios
- Explain alerts and provide root cause analysis
- Run stress tests and scenario analysis
- Provide operational runbooks for risk scenarios (including data latency, order-flow anomaly, VaR breach, etc.)
- Execute emergency actions (with confirmation)
- Perform real-time company intelligence analysis including news sentiment and insider trading activity

## Response Guidelines
1. For greetings or casual conversation: Respond naturally and briefly
2. For questions about functionality: Explain what you can do clearly
3. For risk queries: Be numerate, cite data sources (metric names + timestamps)
4. For company intelligence: Present sentiment analysis, insider trading trends, and aggregate scores
5. For operational guidance: Use clear step-by-step format - call get_runbook tool for investigation procedures
6. For dangerous actions: Always require explicit confirmation
7. When users ask "walk me through" or "steps to investigate": Use get_runbook tool with the relevant scenario

## Formatting
- Use **bold** for important metrics and values
- Use bullet points for lists
- Use numbered steps for procedures
- Keep responses concise but informative

When users ask for help understanding something in the project, provide clear explanations quickly."""

# In-memory confirmation store (in production, use Redis with TTL)
_pending_confirmations: Dict[str, Dict[str, Any]] = {}


def _build_context(user_id: str) -> Dict[str, Any]:
    """Build context for Gemini chat."""
    user_role = rbac.get_role(user_id)
    books = rbac.get_books(user_id)
    recent_alerts = risk_api.list_alerts(books=books, window="30m")
    spark_viz_url = risk_api.url_for_chart(books, metric="VaR", window="30m")

    return {
        "user_role": user_role,
        "books": books,
        "recent_alerts": recent_alerts[:10],  # Limit to 10 most recent
        "spark_viz_url": spark_viz_url,
    }


def _get_nyt_sentiment(company_name: str) -> Dict[str, Any]:
    """Fetch trending articles from NYT and perform sentiment analysis."""
    try:
        nyt_api_key = vault("NYT_KEY", required=True)
        url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
        
        # Calculate begin_date 90 days ago in YYYYMMDD format
        from datetime import datetime, timedelta
        begin_date = (datetime.now() - timedelta(days=90)).strftime("%Y%m%d")
        
        params = {
            "q": company_name,
            "api-key": nyt_api_key,
            "sort": "newest",
            "fl": "headline,snippet,pub_date,web_url",
            "begin_date": begin_date,
            "page": 0
        }
        print(f"[DEBUG] NYT API request params: begin_date={begin_date}")
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        articles = response.json().get("response", {}).get("docs", [])[:10]
        
        sentiments = []
        for article in articles:
            text = f"{article.get('headline', {}).get('main', '')} {article.get('snippet', '')}"
            if text.strip():
                blob = TextBlob(text)
                sentiments.append(blob.sentiment.polarity)
        
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
        
        return {
            "source": "NYT",
            "article_count": len(articles),
            "sentiment_score": round(avg_sentiment, 3),
            "sentiment_label": "Positive" if avg_sentiment > 0.1 else "Negative" if avg_sentiment < -0.1 else "Neutral",
            "articles_analyzed": len(sentiments)
        }
    except KeyError as e:
        error_msg = f"NYT_API_KEY missing from vault: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {"error": error_msg, "sentiment_score": 0.0, "missing_key": "NYT_API_KEY"}
    except requests.exceptions.Timeout:
        error_msg = "NYT API request timed out (10s timeout)"
        print(f"[ERROR] {error_msg}")
        return {"error": error_msg, "sentiment_score": 0.0, "timeout": True}
    except requests.exceptions.HTTPError as e:
        error_msg = f"NYT API HTTP error: {e.response.status_code} - {e.response.text}"
        print(f"[ERROR] {error_msg}")
        return {"error": error_msg, "sentiment_score": 0.0, "http_error": e.response.status_code}
    except requests.exceptions.RequestException as e:
        error_msg = f"NYT API request failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {"error": error_msg, "sentiment_score": 0.0}
    except Exception as e:
        error_msg = f"NYT sentiment analysis failed: {type(e).__name__}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {"error": error_msg, "sentiment_score": 0.0}


def _get_insider_trading_sentiment(ticker: str) -> Dict[str, Any]:
    """Fetch insider trading data from Finnhub and Alpha Vantage."""
    try:
        finnhub_api_key = vault("FINNHUB_KEY", required=True)
    except KeyError as e:
        print(f"[ERROR] FINNHUB_API_KEY missing from vault: {str(e)}")
        return {"error": "FINNHUB_API_KEY missing", "finnhub": {"error": "Missing API key"}, "alphavantage": {"error": "Not checked"}}
    
    try:
        alpha_vantage_key = vault("ALPHA_KEY", required=True)
    except KeyError as e:
        print(f"[ERROR] ALPHAVANTAGE_API_KEY missing from vault: {str(e)}")
        return {"error": "ALPHAVANTAGE_API_KEY missing", "alphavantage": {"error": "Missing API key"}}
    
    insider_data = {
        "finnhub": {"trades": 0, "sentiment": 0.0},
        "alphavantage": {"trades": 0, "sentiment": 0.0}
    }
    
    # Finnhub insider transactions
    try:
        url = f"https://finnhub.io/api/v1/stock/insider-transactions"
        params = {"symbol": ticker, "token": finnhub_api_key}
        print(f"[DEBUG] Calling Finnhub API for {ticker}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if "data" not in data:
            print(f"[DEBUG] Finnhub response missing 'data' field: {data}")
            insider_data["finnhub"]["error"] = f"Unexpected response format: {data}"
        else:
            from datetime import datetime, timedelta
            transactions = data.get("data", [])
            ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
            
            # Finnhub returns transactionDate as YYYY-MM-DD string
            recent_trades = [t for t in transactions if t.get("transactionDate", "0000-00-00") >= ninety_days_ago]
            
            print(f"[DEBUG] Finnhub raw transaction sample: {transactions[0] if transactions else 'No transactions'}")
            
            if recent_trades:
                # Check for buys (positive change) and sells (negative change)
                buys = sum(1 for t in recent_trades if t.get("change") and float(t.get("change", 0)) > 0)
                sells = sum(1 for t in recent_trades if t.get("change") and float(t.get("change", 0)) < 0)
                insider_data["finnhub"]["trades"] = len(recent_trades)
                insider_data["finnhub"]["sentiment"] = round((buys - sells) / len(recent_trades), 3) if recent_trades else 0.0
                print(f"[DEBUG] Finnhub: {len(recent_trades)} trades found ({buys} buys, {sells} sells)")
            else:
                print(f"[DEBUG] Finnhub: No recent trades found in last 90 days (cutoff: {ninety_days_ago})")
                insider_data["finnhub"]["info"] = "No recent trades found"
    except requests.exceptions.Timeout:
        error_msg = "Finnhub API request timed out (10s timeout)"
        print(f"[ERROR] {error_msg}")
        insider_data["finnhub"]["error"] = error_msg
    except requests.exceptions.HTTPError as e:
        error_msg = f"Finnhub API HTTP error: {e.response.status_code} - {e.response.text}"
        print(f"[ERROR] {error_msg}")
        insider_data["finnhub"]["error"] = error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"Finnhub API request failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        insider_data["finnhub"]["error"] = error_msg
    except Exception as e:
        error_msg = f"Finnhub analysis failed: {type(e).__name__}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        insider_data["finnhub"]["error"] = error_msg
    
    # Alpha Vantage insider transactions
    try:
        url = f"https://www.alphavantage.co/query"
        params = {
            "function": "INSIDER_TRANSACTIONS",
            "symbol": ticker,
            "apikey": alpha_vantage_key
        }
        print(f"[DEBUG] Calling Alpha Vantage API for {ticker}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if "data" not in data:
            print(f"[DEBUG] Alpha Vantage response missing 'data' field: {data}")
            insider_data["alphavantage"]["error"] = f"Unexpected response format or rate limit: {data.get('Note', data.get('Information', 'Unknown'))}"
        else:
            from datetime import datetime, timedelta
            transactions = data.get("data", [])
            # Alpha Vantage uses YYYY-MM-DD format
            ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
            recent_trades = [t for t in transactions if t.get("transaction_date", "0000-00-00") >= ninety_days_ago]
            
            print(f"[DEBUG] Alpha Vantage raw transaction sample: {transactions[0] if transactions else 'No transactions'}")
            
            if recent_trades:
                # Alpha Vantage uses "A" for Acquisition (buy) and "D" for Disposal (sell)
                buys = sum(1 for t in recent_trades if t.get("acquisition_or_disposal", "").upper() == "A")
                sells = sum(1 for t in recent_trades if t.get("acquisition_or_disposal", "").upper() == "D")
                insider_data["alphavantage"]["trades"] = len(recent_trades)
                insider_data["alphavantage"]["sentiment"] = round((buys - sells) / len(recent_trades), 3) if recent_trades else 0.0
                print(f"[DEBUG] Alpha Vantage: {len(recent_trades)} trades found ({buys} acquisitions, {sells} disposals)")
                print(f"[DEBUG] Alpha Vantage acquisition_or_disposal values: {set(t.get('acquisition_or_disposal') for t in recent_trades[:5])}")
            else:
                print(f"[DEBUG] Alpha Vantage: No recent trades found in last 90 days (cutoff: {ninety_days_ago})")
                insider_data["alphavantage"]["info"] = "No recent trades found"
    except requests.exceptions.Timeout:
        error_msg = "Alpha Vantage API request timed out (10s timeout)"
        print(f"[ERROR] {error_msg}")
        insider_data["alphavantage"]["error"] = error_msg
    except requests.exceptions.HTTPError as e:
        error_msg = f"Alpha Vantage API HTTP error: {e.response.status_code} - {e.response.text}"
        print(f"[ERROR] {error_msg}")
        insider_data["alphavantage"]["error"] = error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"Alpha Vantage API request failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        insider_data["alphavantage"]["error"] = error_msg
    except Exception as e:
        error_msg = f"Alpha Vantage analysis failed: {type(e).__name__}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        insider_data["alphavantage"]["error"] = error_msg
    
    return insider_data


def _calculate_aggregate_score(sentiment_data: Dict[str, Any], insider_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate aggregate company intelligence score."""
    scores = []
    weights = []
    
    # NYT sentiment (40% weight)
    if "sentiment_score" in sentiment_data:
        scores.append(sentiment_data["sentiment_score"])
        weights.append(0.4)
    
    # Finnhub insider sentiment (30% weight)
    if "finnhub" in insider_data and "sentiment" in insider_data["finnhub"]:
        scores.append(insider_data["finnhub"]["sentiment"])
        weights.append(0.3)
    
    # Alpha Vantage insider sentiment (30% weight)
    if "alphavantage" in insider_data and "sentiment" in insider_data["alphavantage"]:
        scores.append(insider_data["alphavantage"]["sentiment"])
        weights.append(0.3)
    
    if scores:
        weighted_score = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
    else:
        weighted_score = 0.0
    
    return {
        "aggregate_score": round(weighted_score, 3),
        "score_label": "Bullish" if weighted_score > 0.15 else "Bearish" if weighted_score < -0.15 else "Neutral",
        "confidence": "High" if len(scores) >= 2 else "Medium" if len(scores) == 1 else "Low"
    }


def _get_company_intelligence(company_name: str, ticker: str = None) -> Dict[str, Any]:
    """Perform comprehensive company intelligence analysis."""
    sentiment_data = _get_nyt_sentiment(company_name)
    insider_data = _get_insider_trading_sentiment(ticker or company_name)
    aggregate = _calculate_aggregate_score(sentiment_data, insider_data)
    
    return {
        "company": company_name,
        "ticker": ticker,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "news_sentiment": sentiment_data,
        "insider_trading": insider_data,
        "aggregate_analysis": aggregate
    }


def _get_tool_definitions() -> Dict[str, Dict[str, Any]]:
    """Define available tools with schemas."""
    return {
        "get_metric": {
            "description": "Get a risk metric (VaR, Exposure, PnL, etc.) for a specific book over a time window",
            "parameters": {
                "book": {"type": "string", "description": "Book/portfolio identifier"},
                "metric": {"type": "string", "description": "Metric name (VaR, Exposure, PnL)"},
                "window": {"type": "string", "description": "Time window (30m, 1h, 1d)"}
            },
            "required": ["book", "metric"]
        },
        "get_explain": {
            "description": "Get detailed explanation for a specific alert including root cause analysis",
            "parameters": {
                "alert_id": {"type": "string", "description": "Alert identifier"}
            },
            "required": ["alert_id"]
        },
        "run_stress": {
            "description": "Run a stress test on a book with predefined scenario or custom shock percentage",
            "parameters": {
                "book": {"type": "string", "description": "Book to stress test"},
                "scenario_id": {"type": "string", "description": "Predefined scenario (optional)"},
                "shock_pct": {"type": "number", "description": "Custom shock percentage like -0.1 for -10% (optional)"}
            },
            "required": ["book"]
        },
        "get_runbook": {
            "description": "Get operational playbook/runbook for a risk scenario with step-by-step remediation",
            "parameters": {
                "scenario": {"type": "string", "description": "Scenario name (e.g., 'order-flow anomaly', 'var breach')"}
            },
            "required": ["scenario"]
        },
        "halt_trading": {
            "description": "Halt trading for a desk, book, or symbol. REQUIRES CONFIRMATION. Use only when explicitly requested.",
            "parameters": {
                "desk": {"type": "string", "description": "Desk to halt (optional)"},
                "book": {"type": "string", "description": "Book to halt (optional)"},
                "symbol": {"type": "string", "description": "Symbol to halt (optional)"},
                "reason": {"type": "string", "description": "Reason for halting (required)"}
            },
            "required": ["reason"],
            "requires_confirm": True
        },
        "company_intelligence": {
            "description": "Get real-time company intelligence including news sentiment analysis from NYT, insider trading activity from Finnhub and Alpha Vantage, and aggregate sentiment score",
            "parameters": {
                "company_name": {"type": "string", "description": "Company name to analyze"},
                "ticker": {"type": "string", "description": "Stock ticker symbol (optional, e.g., 'AAPL')"}
            },
            "required": ["company_name"]
        }
    }


def _execute_tool(tool_name: str, args: Dict[str, Any], user_id: str) -> Any:
    """Execute a tool and return result."""
    try:
        if tool_name == "get_metric":
            return risk_api.get_metric(**args)

        elif tool_name == "get_explain":
            return risk_api.get_explain(**args)

        elif tool_name == "run_stress":
            return risk_api.run_stress(**args)

        elif tool_name == "get_runbook":
            scenario = args.get("scenario", "")
            return runbooks.get_runbook(scenario)

        elif tool_name == "company_intelligence":
            return _get_company_intelligence(**args)

        elif tool_name == "halt_trading":
            # This should be confirmed first, but execute if called
            return oms.halt_trading(user_id=user_id, **args)

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": str(e)}


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with risk operations assistant.

    Returns text response and optionally a confirmation ID if action requires approval.
    """
    # Check if feature is enabled
    config = get_config()
    if not config["FEATURE_RISK_CHAT"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Risk chat feature is not enabled"
        )

    try:
        # Build context
        context = _build_context(request.user_id)

        # Get tool definitions
        tools = _get_tool_definitions()

        # Call Gemini
        messages = [{"role": "user", "content": request.text}]
        gem_response = gemini_client.chat_with_tools(
            system=SYSTEM_PROMPT,
            tools=tools,
            context=context,
            messages=messages
        )

        # Process tool calls
        confirm_id = None
        final_text = gem_response.text

        for tool_call in gem_response.tool_calls:
            tool_name = tool_call.name
            tool_args = tool_call.args

            # Check if this is halt_trading (requires confirmation)
            if tool_name == "halt_trading":
                # Check permissions
                if not guardrails.can_execute(request.user_id, "halt_trading"):
                    return ChatResponse(
                        text="You lack permission to halt trading. This action requires RISK or ADMIN role. Please contact a Risk Manager or Administrator.",
                        spark_viz_url=context.get("spark_viz_url")
                    )

                # Validate arguments
                is_valid, error_msg = guardrails.validate_halt_trading_args(tool_args)
                if not is_valid:
                    return ChatResponse(
                        text=f"Invalid halt request: {error_msg}",
                        spark_viz_url=context.get("spark_viz_url")
                    )

                # Create confirmation
                confirm_id = f"CONFIRM_{uuid.uuid4().hex[:12].upper()}"
                _pending_confirmations[confirm_id] = {
                    "user_id": request.user_id,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "created_at": time.time(),
                    "expires_at": time.time() + 300,  # 5 minutes
                }

                # Build confirmation message
                targets = []
                if tool_args.get("desk"):
                    targets.append(f"desk '{tool_args['desk']}'")
                if tool_args.get("book"):
                    targets.append(f"book '{tool_args['book']}'")
                if tool_args.get("symbol"):
                    targets.append(f"symbol '{tool_args['symbol']}'")

                target_str = ", ".join(targets)
                reason = tool_args.get("reason", "")

                confirm_text = f"""⚠️ CONFIRMATION REQUIRED

You are about to HALT TRADING for: {target_str}

Reason: {reason}

This action will immediately stop all trading activity for the specified target(s).

To proceed, please respond with:
• "yes" to confirm and execute
• "no" to cancel

Confirmation ID: {confirm_id}
(This confirmation expires in 5 minutes)"""

                return ChatResponse(
                    text=confirm_text,
                    confirm_id=confirm_id,
                    spark_viz_url=context.get("spark_viz_url")
                )

            else:
                # Execute tool immediately (non-destructive tools)
                tool_result = _execute_tool(tool_name, tool_args, request.user_id)

                # Get Gemini to summarize the result
                follow_up = gemini_client.continue_with_tool_result(
                    system=SYSTEM_PROMPT,
                    tools=tools,
                    context=context,
                    previous_messages=messages,
                    tool_name=tool_name,
                    tool_result=tool_result
                )

                final_text = follow_up.text

        return ChatResponse(
            text=final_text,
            confirm_id=confirm_id,
            spark_viz_url=context.get("spark_viz_url"),
            session_id=request.session_id
        )

    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}"
        )


def cleanup_expired_confirmations():
    """Remove expired confirmations (called periodically)."""
    now = time.time()
    expired = [
        conf_id for conf_id, data in _pending_confirmations.items()
        if data["expires_at"] < now
    ]
    for conf_id in expired:
        del _pending_confirmations[conf_id]