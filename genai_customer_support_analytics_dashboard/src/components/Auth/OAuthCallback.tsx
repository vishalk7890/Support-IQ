import React, { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';

const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        // Wait a moment for Amplify to process the callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const user = await getCurrentUser();
        console.log('✅ OAuth user authenticated:', user);
        
        // Get the session with tokens
        const session = await fetchAuthSession();
        console.log('🔍 OAuth session:', session);
        
        const idToken = session?.tokens?.idToken?.toString();
        const accessToken = session?.tokens?.accessToken?.toString();
        
        console.log('🔍 OAuth ID Token available:', !!idToken);
        console.log('🔍 OAuth Access Token available:', !!accessToken);
        
        // Debug OAuth token details
        if (idToken) {
          try {
            const idPayload = JSON.parse(atob(idToken.split('.')[1]));
            console.log('🔍 OAuth ID Token details:', {
              aud: idPayload.aud,
              iss: idPayload.iss,
              token_use: idPayload.token_use,
              scope: idPayload.scope,
              client_id: idPayload.client_id,
              exp: new Date(idPayload.exp * 1000).toISOString()
            });
          } catch (e) {
            console.warn('Could not decode OAuth ID token');
          }
        }
        
        if (accessToken) {
          try {
            const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('🔍 OAuth Access Token details:', {
              aud: accessPayload.aud,
              iss: accessPayload.iss,
              token_use: accessPayload.token_use,
              scope: accessPayload.scope,
              client_id: accessPayload.client_id,
              exp: new Date(accessPayload.exp * 1000).toISOString()
            });
          } catch (e) {
            console.warn('Could not decode OAuth access token');
          }
        }
        
        // Store tokens for API calls
        if (idToken) {
          localStorage.setItem('id_token', idToken);
        }
        
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
        }
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(user));
        
        setStatus('success');
        
        // Redirect to dashboard after a brief success message
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
      } catch (err: any) {
        console.error('❌ OAuth callback error:', err);
        setError(err.message || 'Failed to process OAuth callback');
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20 text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Processing OAuth Login...</h2>
          <p className="text-gray-300">Please wait while we complete your authentication.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-green-300 mb-2">✅ OAuth Login Successful!</h2>
          <p className="text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20 text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-300 mb-2">❌ OAuth Login Failed</h2>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default OAuthCallback;
