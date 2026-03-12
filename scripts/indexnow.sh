#!/bin/bash
# IndexNow submission script for lucaberton.com
# Usage: ./scripts/indexnow.sh [url1] [url2] ...
# If no URLs given, submits all blog posts from sitemap

HOST="lucaberton.com"
KEY="ce29c05385d649b690e22576d20cde14"
ENDPOINT="https://api.indexnow.org/indexnow"

if [ $# -gt 0 ]; then
  # Submit specific URLs
  URLS_JSON=$(printf '%s\n' "$@" | jq -R . | jq -s .)
else
  # Submit all blog URLs from sitemap
  echo "Fetching sitemap..."
  URLS_JSON=$(curl -s "https://lucaberton.com/sitemap-0.xml" | \
    grep -oP '<loc>\K[^<]+' | \
    grep '/blog/' | \
    head -100 | \
    jq -R . | jq -s .)
fi

URL_COUNT=$(echo "$URLS_JSON" | jq length)
echo "Submitting $URL_COUNT URLs to IndexNow..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"$HOST\",
    \"key\": \"$KEY\",
    \"keyLocation\": \"https://$HOST/$KEY.txt\",
    \"urlList\": $URLS_JSON
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "Success! URLs submitted to IndexNow."
else
  echo "Response: $BODY"
fi
