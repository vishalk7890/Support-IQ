# JWT Token Alignment Guide

## 🎯 Overview

Your custom UI and Hosted UI now both use OAuth2 Authorization Code Flow with PKCE to generate equivalent JWT tokens. This ensures both authentication methods produce tokens with the same claims, scopes, and validation properties.

## ✅ What Was Fixed

### 1. **Same App Client Configuration**
- Both flows now use the same App Client ID: `7qqdba5o1co51g0at68hu16d8p`
- Same Cognito User Pool ID: `us-east-1_kmixUr4yq`

### 2. **OAuth2 Authorization Code Flow with PKCE**
- Your custom UI now uses `signInWithRedirect()` instead of `AdminInitiateAuth`
- This matches exactly what the Hosted UI does under the hood
- PKCE is automatically enabled for SPAs (Single Page Applications)

### 3. **Aligned OAuth Scopes**
- Both flows request: `openid`, `email`, `profile`
- Removed `phone` scope to match standard OIDC practice

### 4. **Proper Token Usage**
- API client now uses `Bearer` token format: `Authorization: Bearer <token>`
- Prefers ID tokens for Cognito User Pool authorizers (better alignment)
- Falls back to access tokens if needed

### 5. **Redirect URIs**
- Both flows use the same redirect URI: `http://localhost:5173/oauth/callback`
- Proper callback handling with `/oauth/callback` route

## 🛠️ JWT Token Alignment Tool

Access the diagnostic tool at: **http://localhost:5173/debug/jwt**

### Features:

#### **Token Input**
- Paste tokens from both Hosted UI and Custom UI
- Auto-fetch current session token
- Secure token masking with show/hide toggle

#### **Token Analysis**
- Decode JWT headers and payloads
- View all token claims and metadata
- Easy copy-to-clipboard functionality

#### **Token Comparison**
- Side-by-side comparison of critical claims
- Highlight mismatches and missing claims
- Status indicators (✅ Match, ❌ Mismatch, ⚠️ Missing)

#### **Troubleshooting Guide**
- Automated issue detection
- Priority-based fix recommendations
- Step-by-step alignment instructions

### Critical Claims Monitored:

| Claim | Description | Expected Behavior |
|-------|-------------|-------------------|
| `aud` | Audience | Should match your App Client ID |
| `iss` | Issuer | Should be the same Cognito User Pool |
| `token_use` | Token type | Should be "id" for ID tokens |
| `scope` | OAuth scopes | Should include "openid email profile" |
| `sub` | Subject | Unique user identifier |
| `email` | User email | Should be consistent |
| `cognito:username` | Username | Should match between flows |

## 🚀 How to Test Alignment

### Step 1: Get Hosted UI Token
1. Navigate to `/debug/jwt`
2. Click "Get via Hosted UI" button
3. Complete OAuth flow
4. Token will be captured automatically

### Step 2: Get Custom UI Token
1. In the same page, click "Get Current Token"
2. Or enable "Auto-fetch" to get it automatically
3. Compare with Hosted UI token

### Step 3: Analyze Differences
1. Go to "Comparison" tab
2. Review any mismatches or missing claims
3. Check "Troubleshoot" tab for specific fix recommendations

## 🔧 Common Issues & Fixes

### Issue: `aud` (Audience) Mismatch
**Cause**: Different App Client IDs being used
**Fix**: Ensure both flows use the same `VITE_COGNITO_USER_POOL_CLIENT_ID`

### Issue: Missing `scope` Claim
**Cause**: Using `AdminInitiateAuth` instead of OAuth flow
**Fix**: ✅ Already fixed - now uses `signInWithRedirect()`

### Issue: Missing User Claims (email, name)
**Cause**: Not using proper OAuth redirect flow
**Fix**: ✅ Already fixed - proper redirect URIs configured

### Issue: Different Token Types
**Cause**: Mixing ID tokens and Access tokens
**Fix**: ✅ Already fixed - consistent token preference

## 📋 Verification Checklist

- [x] **Same App Client**: Both flows use identical client configuration
- [x] **OAuth2 + PKCE**: Custom UI uses Authorization Code Flow with PKCE
- [x] **Matching Scopes**: Both request `openid`, `email`, `profile`
- [x] **Redirect URIs**: Proper callback handling configured
- [x] **Bearer Format**: API calls use `Authorization: Bearer <token>`
- [x] **Token Claims**: ID tokens contain all expected OIDC claims

## 🎉 Expected Results

After these changes, both your Hosted UI and Custom UI should produce JWT tokens with:

- ✅ **Same audience** (your App Client ID)
- ✅ **Same issuer** (your Cognito User Pool)  
- ✅ **Same scopes** (`openid email profile`)
- ✅ **Same user claims** (email, name, sub, etc.)
- ✅ **Same token format** (JWT with proper OIDC claims)
- ✅ **Same API compatibility** (works with your Cognito authorizers)

## 🔍 Advanced Validation

For deeper token analysis, you can also:

1. Copy tokens from the alignment tool
2. Paste them at [jwt.io](https://jwt.io) for detailed inspection
3. Compare the decoded JSON side-by-side
4. Verify signature validation (use your Cognito public keys)

## 🚨 Security Notes

- The JWT alignment tool runs entirely in your browser
- No tokens are transmitted to external servers
- Tokens are masked by default in the UI
- Use this tool only in development environments
- Never share JWT tokens in production logs or screenshots

---

**Next Steps**: Run your app, test both authentication flows, and use the alignment tool to verify they produce equivalent tokens!
