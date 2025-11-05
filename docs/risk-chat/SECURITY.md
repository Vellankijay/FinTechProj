# Security Documentation: Risk Chat System

## Security Overview

The Risk Chat system implements multiple layers of security to protect sensitive trading operations and ensure only authorized users can execute critical actions.

---

## 1. Authentication & Authorization

### Role-Based Access Control (RBAC)

Three user roles with hierarchical permissions:

| Role    | Permissions                                           |
|---------|------------------------------------------------------|
| `USER`  | View metrics, alerts, and reports only              |
| `RISK`  | All USER permissions + halt trading, modify limits   |
| `ADMIN` | All RISK permissions + force unwind, config changes  |

**Implementation**: `backend/services/rbac.py`

```python
def get_role(user_id: str) -> UserRole:
    """Returns USER, RISK, or ADMIN"""

def get_books(user_id: str) -> List[str]:
    """Returns books user has access to"""
```

### Book-Level Access Control

Users are assigned specific books (portfolios):
```python
user_books = get_books("demo")  # ["PM_BOOK1", "TECH_DESK"]
```

Only data from accessible books is included in context:
```python
recent_alerts = risk_api.list_alerts(books=user_books)
```

---

## 2. Guardrails

### Permission Validation

Before any action execution:

```python
# Check if user can execute this action
if not guardrails.can_execute(user_id, "halt_trading"):
    return "You lack permission to halt trading. Ask a Risk/Admin user."
```

**Privileged Actions**:
```python
PRIVILEGED_ACTIONS = {
    "halt_trading": ["RISK", "ADMIN"],
    "modify_limits": ["RISK", "ADMIN"],
    "override_alert": ["RISK", "ADMIN"],
    "force_unwind": ["ADMIN"],
    "change_config": ["ADMIN"],
}
```

### Input Validation

All tool arguments are validated before execution:

```python
def validate_halt_trading_args(args):
    # At least one target required
    if not any([args.get("desk"), args.get("book"), args.get("symbol")]):
        return False, "At least one target must be specified"

    # Reason must be meaningful
    if len(args.get("reason", "").strip()) < 10:
        return False, "Reason must be at least 10 characters"

    return True, ""
```

### Data Redaction

Sensitive information is automatically redacted from logs and responses:

```python
REDACT_KEYS = [
    "password", "api_key", "secret", "token",
    "ssn", "social_security", "credit_card", "cvv", "pin"
]

def redact(payload: Dict) -> Dict:
    """Replace sensitive values with ***REDACTED***"""
    # Recursively redact nested dictionaries
```

**Example**:
```python
# Before redaction
{"user": "john", "api_key": "sk-12345"}

# After redaction
{"user": "john", "api_key": "***REDACTED***"}
```

---

## 3. Confirmation Mechanism

### Two-Step Execution for Destructive Actions

Critical actions require explicit user confirmation:

1. **Initial Request**: User asks to halt trading
2. **Confirmation Prompt**: System generates confirmation ID
3. **User Decision**: User clicks "Yes" or "No"
4. **Execution**: Action only executes after "Yes"

**Flow**:
```
User: "Halt trading for AAPL"
         ↓
System: Creates confirmation (expires in 5 min)
         ↓
User: Clicks "Confirm" or "Cancel"
         ↓
System: Executes OR cancels
```

### Confirmation Security

**Ownership Validation**:
```python
if confirm_data["user_id"] != request.user_id:
    raise HTTPException(403, "You cannot confirm this action")
```

**Expiration**:
```python
if time.time() > confirm_data["expires_at"]:
    raise HTTPException(410, "Confirmation expired")
```

**One-Time Use**:
```python
# Confirmation is deleted after use
del _pending_confirmations[confirm_id]
```

---

## 4. Secrets Management

### Environment Variables

All secrets loaded from environment:

```python
def vault(key: str, required: bool = True) -> str:
    """
    Retrieve secret from environment.
    Raises ValueError if required secret is missing.
    """
    value = os.getenv(key)
    if required and not value:
        raise ValueError(f"Missing required secret: {key}")
    return value
```

### Never Hard-Coded

❌ **Bad**:
```python
GEMINI_API_KEY = "sk-12345..."  # NEVER DO THIS
```

✅ **Good**:
```python
GEMINI_API_KEY = vault("GEMINI_API_KEY")
```

### .env Files

**Development**: `.env.local` (gitignored)
**Production**: Environment variables set in deployment platform

**.env.example** provides template without real secrets:
```env
GEMINI_API_KEY=changeme
```

---

## 5. Audit Logging

### Comprehensive Event Tracking

All critical actions are logged to `backend/audit.log` (JSONL format):

```python
audit.log(
    user_id="demo",
    action="halt_trading",
    details={
        "ticket_id": "HALT_ABC123",
        "symbol": "AAPL",
        "reason": "Unusual order flow"
    },
    result="success"  # or "failed"
)
```

**Log Entry**:
```json
{
  "timestamp": 1730800000.123,
  "user_id": "demo",
  "action": "halt_trading",
  "details": {...},
  "result": "success"
}
```

### What Gets Logged

- ✅ All halt/resume trading operations
- ✅ Permission denials
- ✅ Failed actions
- ✅ Configuration changes (if implemented)
- ✅ Tool executions (with redacted secrets)

### Audit Trail Analysis

Logs can be analyzed for:
- Compliance reporting
- Security incident investigation
- User activity monitoring
- System debugging

---

## 6. Feature Flag Isolation

### Complete Isolation When Disabled

```python
if not config["FEATURE_RISK_CHAT"]:
    raise HTTPException(404, "Risk chat feature is not enabled")
```

**Guarantees**:
- ✅ No endpoints exposed when flag is off
- ✅ No database connections created
- ✅ No API keys validated
- ✅ Zero performance overhead

### Gradual Rollout

Feature flag enables safe rollout:
1. Deploy code with flag OFF
2. Test in staging with flag ON
3. Enable for beta users
4. Full rollout

---

## 7. API Security

### Input Sanitization

All user inputs are validated via Pydantic models:

```python
class ChatRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    text: str = Field(..., description="User message")
```

Pydantic automatically:
- Type checks
- Rejects invalid data
- Prevents injection attacks

### Rate Limiting (Recommended for Production)

Not implemented in demo, but recommended:

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@router.post("/api/chat", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def chat(request: ChatRequest):
    # Max 10 requests per 60 seconds per user
```

### CORS Configuration

Restricted to known origins:

```python
allow_origins=[
    "http://localhost:5173",  # Vite dev
    "http://localhost:3000",  # Alt dev
]
```

**Production**: Update to include deployed frontend domain

---

## 8. Gemini API Security

### API Key Protection

```python
# NEVER log API keys
api_key = vault("GEMINI_API_KEY")  # From environment only
genai.configure(api_key=api_key)
```

### Content Filtering

Gemini has built-in safety filters:
- Hate speech
- Harassment
- Dangerous content
- Sexually explicit material

### Prompt Injection Defense

System prompt is fixed and cannot be overridden by user:

```python
system = """You are a real-time trading risk assistant..."""

# User input is clearly separated
messages = [{"role": "user", "content": user_text}]
```

---

## 9. Production Hardening Checklist

Before deploying to production:

### Must-Have
- [ ] Replace in-memory confirmation store with Redis (with TTL)
- [ ] Implement database-backed audit logs (not just JSONL)
- [ ] Add rate limiting (per user, per IP)
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set up secret rotation for API keys
- [ ] Configure logging to SIEM system
- [ ] Add request/response validation middleware
- [ ] Implement session management with JWT

### Recommended
- [ ] Add IP whitelisting for admin actions
- [ ] Implement 2FA for ADMIN role
- [ ] Set up anomaly detection on audit logs
- [ ] Add health checks for external services
- [ ] Configure request timeouts (prevent hanging)
- [ ] Add circuit breakers for external APIs
- [ ] Set up monitoring/alerting (Datadog, Sentry)
- [ ] Implement backup/disaster recovery

### Nice-to-Have
- [ ] Add honeypot endpoints for intrusion detection
- [ ] Implement request signing for API calls
- [ ] Add geofencing (restrict by location)
- [ ] Set up penetration testing schedule
- [ ] Add compliance reporting dashboards

---

## 10. Incident Response

### If API Key is Compromised

1. **Immediate**: Revoke key in Google Cloud Console
2. **Update**: Generate new key
3. **Deploy**: Update `GEMINI_API_KEY` in environment
4. **Audit**: Review logs for unauthorized usage
5. **Notify**: Alert security team

### If Unauthorized Halt Detected

1. **Review**: Check `audit.log` for user_id and timestamp
2. **Resume**: Use `oms.resume_trading()` if halt was malicious
3. **Investigate**: Determine how unauthorized access occurred
4. **Lock**: Disable compromised user account
5. **Patch**: Fix vulnerability that allowed access

### Security Contact

For security issues:
- **Email**: security@yourcompany.com
- **Slack**: #security-incidents
- **On-call**: PagerDuty rotation

---

## 11. Compliance

### Regulatory Considerations

- **SEC Rule 15c3-5**: Market access controls
- **MiFID II**: Transaction reporting
- **GDPR**: User data privacy (if EU users)

**Audit logs support**:
- Demonstrating proper controls
- Investigating trading anomalies
- Regulatory examinations

### Data Retention

- **Audit logs**: Retain for 7 years (regulatory requirement)
- **Chat history**: Retain for 90 days (debugging)
- **Confirmations**: Expire after 5 minutes (security)

---

## 12. Security Testing

### Penetration Testing Scenarios

1. **RBAC Bypass**: Try to execute admin actions as USER
2. **Confirmation Replay**: Reuse expired confirmation IDs
3. **Injection Attacks**: SQL/NoSQL/prompt injection attempts
4. **Authorization Escalation**: Access books not assigned to user
5. **Rate Limit Bypass**: Flood endpoints with requests

### Automated Security Scans

```bash
# Dependency vulnerability scanning
pip-audit

# Static analysis
bandit -r backend/

# Secret scanning
trufflehog filesystem backend/
```

---

## Summary

The Risk Chat system implements defense-in-depth security:

1. **RBAC**: Role and book-level permissions
2. **Guardrails**: Validation and redaction
3. **Confirmations**: Two-step execution for critical actions
4. **Secrets**: Environment-based, never hard-coded
5. **Audit**: Comprehensive logging for all actions
6. **Feature Flags**: Complete isolation when disabled
7. **API Security**: Input validation, CORS, rate limiting (recommended)

**Result**: Only authorized users can execute approved actions on their designated books, with full audit trail.
