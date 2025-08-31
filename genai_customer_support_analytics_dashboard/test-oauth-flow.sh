#!/bin/bash

echo "🔐 Testing OAuth flow to get proper tokens..."

# Step 1: Get OAuth token with proper scope (like the working app)
echo "Step 1: Getting OAuth token with openid scope..."

# OAuth authorization URL (this will redirect to get tokens)
AUTH_URL="https://pca-1755221929659628847.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=7qqdba5o1co51g0at68hu16d8p&response_type=code&scope=openid%20email%20profile%20phone&redirect_uri=http://localhost:5176/oauth/callback"

echo "OAuth URL: $AUTH_URL"
echo ""
echo "⚠️  MANUAL STEP NEEDED:"
echo "1. Open this URL in browser: $AUTH_URL"
echo "2. Login with: vishal.sukamble@gmail.com / Qazwsx1234!@#$"
echo "3. Copy the 'code' from the redirect URL"
echo "4. Paste it here and press Enter:"
read -r AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo "❌ No authorization code provided"
    exit 1
fi

echo "✅ Got authorization code: ${AUTH_CODE:0:20}..."

# Step 2: Exchange code for tokens
echo "Step 2: Exchanging code for tokens..."

TOKEN_RESPONSE=$(curl -s -X POST "https://pca-1755221929659628847.auth.us-east-1.amazoncognito.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=7qqdba5o1co51g0at68hu16d8p&code=$AUTH_CODE&redirect_uri=http://localhost:5176/oauth/callback")

echo "Token response:"
echo "$TOKEN_RESPONSE" | jq .

# Extract access token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "❌ Failed to get access token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Got access token: ${ACCESS_TOKEN:0:50}..."

# Step 3: Decode and analyze token
echo "Step 3: Analyzing token..."
TOKEN_PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2)
# Add padding if needed
while [ $((${#TOKEN_PAYLOAD} % 4)) -ne 0 ]; do
    TOKEN_PAYLOAD="${TOKEN_PAYLOAD}="
done

DECODED_PAYLOAD=$(echo "$TOKEN_PAYLOAD" | base64 -d 2>/dev/null)
echo "Token payload:"
echo "$DECODED_PAYLOAD" | jq .

# Step 4: Test /list API with this token
echo "Step 4: Testing /list API with OAuth token..."

API_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    "https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list" \
    -H "Content-Type: application/json" \
    -H "Authorization: $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$API_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
HTTP_BODY=$(echo "$API_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "API Response Status: $HTTP_STATUS"
echo "API Response Body: $HTTP_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "🎉 SUCCESS! OAuth token works with /list API"
    echo "✅ Token scope includes proper openid scope"
else
    echo "❌ Still getting $HTTP_STATUS error"
    echo "Token might still be missing proper scope or configuration"
fi
