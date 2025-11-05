# 📊 Data Latency Alert Investigation - Added!

## ✅ What Was Added

I've successfully added a comprehensive **Data Latency Alert Investigation** runbook to your AI Risk Operations Assistant!

## 🎯 How to Use It

Your chatbot now recognizes these queries:

### Query Format 1: Direct Playbook Request
```
"Playbook for data latency"
"data latency playbook"
"data latency alert"
```

### Query Format 2: Investigation Steps Request
```
"Walk me through steps to investigate a data latency alert"
"How do I investigate a data latency issue?"
"Steps to handle data latency"
```

## 📝 What the Runbook Includes

### **Scenario Details**
- **Title**: Data Latency Alert Investigation
- **Severity**: HIGH
- **Description**: Market data feed or internal data pipeline experiencing delays that could impact trading decisions, risk calculations, or compliance reporting

### **9-Step Investigation Process**

1. **CHECK INGESTION PIPELINE**: Verify data ingestion pipeline timestamps (Kafka/Kinesis topics, message queues)

2. **VERIFY HEARTBEAT**: Check latest feed heartbeat in monitoring dashboard - confirm last successful update time

3. **COMPARE LAG**: Compare upstream vs. downstream lag to identify bottleneck location (source, network, processing, or storage)

4. **ASSESS IMPACT**: Determine which systems/strategies are affected - risk calculations, trading algos, compliance reports

5. **RESTART IF NEEDED**: If lag exceeds 60 seconds, initiate data source restart or resync procedure

6. **FALLBACK DATA**: Switch to backup data feed or alternative source if primary feed remains degraded >5 minutes

7. **HALT DEPENDENT TRADING**: Suspend automated trading strategies that depend on affected data feed

8. **NOTIFY OPS**: Alert operations channel with affected systems, estimated resolution time, and workaround status

9. **DOCUMENT**: Log incident details, root cause, resolution steps, and data gaps for audit trail

### **Escalation Path**
- Data Operations Team
- Platform Engineering
- Risk Manager (if risk calculations affected)

### **Tools Required**
- Data pipeline monitoring dashboard
- Feed heartbeat monitor
- Kafka/Kinesis lag metrics
- Network latency analyzer

### **SLA Targets**
- **Initial triage**: Within 2 minutes
- **Resolution or fallback**: Within 10 minutes

### **Alert Thresholds**
- **Warning**: Lag > 15 seconds
- **Critical**: Lag > 60 seconds or data gap > 5 minutes
- **Emergency**: Complete feed outage or lag > 5 minutes with no fallback

## 🚀 Example Usage

### User Query:
```
"Walk me through steps to investigate a data latency alert"
```

### AI Response:
```
Okay, I can summarize the steps to investigate a data latency alert based on the runbook I retrieved:

**Data Latency Alert Investigation**

This runbook is for when market data feeds or internal data pipelines are experiencing delays,
which can impact trading decisions, risk calculations, or compliance.

**Key Steps:**

1. CHECK INGESTION PIPELINE: Verify data pipeline timestamps
2. VERIFY HEARTBEAT: Check latest feed heartbeat in monitoring dashboard
3. COMPARE LAG: Identify bottleneck location
4. ASSESS IMPACT: Determine affected systems/strategies
5. RESTART IF NEEDED: If lag exceeds 60 seconds, restart data source
6. FALLBACK DATA: Switch to backup feed if degraded >5 minutes
7. HALT DEPENDENT TRADING: Suspend strategies depending on affected feed
8. NOTIFY OPS: Alert operations channel with status
9. DOCUMENT: Log incident details for audit trail

**Escalation:** Data Operations Team, Platform Engineering, Risk Manager

**SLA:** Initial triage within 2 minutes, resolution within 10 minutes

**Thresholds:**
• Warning: Lag > 15 seconds
• Critical: Lag > 60 seconds
• Emergency: Complete feed outage
```

## 📂 Files Modified

### Backend
- **backend/services/runbooks.py** - Added `_data_latency_runbook()` function
  - Added to runbooks dictionary with keys: "data latency" and "data latency alert"
  - Added to `list_runbooks()` function

### Backend Routes
- **backend/routers/chat.py** - Updated system prompt
  - Added guidance to use get_runbook for "walk me through" queries
  - Mentioned data latency as an available runbook scenario

### Frontend
- **frontend/src/routes/RiskChat.tsx** - Updated welcome message
  - Added data latency example to operational playbooks section
  - Added example query to suggested questions

## 🎉 Result

Your AI chatbot can now:
✅ Respond to data latency investigation requests
✅ Provide comprehensive step-by-step procedures
✅ Include escalation paths and SLA targets
✅ Display formatted responses with clear sections
✅ Handle multiple query variations naturally

## 📊 Available Runbooks

Your chatbot now has **5 operational runbooks**:

1. **Order-Flow Anomaly** - Unexpected trading patterns
2. **VaR Breach** - Value-at-Risk limit violations
3. **Concentration Risk** - Position concentration issues
4. **Market Dislocation** - Extreme market conditions
5. **Data Latency** - Data feed delays ← **NEW!**

Each runbook includes:
- Detailed step-by-step procedures
- Escalation paths
- Required tools
- SLA targets
- Severity levels
- Thresholds and criteria

Try it out in your chatbot at http://localhost:5174! 🚀
