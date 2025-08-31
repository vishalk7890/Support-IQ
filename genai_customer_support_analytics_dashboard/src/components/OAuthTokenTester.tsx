import React, { useState } from 'react';
import { getList } from '../services/apiService';

const OAuthTokenTester: React.FC = () => {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Temporarily override the API client's token
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function(key: string) {
        if (key === 'oauth_test_token') {
          return token;
        }
        return originalGetItem.call(this, key);
      };

      // Override the API client token retrieval temporarily
      const apiClient = createJwtApiClient(
        'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod',
        import.meta.env.VITE_API_KEY,
        async () => token.trim()
      );

      const response = await apiClient.get('/list');
      setResult(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        🧪 OAuth Token Tester
      </h3>
      <p className="text-yellow-700 mb-4">
        Paste the working OAuth token here to test the /list API:
      </p>
      
      <div className="space-y-4">
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste OAuth token here (eyJraWQiOiJ...)"
          className="w-full h-32 p-3 border border-yellow-300 rounded-md font-mono text-sm"
        />
        
        <button
          onClick={testToken}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Token'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 font-semibold">❌ Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-green-800 font-semibold">✅ Success!</p>
            <p className="text-green-600">Retrieved {result.Records?.length || 0} records</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-green-700">View Response</summary>
              <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthTokenTester;
