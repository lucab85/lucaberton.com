#!/bin/bash
# IndexNow submission script for lucaberton.com
# Submits sitemap URLs to search engines via IndexNow protocol

INDEXNOW_KEY="ac6bded46004d1b1c6db06774d21d7bd"
SITE_URL="https://lucaberton.com"
KEY_LOCATION="${SITE_URL}/${INDEXNOW_KEY}.txt"

# Extract URLs from sitemap (macOS compatible)
echo "📡 Extracting URLs from sitemap..."
URLS=$(grep -o '<loc>[^<]*</loc>' public/sitemap-0.xml | sed 's/<loc>//g;s/<\/loc>//g' | head -100)

# Count URLs
URL_COUNT=$(echo "$URLS" | wc -l | tr -d ' ')
echo "📊 Found ${URL_COUNT} URLs to submit"

# Build JSON array of URLs
URL_JSON=$(echo "$URLS" | while read url; do echo "\"$url\""; done | paste -sd ',' -)

JSON_PAYLOAD=$(cat <<EOF
{
  "host": "lucaberton.com",
  "key": "${INDEXNOW_KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": [${URL_JSON}]
}
EOF
)

# Submit to IndexNow (Bing endpoint)
echo "🚀 Submitting to IndexNow (Bing)..."
RESPONSE=$(curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$JSON_PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "202" ]; then
  echo "✅ Successfully submitted ${URL_COUNT} URLs to IndexNow"
else
  echo "❌ Failed with HTTP ${HTTP_STATUS}"
  echo "$BODY"
fi
