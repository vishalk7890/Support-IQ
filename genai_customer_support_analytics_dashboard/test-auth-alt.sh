#!/bin/bash

echo "🔐 Testing different authentication methods..."

# Method 1: Try USER_SRP_AUTH (more common)
echo "Method 1: Trying USER_SRP_AUTH..."
RESPONSE1=$(curl -s -X POST https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_SRP_AUTH",
    "ClientId": "7qqdba5o1co51g0at68hu16d8p",
    "AuthParameters": {
      "USERNAME": "vishal.sukamble@gmail.com"
    }
  }')

echo "USER_SRP_AUTH Response:"
echo $RESPONSE1

echo ""
echo "Method 2: Trying ALLOW_USER_PASSWORD_AUTH..."
RESPONSE2=$(curl -s -X POST https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "ALLOW_USER_PASSWORD_AUTH",
    "ClientId": "7qqdba5o1co51g0at68hu16d8p",
    "AuthParameters": {
      "USERNAME": "vishal.sukamble@gmail.com",
      "PASSWORD": "Qazwsx1234!@#$"
    }
  }')

echo "ALLOW_USER_PASSWORD_AUTH Response:"
echo $RESPONSE2

echo ""
echo "Method 3: Trying without specifying auth flow..."
RESPONSE3=$(curl -s -X POST https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "ClientId": "7qqdba5o1co51g0at68hu16d8p",
    "AuthParameters": {
      "USERNAME": "vishal.sukamble@gmail.com",
      "PASSWORD": "Qazwsx1234!@#$"
    }
  }')

echo "Default auth flow Response:"
echo $RESPONSE3

echo ""
echo "💡 Recommendations:"
echo "1. Check AWS Cognito console for enabled auth flows"
echo "2. Try logging in through the web app first to get a token"
echo "3. The easiest way is to login via browser and extract the token"
