import React, { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';

interface TokenInfo {
  token: string;
  payload: any;
  header: any;
}

const TokenDebugger: React.FC = () => {
  const [idTokenInfo, setIdTokenInfo] = useState<TokenInfo | null>(null);
  const [accessTokenInfo, setAccessTokenInfo] = useState<TokenInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const decodeToken = (token: string): { header: any; payload: any } => {
    try {
      const parts = token.split('.');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      return { header, payload };
    } catch (e) {
      throw new Error('Failed to decode token');
    }
  };

  const testApiCall = async (token: string) => {
    try {
      const response = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        body: response.status === 200 ? await response.json() : await response.text()
      };
    } catch (e) {
      return {
        status: 0,
        statusText: 'Network Error',
        body: (e as Error).message
      };
    }
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Get session with tokens
        const session = await fetchAuthSession();
        
        if (session?.tokens?.idToken) {
          const idToken = session.tokens.idToken.toString();
          const { header, payload } = decodeToken(idToken);
          setIdTokenInfo({ token: idToken, header, payload });
        }

        if (session?.tokens?.accessToken) {
          const accessToken = session.tokens.accessToken.toString();
          const { header, payload } = decodeToken(accessToken);
          setAccessTokenInfo({ token: accessToken, header, payload });
        }

      } catch (err: any) {
        setError(err.message);
      }
    };

    loadTokens();
  }, []);

  const [apiTestResult, setApiTestResult] = useState<any>(null);

  const handleTestApi = async (tokenType: 'id' | 'access') => {
    const token = tokenType === 'id' ? idTokenInfo?.token : accessTokenInfo?.token;
    if (!token) return;

    const result = await testApiCall(token);
    setApiTestResult({ tokenType, ...result });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Token Debugger</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {user && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ User authenticated: {user.username}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ID Token */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">🆔 ID Token</h2>
          {idTokenInfo ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Header:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(idTokenInfo.header, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium">Payload:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(idTokenInfo.payload, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium">Key Fields:</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>token_use:</strong> {idTokenInfo.payload.token_use}</li>
                  <li><strong>scope:</strong> {idTokenInfo.payload.scope || 'undefined'}</li>
                  <li><strong>aud:</strong> {idTokenInfo.payload.aud}</li>
                  <li><strong>iss:</strong> {idTokenInfo.payload.iss}</li>
                  <li><strong>exp:</strong> {new Date(idTokenInfo.payload.exp * 1000).toLocaleString()}</li>
                </ul>
              </div>
              <button
                onClick={() => handleTestApi('id')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Test API with ID Token
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No ID token available</p>
          )}
        </div>

        {/* Access Token */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">🔑 Access Token</h2>
          {accessTokenInfo ? (
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Header:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(accessTokenInfo.header, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium">Payload:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(accessTokenInfo.payload, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium">Key Fields:</h3>
                <ul className="text-sm space-y-1">
                  <li><strong>token_use:</strong> {accessTokenInfo.payload.token_use}</li>
                  <li><strong>scope:</strong> {accessTokenInfo.payload.scope || 'undefined'}</li>
                  <li><strong>aud:</strong> {accessTokenInfo.payload.aud}</li>
                  <li><strong>iss:</strong> {accessTokenInfo.payload.iss}</li>
                  <li><strong>exp:</strong> {new Date(accessTokenInfo.payload.exp * 1000).toLocaleString()}</li>
                </ul>
              </div>
              <button
                onClick={() => handleTestApi('access')}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Test API with Access Token
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No access token available</p>
          )}
        </div>
      </div>

      {/* API Test Results */}
      {apiTestResult && (
        <div className="mt-6 bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">🧪 API Test Result</h2>
          <div className="space-y-2">
            <p><strong>Token Type:</strong> {apiTestResult.tokenType}</p>
            <p><strong>Status:</strong> {apiTestResult.status} {apiTestResult.statusText}</p>
            <div>
              <strong>Response:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                {typeof apiTestResult.body === 'string' 
                  ? apiTestResult.body 
                  : JSON.stringify(apiTestResult.body, null, 2)}
              </pre>
            </div>
            {apiTestResult.status === 200 && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                🎉 Success! The {apiTestResult.tokenType} token works with the API!
              </div>
            )}
            {apiTestResult.status === 401 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                ❌ Unauthorized. The {apiTestResult.tokenType} token is not accepted by the API.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
