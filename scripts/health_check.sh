#!/bin/bash
# Health Check Monitoring Script for Sempoa SIP TC Pariaman

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

API_HEALTH_URL="http://localhost:8000/api/ping"
STATUS_CODE=$(curl -s -H "X-API-Key: ${ESP32_API_KEY}" -o /dev/null -w "%{http_code}" "${API_HEALTH_URL}")

echo "[$(date)] Checking backend health at ${API_HEALTH_URL}..."

if [ "${STATUS_CODE}" -eq 200 ]; then
  echo "SUCCESS: Backend server is healthy! HTTP Status: ${STATUS_CODE}"
  exit 0
else
  echo "CRITICAL WARNING: Backend is unresponsive or returning an error! HTTP Status: ${STATUS_CODE}"
  # Place alert logic here (e.g., Slack webhook, email alert, etc.)
  exit 1
fi
