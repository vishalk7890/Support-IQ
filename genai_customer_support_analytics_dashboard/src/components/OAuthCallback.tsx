import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing'>('processing');
  const [message, setMessage] = useState<string>('Processing OAuth login...');
  const { refresh, user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 OAuth callback - Amplify has handled token exchange automatically');
        
        // Check for errors in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
          console.error('❌ OAuth error:', error);
          window.location.href = '/?error=' + encodeURIComponent(error);
          return;
        }
        
        setMessage('🔄 Refreshing authentication...');
        
        // Let Amplify handle the OAuth flow, then refresh auth context
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for Amplify
        await refresh();
        
        // Clear URL and redirect to dashboard
        window.history.replaceState(null, '', '/');
        window.location.href = '/dashboard';
        
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        window.location.href = '/?error=callback_failed';
      }
    };

    handleCallback();
  }, [refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {status === 'processing' && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing Login</h2>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Login Successful!</h2>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">OAuth Error</h2>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <button
                onClick={handleRetryLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
