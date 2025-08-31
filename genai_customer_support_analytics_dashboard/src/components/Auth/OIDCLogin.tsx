import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signIn, signOut, getCurrentUser, fetchAuthSession, signInWithRedirect } from '@aws-amplify/auth';

const OIDCLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Clear any existing session on component mount
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        // Check if there's an existing user
        await getCurrentUser();
        console.log('🔍 Found existing user session, clearing...');
        
        // Sign out to clear the session
        await signOut();
        
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        
        console.log('✅ Existing session cleared');
      } catch (error) {
        // No existing user, which is what we want
        console.log('✅ No existing session found');
      }
    };

    clearExistingSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clear any existing session first to prevent "already signed in" error
      try {
        await signOut();
        console.log('🔄 Cleared any existing session before login');
      } catch (signOutError) {
        // Ignore errors if no session exists
      }

      // Real Cognito authentication with Amplify v6
      const result = await signIn({
        username: email,
        password: password,
      });
      
      console.log('✅ Cognito sign in successful:', result);
      
      if (result.isSignedIn) {
        // Get tokens using fetchAuthSession (proper Amplify v6 way)
        const session = await fetchAuthSession();
        console.log('🔍 Auth session:', session);
        
        const idToken = session?.tokens?.idToken?.toString();
        const accessToken = session?.tokens?.accessToken?.toString();
        
        console.log('🔍 ID Token available:', !!idToken);
        console.log('🔍 Access Token available:', !!accessToken);
        
        // Debug token details for API Gateway troubleshooting
        if (idToken) {
          try {
            const idPayload = JSON.parse(atob(idToken.split('.')[1]));
            console.log('🔍 ID Token details:', {
              aud: idPayload.aud,
              iss: idPayload.iss,
              token_use: idPayload.token_use,
              scope: idPayload.scope,
              client_id: idPayload.client_id,
              exp: new Date(idPayload.exp * 1000).toISOString()
            });
          } catch (e) {
            console.warn('Could not decode ID token');
          }
        }
        
        if (accessToken) {
          try {
            const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('🔍 Access Token details:', {
              aud: accessPayload.aud,
              iss: accessPayload.iss,
              token_use: accessPayload.token_use,
              scope: accessPayload.scope,
              client_id: accessPayload.client_id,
              exp: new Date(accessPayload.exp * 1000).toISOString()
            });
          } catch (e) {
            console.warn('Could not decode access token');
          }
        }
        
        // Store tokens for API calls
        if (idToken) {
          localStorage.setItem('id_token', idToken);
          
          // Decode and log token info for debugging
          try {
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            console.log('🔍 ID Token payload:', {
              aud: payload.aud,
              client_id: payload.client_id,
              token_use: payload.token_use,
              iss: payload.iss,
              exp: new Date(payload.exp * 1000).toISOString(),
              scopes: payload.scope || 'No scope in ID token'
            });
          } catch (e) {
            console.warn('Could not decode ID token');
          }
        }
        
        if (accessToken) {
          localStorage.setItem('access_token', accessToken);
          
          // Decode and log access token info
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('🔍 Access Token payload:', {
              client_id: payload.client_id,
              token_use: payload.token_use,
              scope: payload.scope,
              exp: new Date(payload.exp * 1000).toISOString()
            });
          } catch (e) {
            console.warn('Could not decode access token');
          }
        }
        
        setUser(result);
        
        // Store user info in localStorage for other components to access
        localStorage.setItem('user', JSON.stringify(result));
        
        // Redirect to dashboard after successful login
        window.location.href = '/dashboard';
      } else {
        // Handle multi-step sign-in if needed
        console.log('🔄 Sign-in requires additional steps:', result.nextStep);
        setError('Sign-in requires additional steps. Please check console for details.');
      }
    } catch (err: any) {
      console.error('❌ Cognito sign in error:', err);
      
      // Handle specific "already signed in" error
      if (err.message?.includes('already a signed in user')) {
        setError('Session conflict detected. Clearing session and retrying...');
        try {
          await signOut();
          localStorage.clear();
          setTimeout(() => {
            setError('Session cleared. Please try logging in again.');
            setLoading(false);
          }, 1000);
          return;
        } catch (clearError) {
          console.error('Failed to clear session:', clearError);
        }
      }
      
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Starting OAuth hosted UI flow...');
      
      // Clear any existing session first
      try {
        await signOut();
        console.log('🔄 Cleared existing session before OAuth');
      } catch (signOutError) {
        // Ignore errors if no session exists
      }
      
      // Use OAuth hosted UI which will generate tokens with proper scopes
      await signInWithRedirect();
      
    } catch (err: any) {
      console.error('❌ OAuth sign in error:', err);
      setError(err.message || 'Failed to start OAuth flow');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setEmail('');
    setPassword('');
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20">
            <h2 className="text-xl font-bold text-green-300 mb-4">✅ Login Successful!</h2>
            <p className="text-white mb-4">Signed in successfully</p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is not authenticated, show login button
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md p-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              GenAI-supportIQ
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
          </motion.div>
          <p className="text-gray-300 text-lg font-medium">Intelligent Customer Support Analytics</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Sign In</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                '🔐 Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/10 text-gray-300">or</span>
              </div>
            </div>
            
            <button
              onClick={handleOAuthLogin}
              disabled={loading}
              className="w-full mt-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 px-6 font-semibold shadow-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Starting OAuth...
                </div>
              ) : (
                '🌐 Sign In with OAuth (Scoped Tokens)'
              )}
            </button>
          </div>
          
          <p className="text-gray-400 text-xs mt-4 text-center">
            Using real Cognito User Pool authentication. Enter valid credentials.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OIDCLogin;
