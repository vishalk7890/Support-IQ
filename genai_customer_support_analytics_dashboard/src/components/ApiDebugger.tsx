import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ApiDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getOAuthToken } = useAuth();

  const testApiCall = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      // Get the token exactly like your app does
      console.log('🔍 Getting token...');
      const token = await getOAuthToken();
      
      const debug: any = {
        timestamp: new Date().toISOString(),
        tokenReceived: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 50) + '...' : null,
      };

      if (token) {
        // Decode the token to see what's in it
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          
          debug.tokenPayload = {
            aud: payload.aud,
            iss: payload.iss,
            client_id: payload.client_id,
            token_use: payload.token_use,
            scope: payload.scope,
            exp: payload.exp,
            isExpired: payload.exp < now,
            timeToExpiry: Math.floor((payload.exp - now) / 60) + ' minutes',
            username: payload.username || payload['cognito:username']
          };
        } catch (tokenError) {
          debug.tokenDecodeError = tokenError.message;
        }

        // Make the API call exactly like your app does
        console.log('🔍 Making API call...');
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        debug.requestHeaders = headers;
        debug.requestUrl = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list';

        const response = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
          method: 'GET',
          headers: headers
        });

        debug.responseStatus = response.status;
        debug.responseStatusText = response.statusText;
        debug.responseHeaders = Object.fromEntries(response.headers.entries());

        const responseText = await response.text();
        debug.responseBody = responseText;

        try {
          debug.responseJson = JSON.parse(responseText);
        } catch {
          // Response is not JSON
        }

        if (response.ok) {
          console.log('✅ API call succeeded!');
          debug.success = true;
        } else {
          console.error('❌ API call failed:', response.status, responseText);
          debug.success = false;
        }
      } else {
        debug.error = 'No token available';
      }

      setDebugInfo(debug);

    } catch (error) {
      console.error('❌ Debug error:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithWorkingToken = async () => {
    setLoading(true);
    
    // Use your known working token
    const workingToken = 'eyJraWQiOiJUbGRIWUFqc1ZaYWZcL2VTSEtaMUZwTmo3ckVSRzJWa2piQWZSVHhLeEZTVT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2NDA4NjRhOC02MDExLTcwMzAtNjAyZS05OGNiOWVjYTg4ZWEiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9rbWl4VXI0eXEiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiI3cXFkYmE1bzFjbzUxZzBhdDY4aHUxNmQ4cCIsIm9yaWdpbl9qdGkiOiIzYjlkYjA4OC05MzBlLTRlMjctYTQ5MS1mMDQ1YzRhMTUzOTkiLCJldmVudF9pZCI6IjRhMjdlMzIwLTIyNDMtNGEzOS05OTQ1LTQwZjExYjA1Y2EyYiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoicGhvbmUgb3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3NTc1MTg4MzgsImV4cCI6MTc1NzYwODc5NSwiaWF0IjoxNzU3NjA1MTk1LCJqdGkiOiI5MTBkMzE1NS1iN2M1LTRjNjgtODEyMi1jNjVmODVkMmNiYWMiLCJ1c2VybmFtZSI6InZpc2hhbDc4OTAifQ.EXEyv932iz2m9mdeM2X33ZuEfxbukBN93Hp5AZMe0FqLfIX_eVRlgOecfsgIrOrscDG13ooC5M8wq135oTiIu2Z6ZNsOrbTjCL1uCxFvPcqojvr5wXCYMFFT4MZPraiz-1huen3DmxGti-SSsU-3nf0osDTt66OgkdYSRsHaLBJcqnuVvWve2SjnHgBRjJp7IB-YaKQ_K_jBf7VcskE-7BeGeiprP-yD3opUbAEHhshUdpnEsYhEQE8nwBpdBst2gsXjhQ8CuuU6xHMsQLwl_jzcmqEVeZVcHr49j6evMXyoHiM9OkRaVc80tKGKAnRq9V9twtluX8LXR797iqIPoA';

    try {
      const response = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workingToken}`
        }
      });

      const responseText = await response.text();
      
      setDebugInfo({
        workingTokenTest: true,
        responseStatus: response.status,
        responseStatusText: response.statusText,
        success: response.ok,
        responsePreview: responseText.substring(0, 200) + '...',
        message: response.ok ? 'Working token still works!' : 'Working token failed!'
      });

    } catch (error) {
      setDebugInfo({
        workingTokenTest: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-yellow-600 text-white p-4">
          <h1 className="text-xl font-bold">🔬 API Call Debugger</h1>
          <p className="text-yellow-100 mt-1">Debug the exact API request being made by your app</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={testApiCall}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Testing...' : '🧪 Test Current App Token'}
            </button>
            
            <button
              onClick={testWithWorkingToken}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '🔄 Testing...' : '✅ Test Known Working Token'}
            </button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                debugInfo.success ? 'bg-green-50 border-green-200' : 
                debugInfo.error ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h3 className="font-semibold mb-2">
                  {debugInfo.success ? '✅ Success' : debugInfo.error ? '❌ Error' : '⚠️ Test Result'}
                </h3>
                
                {debugInfo.workingTokenTest ? (
                  <div>
                    <p><strong>Working Token Test:</strong> {debugInfo.message}</p>
                    <p><strong>Status:</strong> {debugInfo.responseStatus} {debugInfo.responseStatusText}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p><strong>Token Available:</strong> {debugInfo.tokenReceived ? '✅ Yes' : '❌ No'}</p>
                    {debugInfo.tokenReceived && (
                      <>
                        <p><strong>Token Length:</strong> {debugInfo.tokenLength}</p>
                        <p><strong>API Response Status:</strong> {debugInfo.responseStatus} {debugInfo.responseStatusText}</p>
                        
                        {debugInfo.tokenPayload && (
                          <div className="mt-3">
                            <h4 className="font-medium">Token Details:</h4>
                            <div className="text-sm space-y-1 ml-4">
                              <p><strong>Audience:</strong> {debugInfo.tokenPayload.aud}</p>
                              <p><strong>Client ID:</strong> {debugInfo.tokenPayload.client_id}</p>
                              <p><strong>Token Type:</strong> {debugInfo.tokenPayload.token_use}</p>
                              <p><strong>Scopes:</strong> {debugInfo.tokenPayload.scope}</p>
                              <p><strong>Expired:</strong> {debugInfo.tokenPayload.isExpired ? '❌ YES' : '✅ NO'}</p>
                              <p><strong>Time to Expiry:</strong> {debugInfo.tokenPayload.timeToExpiry}</p>
                            </div>
                          </div>
                        )}

                        {debugInfo.requestHeaders && (
                          <div className="mt-3">
                            <h4 className="font-medium">Request Headers Sent:</h4>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                              {JSON.stringify(debugInfo.requestHeaders, null, 2)}
                            </pre>
                          </div>
                        )}

                        {debugInfo.responseBody && (
                          <div className="mt-3">
                            <h4 className="font-medium">Response Body:</h4>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                              {debugInfo.responseBody}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                    
                    {debugInfo.error && (
                      <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>
                    )}
                  </div>
                )}
              </div>

              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="font-semibold cursor-pointer">🔍 Raw Debug Data</summary>
                <pre className="text-xs mt-2 bg-gray-100 p-3 rounded overflow-x-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {!debugInfo && !loading && (
            <div className="text-center text-gray-500 py-8">
              <p>Click a button to test your API calls and see exactly what's happening</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiDebugger;
