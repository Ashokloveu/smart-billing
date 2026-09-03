# Production Deployment & Blue-Green Operations Guide

**System:** Smart Billing ERP  
**Architecture:** Zero-Downtime Blue-Green Container Deployment  
**Version:** 1.0.0

---

## 1. Blue-Green Deployment Architecture

The production environment maintains two isolated container stacks behind an Nginx reverse proxy:
- **Blue Stack**: Serves live customer traffic (Port 5000).
- **Green Stack**: Receives new deployments and runs health assertions before taking traffic (Port 5001).

```text
               Internet HTTPS:443
                       │
                       ▼
          [ Nginx Reverse Proxy / TLS ]
           ├── Upstream: active_color (Blue:5000)
           └── Idle: standby_color (Green:5001)
```

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Pre-Flight Environment Validation
Run the environment validation script to assert all production secrets and database strings meet security requirements:
```bash
npx tsx scripts/validate_env.ts
```

### Step 2: Deploy to Green Stack
Build and launch the new version in the idle Green environment:
```bash
docker-compose -f docker/docker-compose.blue-green.yml up -d --build backend-green
```

### Step 3: Run Health & Dependency Checks
Verify that the Green stack has connected to MongoDB and passes readiness probes:
```bash
curl -f http://localhost:5001/readyz
```
Expected response:
```json
{
  "status": "ready",
  "database": "connected",
  "uptime": 12.4
}
```

### Step 4: Switch Nginx Traffic
Update the Nginx upstream link and reload configuration with zero dropped connections:
```bash
# Point upstream to Green
sed -i 's/backend-blue:5000/backend-green:5001/g' /etc/nginx/conf.d/app.conf
nginx -s reload
```

### Step 5: Post-Deployment Monitoring
Monitor 5xx error rates and latency on the operational dashboard. After 15 minutes of stable operation, terminate the legacy Blue stack.

---

## 3. Instant Rollback Procedure (< 60 Seconds)

If the Green deployment exhibits unexpected errors or latency spikes post-switchover:

1. **Re-point Nginx Upstream to Blue**:
   ```bash
   sed -i 's/backend-green:5001/backend-blue:5000/g' /etc/nginx/conf.d/app.conf
   nginx -s reload
   ```
2. **Confirm Traffic Recovery**:
   ```bash
   curl -f http://localhost:5000/readyz
   ```
3. **Log Incident & Drain Green Stack**:
   ```bash
   docker-compose -f docker/docker-compose.blue-green.yml stop backend-green
   ```
