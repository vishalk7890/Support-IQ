import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

// OAuth2 + PKCE utilities
class OAuth2PKCE {
  private clientId: string;
  private redirectUri: string;
  private cognitoDomain: string;
  private scopes: string[];

  constructor() {
    this.clientId = '7qqdba5o1co51g0at68hu16d8p'; // Your client ID
    this.redirectUri = window.location.origin + '/oauth/callback';
    this.cognitoDomain = 'pca-1755221929659628847.auth.us-east-1.amazoncognito.com';
    this.scopes = ['openid', 'email', 'profile'];
  }

  // Generate PKCE code verifier
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate PKCE code challenge
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate random state parameter
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }

  // Start OAuth flow (replaces signInWithRedirect)
  async startOAuthFlow(): Promise<void> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store PKCE parameters for later use
    localStorage.setItem('oauth_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);

    // Build authorization URL
    const authUrl = new URL(`https://${this.cognitoDomain}/oauth2/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', this.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('🚀 Starting OAuth2 + PKCE flow:', authUrl.toString());
    
    // Redirect to Cognito authorization endpoint
    window.location.href = authUrl.toString();
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(authorizationCode: string, state: string): Promise<any> {
    // Verify state parameter
    const storedState = localStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const codeVerifier = localStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Exchange code for tokens
    const tokenUrl = `https://${this.cognitoDomain}/oauth2/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code: authorizationCode,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();
    
    // Clean up stored PKCE parameters
    localStorage.removeItem('oauth_code_verifier');
    localStorage.removeItem('oauth_state');

    return tokens;
  }
}

const CustomOAuthLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthClient] = useState(() => new OAuth2PKCE());

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      setError(`OAuth error: ${error}`);
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    setLoading(true);
    try {
      console.log('🔄 Processing OAuth callback...');
      const tokens = await oauthClient.exchangeCodeForTokens(code, state);
      
      console.log('✅ Tokens received:', tokens);
      
      // Store tokens (same way as Amplify)
      if (tokens.id_token) {
        localStorage.setItem('id_token', tokens.id_token);
      }
      if (tokens.access_token) {
        localStorage.setItem('access_token', tokens.access_token);
      }
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }

      // Clear URL and redirect to dashboard
      window.history.replaceState(null, '', '/');
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      setError(error instanceof Error ? error.message : 'OAuth callback failed');
    } finally {
      setLoading(false);
    }
  };

  // Option 1: Direct OAuth flow (like hosted UI)
  const handleOAuthLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await oauthClient.startOAuthFlow();
    } catch (error) {
      console.error('❌ OAuth flow error:', error);
      setError('Failed to start OAuth flow');
      setLoading(false);
    }
  };

  // Option 2: Username/password with OAuth token exchange (advanced)
  const handleUsernamePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, authenticate with Cognito using username/password
      const { signIn } = await import('@aws-amplify/auth');
      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        // Get the session tokens (these will be the same as OAuth tokens)
        const { fetchAuthSession } = await import('@aws-amplify/auth');
        const session = await fetchAuthSession();
        
        if (session.tokens) {
          console.log('✅ Login successful with OAuth-equivalent tokens');
          
          // Store tokens for your API client
          if (session.tokens.idToken) {
            localStorage.setItem('id_token', session.tokens.idToken.toString());
          }
          if (session.tokens.accessToken) {
            localStorage.setItem('access_token', session.tokens.accessToken.toString());
          }

          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      } else {
        setError('Login failed - additional steps required');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-300 text-lg font-medium">Custom OAuth Authentication</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Sign In</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg mb-6 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Option 1: Direct OAuth Flow (REQUIRED for API Gateway) */}
            <div className="mb-6">
              <h3 className="text-white text-sm font-medium mb-3">🚀 OAuth2 + PKCE Flow (Recommended)</h3>
              <button
                onClick={handleOAuthLogin}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white py-4 px-6 font-semibold shadow-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Lock className="w-5 h-5 mr-3" />
                    Sign In with OAuth2 + PKCE
                  </div>
                )}
              </button>
              <p className="text-gray-400 text-xs mt-2 text-center">
                ✅ Uses OAuth2 Authorization Code + PKCE flow
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">ℹ️ Only OAuth2 + PKCE generates tokens your API Gateway accepts</span>
              </div>
            </div>

            {/* Option 2: Username/Password (HIDDEN - produces wrong tokens) */}
            <div className="hidden">
            <form onSubmit={handleUsernamePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Sign In with Credentials</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </form>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              ✅ OAuth2 + PKCE generates Access tokens with OAuth scopes: openid, email, profile
            </p>
            <p className="text-blue-400 text-xs mt-1">
              ℹ️ Username/password produces admin tokens (aws.cognito.signin.user.admin) which your API Gateway rejects
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CustomOAuthLogin;
