import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthenticatedRequest } from '../hooks/useApiClient';

export const ApiExample: React.FC = () => {
  const { user, loading } = useAuth();
  const { makeRequest, isReady } = useAuthenticatedRequest();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleApiCall = async () => {
    if (!isReady) {
      setApiError('API client not ready. Please ensure you are authenticated.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      // Test with actual PCA endpoint
      const response = await makeRequest('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
        method: 'GET',
      });
      
      setApiResponse(response);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostExample = async () => {
    if (!isReady) {
      setApiError('API client not ready. Please ensure you are authenticated.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiResponse(null);

    try {
      // Test with PCA entities endpoint
      const response = await makeRequest('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/entities', {
        method: 'GET',
      });
      
      setApiResponse(response);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading authentication...</div>;
  }

  if (!user) {
    return <div className="p-4">Please log in to use the API.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Client Example</h2>
      
      {/* User Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
        <p><strong>User ID:</strong> {user.userId}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>Has AWS Credentials:</strong> {user.credentials ? '✅ Yes' : '❌ No'}</p>
        <p><strong>API Client Ready:</strong> {isReady ? '✅ Ready' : '❌ Not Ready'}</p>
        {user.credentials?.expiration && (
          <p><strong>Credentials Expire:</strong> {user.credentials.expiration.toLocaleString()}</p>
        )}
      </div>

      {/* API Controls */}
      <div className="space-y-4 mb-6">
        <button
          onClick={handleApiCall}
          disabled={!isReady || isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-4"
        >
          {isLoading ? 'Loading...' : 'Test /list Endpoint'}
        </button>
        
        <button
          onClick={handlePostExample}
          disabled={!isReady || isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {isLoading ? 'Loading...' : 'Test /entities Endpoint'}
        </button>
      </div>

      {/* API Response */}
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {apiResponse && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h4 className="font-semibold mb-2">API Response:</h4>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Set up your AWS Cognito User Pool and Identity Pool</li>
          <li>Configure your API Gateway to use IAM authentication</li>
          <li>Update the environment variables in your .env file</li>
          <li>Replace the example URLs above with your actual API Gateway endpoints</li>
          <li>The requests will be automatically signed with AWS SigV4</li>
        </ol>
      </div>
    </div>
  );
};
