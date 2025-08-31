#!/bin/bash

echo "🔐 Testing authentication with your credentials..."

# Step 1: Get JWT token
echo "Getting JWT token from Cognito..."
RESPONSE=$(curl -s -X POST https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "7qqdba5o1co51g0at68hu16d8p",
    "AuthParameters": {
      "USERNAME": "vishal.sukamble@gmail.com",
      "PASSWORD": "Qazwsx1234!@#$"
    }
  }')

echo "Cognito response:"
echo $RESPONSE

# Try to extract token manually
if [[ $RESPONSE == *"AccessToken"* ]]; then
  echo "✅ Authentication successful - AccessToken found in response"
  
  # Extract token (simple method)
  ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"AccessToken":"[^"]*' | cut -d'"' -f4)
  echo "Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
  
  # Step 2: Test /list endpoint
  echo ""
  echo "Testing /list endpoint with token..."
  curl -v -X GET "https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN"
  
else
  echo "❌ Authentication failed"
  echo "Check if user needs to be confirmed or if credentials are correct"
fi
