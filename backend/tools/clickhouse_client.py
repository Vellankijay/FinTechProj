"""
ClickHouse client for querying time-series data.
"""
from typing import List, Dict, Any, Optional
from ..infra.secrets import get_config


def _get_clickhouse_config() -> Dict[str, str]:
    """Get ClickHouse connection config."""
    config = get_config()
    return {
        "url": config["CLICKHOUSE_URL"],
        "user": config["CLICKHOUSE_USER"],
        "password": config["CLICKHOUSE_PASSWORD"],
    }


def fetch_series(
    table: str,
    book: str,
    metric: str,
    window: str = "30m"
) -> List[Dict[str, Any]]:
    """
    Fetch time-series data from ClickHouse.

    Args:
        table: Table name (e.g., 'risk_metrics', 'positions')
        book: Book identifier
        metric: Metric column name
        window: Time window (e.g., '30m', '1h', '1d')

    Returns:
        List of time-series rows

    Example response:
        [
            {"timestamp": "2025-11-05T10:00:00Z", "value": 1200000, "book": "PM_BOOK1"},
            {"timestamp": "2025-11-05T10:15:00Z", "value": 1225000, "book": "PM_BOOK1"},
            ...
        ]
    """
    ch_config = _get_clickhouse_config()

    # Parse window to determine time range
    window_seconds = _parse_window_to_seconds(window)

    # Build SQL query (parameterized for safety)
    query = f"""
        SELECT
            timestamp,
            {metric} as value,
            book
        FROM {table}
        WHERE
            book = %(book)s
            AND timestamp >= now() - INTERVAL {window_seconds} SECOND
        ORDER BY timestamp DESC
    """

    print(f"[ClickHouse] Query: {query}")
    print(f"[ClickHouse] Params: book={book}")

    try:
        # In production, execute actual ClickHouse query:
        # import clickhouse_driver
        # client = clickhouse_driver.Client(
        #     host=ch_config["url"],
        #     user=ch_config["user"],
        #     password=ch_config["password"]
        # )
        # result = client.execute(query, {"book": book})

        # For demo, return mock data
        import time
        now = time.time()
        points = []

        for i in range(10):
            timestamp_offset = i * (window_seconds / 10)
            points.append({
                "timestamp": now - window_seconds + timestamp_offset,
                "value": 1200000 + (i * 5000),  # Trending up
                "book": book,
                "metric": metric
            })

        return points

    except Exception as e:
        print(f"[ClickHouse ERROR] {e}")
        raise Exception(f"Failed to fetch series from ClickHouse: {str(e)}")


def query(sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Execute arbitrary SQL query on ClickHouse.

    Args:
        sql: SQL query string
        params: Query parameters (for parameterized queries)

    Returns:
        Query results as list of dictionaries
    """
    ch_config = _get_clickhouse_config()

    print(f"[ClickHouse] Custom query: {sql}")
    print(f"[ClickHouse] Params: {params}")

    try:
        # In production, execute query
        # Return mock data for demo
        return []

    except Exception as e:
        print(f"[ClickHouse ERROR] {e}")
        raise Exception(f"Query failed: {str(e)}")


def _parse_window_to_seconds(window: str) -> int:
    """
    Parse time window string to seconds.

    Args:
        window: Time window (e.g., '30m', '1h', '2d')

    Returns:
        Number of seconds
    """
    window = window.lower().strip()

    if window.endswith('s'):
        return int(window[:-1])
    elif window.endswith('m'):
        return int(window[:-1]) * 60
    elif window.endswith('h'):
        return int(window[:-1]) * 3600
    elif window.endswith('d'):
        return int(window[:-1]) * 86400
    else:
        # Default to minutes
        return int(window) * 60
