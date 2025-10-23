import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAuthSession } from '@aws-amplify/auth';

const AuthDebugTool: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { user, getOAuthToken, getJwtToken } = useAuth();

  const runAuthDiagnosis = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting authentication diagnosis...');
      
      const info: any = {
        timestamp: new Date().toISOString(),
        user: !!user,
        userDetails: user ? {
          userId: user.userId,
          username: user.username,
          email: user.email
        } : null,
      };

      // Check Amplify session
      try {
        const session = await fetchAuthSession();
        info.amplifySession = {
          hasTokens: !!session.tokens,
          hasIdToken: !!session.tokens?.idToken,
          hasAccessToken: !!session.tokens?.accessToken,
        };

        if (session.tokens?.idToken) {
          const idToken = session.tokens.idToken.toString();
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            info.idToken = {
              length: idToken.length,
              preview: idToken.substring(0, 50) + '...',
              payload: {
                aud: payload.aud,
                iss: payload.iss,
                token_use: payload.token_use,
                client_id: payload.client_id,
                scope: payload.scope,
                exp: payload.exp,
                isExpired: payload.exp < now,
                timeToExpiry: payload.exp - now,
                username: payload['cognito:username'],
                email: payload.email
              },
              fullToken: idToken // For testing
            };
          } catch (e) {
            info.idToken = { error: 'Could not decode ID token' };
          }
        }

        if (session.tokens?.accessToken) {
          const accessToken = session.tokens.accessToken.toString();
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            info.accessToken = {
              length: accessToken.length,
              preview: accessToken.substring(0, 50) + '...',
              payload: {
                aud: payload.aud,
                iss: payload.iss,
                token_use: payload.token_use,
                client_id: payload.client_id,
                scope: payload.scope,
                exp: payload.exp,
                isExpired: payload.exp < now,
                timeToExpiry: payload.exp - now,
                username: payload.username
              },
              fullToken: accessToken // For testing
            };
          } catch (e) {
            info.accessToken = { error: 'Could not decode access token' };
          }
        }

      } catch (error) {
        info.amplifySession = { error: error.message };
      }

      // Check our auth methods
      try {
        const oauthToken = await getOAuthToken();
        info.getOAuthToken = {
          hasToken: !!oauthToken,
          tokenLength: oauthToken?.length || 0,
          tokenPreview: oauthToken ? oauthToken.substring(0, 50) + '...' : null
        };
      } catch (error) {
        info.getOAuthToken = { error: error.message };
      }

      try {
        const jwtToken = await getJwtToken();
        info.getJwtToken = {
          hasToken: !!jwtToken,
          tokenLength: jwtToken?.length || 0,
          tokenPreview: jwtToken ? jwtToken.substring(0, 50) + '...' : null
        };
      } catch (error) {
        info.getJwtToken = { error: error.message };
      }

      // Check localStorage (used by old apiService)
      info.localStorage = {
        id_token: !!localStorage.getItem('id_token'),
        access_token: !!localStorage.getItem('access_token')
      };

      // Check environment variables
      info.envVars = {
        VITE_COGNITO_USER_POOL_ID: !!(import.meta.env as any).VITE_COGNITO_USER_POOL_ID,
        VITE_COGNITO_USER_POOL_CLIENT_ID: !!(import.meta.env as any).VITE_COGNITO_USER_POOL_CLIENT_ID,
        VITE_COGNITO_IDENTITY_POOL_ID: !!(import.meta.env as any).VITE_COGNITO_IDENTITY_POOL_ID,
        VITE_AWS_REGION: !!(import.meta.env as any).VITE_AWS_REGION,
        VITE_API_KEY: !!(import.meta.env as any).VITE_API_KEY,
        actualValues: {
          userPoolId: (import.meta.env as any).VITE_COGNITO_USER_POOL_ID,
          clientId: (import.meta.env as any).VITE_COGNITO_USER_POOL_CLIENT_ID,
          region: (import.meta.env as any).VITE_AWS_REGION
        }
      };

      setDebugInfo(info);
      console.log('🔍 Authentication diagnosis complete:', info);
      
    } catch (error) {
      console.error('❌ Auth diagnosis failed:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, getOAuthToken, getJwtToken]);

  const testApiCall = useCallback(async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const token = await getOAuthToken();
      if (!token) {
        setTestResult({ error: 'No token available for API call' });
        return;
      }

      console.log('🧪 Testing API call with token...');
      
      const response = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      setTestResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        tokenUsed: {
          preview: token.substring(0, 50) + '...',
          length: token.length
        }
      });

      if (!response.ok) {
        console.error('❌ API test failed:', response.status, response.statusText);
        console.error('❌ Response:', responseData);
      } else {
        console.log('✅ API test succeeded:', responseData);
      }
      
    } catch (error) {
      console.error('❌ API test error:', error);
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  }, [getOAuthToken]);

  const copyTokenToClipboard = useCallback((tokenType: string) => {
    if (debugInfo) {
      const token = debugInfo[tokenType]?.fullToken;
      if (token) {
        navigator.clipboard.writeText(token);
        alert(`${tokenType} copied to clipboard!`);
      }
    }
  }, [debugInfo]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-red-600 text-white p-4">
          <h1 className="text-xl font-bold">🚨 Auth Debug Tool - 401 Error Diagnosis</h1>
          <p className="text-red-100 mt-1">Diagnose authentication issues with your API calls</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={runAuthDiagnosis}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Diagnosing...' : '🔍 Run Auth Diagnosis'}
            </button>
            
            <button
              onClick={testApiCall}
              disabled={loading || !debugInfo}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '🧪 Testing...' : '🧪 Test API Call'}
            </button>
          </div>

          {debugInfo && (
            <div className="space-y-6">
              {/* User Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">👤 User Status</h3>
                <div className="text-sm">
                  <p><strong>Authenticated:</strong> {debugInfo.user ? '✅ Yes' : '❌ No'}</p>
                  {debugInfo.userDetails && (
                    <div className="mt-2">
                      <p><strong>User ID:</strong> {debugInfo.userDetails.userId}</p>
                      <p><strong>Username:</strong> {debugInfo.userDetails.username}</p>
                      <p><strong>Email:</strong> {debugInfo.userDetails.email || 'Not available'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">🎫 Token Status</h3>
                
                {debugInfo.idToken && (
                  <div className="mb-4 p-3 bg-blue-50 rounded border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-800">ID Token</h4>
                      <button
                        onClick={() => copyTokenToClipboard('idToken')}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Copy Token
                      </button>
                    </div>
                    {debugInfo.idToken.payload ? (
                      <div className="text-xs mt-2 space-y-1">
                        <p><strong>Audience:</strong> {debugInfo.idToken.payload.aud}</p>
                        <p><strong>Client ID:</strong> {debugInfo.idToken.payload.client_id}</p>
                        <p><strong>Token Use:</strong> {debugInfo.idToken.payload.token_use}</p>
                        <p><strong>Scope:</strong> {debugInfo.idToken.payload.scope}</p>
                        <p><strong>Expired:</strong> {debugInfo.idToken.payload.isExpired ? '❌ YES' : '✅ NO'}</p>
                        <p><strong>Time to expiry:</strong> {Math.floor(debugInfo.idToken.payload.timeToExpiry / 60)} minutes</p>
                      </div>
                    ) : (
                      <p className="text-red-600 text-xs mt-2">❌ Could not decode token</p>
                    )}
                  </div>
                )}

                {debugInfo.accessToken && (
                  <div className="mb-4 p-3 bg-green-50 rounded border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-green-800">Access Token</h4>
                      <button
                        onClick={() => copyTokenToClipboard('accessToken')}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Copy Token
                      </button>
                    </div>
                    {debugInfo.accessToken.payload ? (
                      <div className="text-xs mt-2 space-y-1">
                        <p><strong>Audience:</strong> {debugInfo.accessToken.payload.aud}</p>
                        <p><strong>Client ID:</strong> {debugInfo.accessToken.payload.client_id}</p>
                        <p><strong>Token Use:</strong> {debugInfo.accessToken.payload.token_use}</p>
                        <p><strong>Scope:</strong> {debugInfo.accessToken.payload.scope}</p>
                        <p><strong>Expired:</strong> {debugInfo.accessToken.payload.isExpired ? '❌ YES' : '✅ NO'}</p>
                        <p><strong>Time to expiry:</strong> {Math.floor(debugInfo.accessToken.payload.timeToExpiry / 60)} minutes</p>
                      </div>
                    ) : (
                      <p className="text-red-600 text-xs mt-2">❌ Could not decode token</p>
                    )}
                  </div>
                )}
              </div>

              {/* Environment Variables */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">⚙️ Configuration</h3>
                <div className="text-xs space-y-1">
                  <p><strong>User Pool ID:</strong> {debugInfo.envVars.actualValues.userPoolId || '❌ Missing'}</p>
                  <p><strong>Client ID:</strong> {debugInfo.envVars.actualValues.clientId || '❌ Missing'}</p>
                  <p><strong>Region:</strong> {debugInfo.envVars.actualValues.region || '❌ Missing'}</p>
                </div>
              </div>

              {/* API Test Result */}
              {testResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">🧪 API Test Result</h3>
                  <div className={`p-3 rounded border ${testResult.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p><strong>Status:</strong> {testResult.status} {testResult.statusText}</p>
                    <p><strong>Success:</strong> {testResult.ok ? '✅ YES' : '❌ NO'}</p>
                    {testResult.error && (
                      <p className="text-red-600"><strong>Error:</strong> {testResult.error}</p>
                    )}
                    {testResult.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Response Data</summary>
                        <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-x-auto max-h-40">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Debug Data */}
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer">🔍 Raw Debug Data</summary>
                <pre className="text-xs mt-2 bg-gray-100 p-3 rounded overflow-x-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {!debugInfo && !loading && (
            <div className="text-center text-gray-500 py-8">
              <p>Click "Run Auth Diagnosis" to analyze your authentication status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugTool;
