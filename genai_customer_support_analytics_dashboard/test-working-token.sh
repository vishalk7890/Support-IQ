#!/bin/bash

echo "🔐 Getting token exactly like the working CloudFront app..."

# The working CloudFront app appears to use OAuth flow to get tokens with proper scope
# Let's try the OAuth implicit flow (response_type=token) to get tokens directly

echo "Step 1: Getting OAuth tokens with implicit flow..."

# Build the OAuth URL (implicit flow like working app might use)
OAUTH_URL="https://pca-1755221929659628847.auth.us-east-1.amazoncognito.com/oauth2/authorize"
CLIENT_ID="7qqdba5o1co51g0at68hu16d8p"
REDIRECT_URI="https://d2j3fkoy9hitg.cloudfront.net/"  # Use working app's domain
SCOPE="openid email profile phone"  # Match working app scope

FULL_URL="${OAUTH_URL}?client_id=${CLIENT_ID}&response_type=token&scope=${SCOPE// /%20}&redirect_uri=${REDIRECT_URI}"

echo "🌐 OAuth URL (implicit flow):"
echo "$FULL_URL"
echo ""
echo "📋 INSTRUCTIONS:"
echo "1. Open the URL above in your browser"
echo "2. Login with your credentials"
echo "3. After redirect, you'll see a URL with #access_token=..."
echo "4. Copy the access_token value (the long JWT between #access_token= and &token_type)"
echo "5. Paste the access token here:"

read -r ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token provided"
    exit 1
fi

# Clean up token (remove any extra parameters)
ACCESS_TOKEN=$(echo "$ACCESS_TOKEN" | sed 's/&.*//')

echo "✅ Got token: ${ACCESS_TOKEN:0:50}..."

# Decode and analyze the token
echo ""
echo "🔍 Analyzing token..."
TOKEN_PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2)

# Add padding if needed for base64 decoding
while [ $((${#TOKEN_PAYLOAD} % 4)) -ne 0 ]; do
    TOKEN_PAYLOAD="${TOKEN_PAYLOAD}="
done

echo "Token payload:"
if command -v jq > /dev/null 2>&1; then
    echo "$TOKEN_PAYLOAD" | base64 -d 2>/dev/null | jq .
else
    echo "$TOKEN_PAYLOAD" | base64 -d 2>/dev/null
fi

echo ""
echo "🚀 Testing /list API with this token (NO Bearer prefix, like working app)..."

# Test the API exactly like the working app (no Bearer prefix)
API_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    "https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list" \
    -H "Content-Type: application/json" \
    -H "Authorization: $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$API_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
HTTP_BODY=$(echo "$API_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "📥 API Response Status: $HTTP_STATUS"
echo "📥 API Response Body:"
if command -v jq > /dev/null 2>&1 && echo "$HTTP_BODY" | jq . > /dev/null 2>&1; then
    echo "$HTTP_BODY" | jq .
else
    echo "$HTTP_BODY"
fi

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo ""
    echo "🎉 SUCCESS! This proves the OAuth token approach works!"
    echo "✅ Your app needs to use OAuth flow to get tokens with proper scope"
    echo "✅ Use access token with NO Bearer prefix in Authorization header"
else
    echo ""
    echo "❌ Still getting $HTTP_STATUS error"
    if [ "$HTTP_STATUS" -eq 401 ]; then
        echo "🤔 This might mean:"
        echo "   - Token scope is still incorrect"
        echo "   - API Gateway authorizer configuration issue"
        echo "   - Token audience (aud) mismatch"
    fi
fi
