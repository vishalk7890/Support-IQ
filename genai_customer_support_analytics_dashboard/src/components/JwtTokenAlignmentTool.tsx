import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithRedirect } from '@aws-amplify/auth';
import { CheckCircle, XCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';

interface TokenClaims {
  [key: string]: any;
}

interface TokenInfo {
  header: TokenClaims;
  payload: TokenClaims;
  signature: string;
  raw: string;
}

interface TokenComparison {
  claim: string;
  hostedUI?: any;
  customUI?: any;
  status: 'match' | 'mismatch' | 'missing';
  description: string;
}

const JwtTokenAlignmentTool: React.FC = () => {
  const [hostedUIToken, setHostedUIToken] = useState<string>('');
  const [customUIToken, setCustomUIToken] = useState<string>('');
  const [hostedUITokenInfo, setHostedUITokenInfo] = useState<TokenInfo | null>(null);
  const [customUITokenInfo, setCustomUITokenInfo] = useState<TokenInfo | null>(null);
  const [comparison, setComparison] = useState<TokenComparison[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'comparison' | 'troubleshoot'>('input');
  const [showTokens, setShowTokens] = useState<{hostedUI: boolean; customUI: boolean}>({
    hostedUI: false,
    customUI: false
  });
  const [autoFetchCustomToken, setAutoFetchCustomToken] = useState(false);

  const { getOAuthToken, getJwtToken, user } = useAuth();

  // Decode JWT token
  const decodeJWT = useCallback((token: string): TokenInfo | null => {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const signature = parts[2];

      return {
        header,
        payload,
        signature,
        raw: token
      };
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }, []);

  // Auto-fetch current session token
  const fetchCurrentToken = useCallback(async () => {
    try {
      const token = await getOAuthToken();
      if (token) {
        setCustomUIToken(token);
      }
    } catch (error) {
      console.error('Failed to fetch current token:', error);
    }
  }, [getOAuthToken]);

  // Compare tokens
  const compareTokens = useCallback((hostedInfo: TokenInfo | null, customInfo: TokenInfo | null): TokenComparison[] => {
    const comparisons: TokenComparison[] = [];
    
    if (!hostedInfo && !customInfo) return comparisons;

    // Critical claims to compare
    const criticalClaims = [
      { key: 'aud', description: 'Audience - should match your App Client ID' },
      { key: 'iss', description: 'Issuer - should be the same Cognito User Pool' },
      { key: 'token_use', description: 'Token type - should be "id" for ID tokens' },
      { key: 'scope', description: 'OAuth scopes - should match between flows' },
      { key: 'auth_time', description: 'Authentication time' },
      { key: 'exp', description: 'Expiration time' },
      { key: 'iat', description: 'Issued at time' },
      { key: 'sub', description: 'Subject - unique user identifier' },
      { key: 'cognito:username', description: 'Cognito username' },
      { key: 'email', description: 'User email address' },
      { key: 'email_verified', description: 'Email verification status' },
      { key: 'name', description: 'User full name' },
      { key: 'profile', description: 'User profile information' }
    ];

    criticalClaims.forEach(({ key, description }) => {
      const hostedValue = hostedInfo?.payload?.[key];
      const customValue = customInfo?.payload?.[key];

      let status: 'match' | 'mismatch' | 'missing' = 'missing';

      if (hostedValue !== undefined && customValue !== undefined) {
        status = JSON.stringify(hostedValue) === JSON.stringify(customValue) ? 'match' : 'mismatch';
      } else if (hostedValue !== undefined || customValue !== undefined) {
        status = 'missing';
      }

      comparisons.push({
        claim: key,
        hostedUI: hostedValue,
        customUI: customValue,
        status,
        description
      });
    });

    return comparisons;
  }, []);

  // Update token info when tokens change
  useEffect(() => {
    setHostedUITokenInfo(decodeJWT(hostedUIToken));
  }, [hostedUIToken, decodeJWT]);

  useEffect(() => {
    setCustomUITokenInfo(decodeJWT(customUIToken));
  }, [customUIToken, decodeJWT]);

  // Update comparison when token info changes
  useEffect(() => {
    setComparison(compareTokens(hostedUITokenInfo, customUITokenInfo));
  }, [hostedUITokenInfo, customUITokenInfo, compareTokens]);

  // Auto-fetch custom token when user changes
  useEffect(() => {
    if (autoFetchCustomToken && user) {
      fetchCurrentToken();
    }
  }, [autoFetchCustomToken, user, fetchCurrentToken]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleOAuthLogin = () => {
    signInWithRedirect({ provider: 'Cognito' });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusIcon = (status: 'match' | 'mismatch' | 'missing') => {
    switch (status) {
      case 'match':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'mismatch':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'missing':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTroubleshootingSteps = () => {
    const mismatches = comparison.filter(c => c.status === 'mismatch');
    const missing = comparison.filter(c => c.status === 'missing');
    
    const steps = [];

    if (mismatches.some(m => m.claim === 'aud')) {
      steps.push({
        issue: 'Audience (aud) mismatch',
        solution: 'Ensure both Hosted UI and custom UI use the same App Client ID',
        priority: 'high'
      });
    }

    if (mismatches.some(m => m.claim === 'scope') || missing.some(m => m.claim === 'scope')) {
      steps.push({
        issue: 'OAuth scopes mismatch',
        solution: 'Configure your custom UI to request the same scopes: openid, email, profile',
        priority: 'high'
      });
    }

    if (!customUITokenInfo?.payload?.scope?.includes('openid')) {
      steps.push({
        issue: 'Missing OpenID scope',
        solution: 'Use OAuth2 Authorization Code Flow with PKCE instead of AdminInitiateAuth',
        priority: 'critical'
      });
    }

    if (missing.some(m => ['email', 'name', 'profile'].includes(m.claim))) {
      steps.push({
        issue: 'Missing user claims',
        solution: 'Ensure your custom UI uses redirect URIs and proper OAuth flow',
        priority: 'medium'
      });
    }

    return steps;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h1 className="text-2xl font-bold">🔍 JWT Token Alignment Tool</h1>
          <p className="text-blue-100 mt-2">Compare and align JWT tokens between Hosted UI and Custom UI</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'input', label: 'Token Input', icon: '📥' },
              { id: 'analysis', label: 'Token Analysis', icon: '🔬' },
              { id: 'comparison', label: 'Comparison', icon: '⚖️' },
              { id: 'troubleshoot', label: 'Troubleshoot', icon: '🛠️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Token Input Tab */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Hosted UI Token */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">🌐 Hosted UI Token</h3>
                    <button
                      onClick={handleOAuthLogin}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Get via Hosted UI
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      value={hostedUIToken}
                      onChange={(e) => setHostedUIToken(e.target.value)}
                      placeholder="Paste your Hosted UI JWT token here..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-xs resize-none"
                      type={showTokens.hostedUI ? 'text' : 'password'}
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() => setShowTokens(prev => ({ ...prev, hostedUI: !prev.hostedUI }))}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens.hostedUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {hostedUIToken && (
                        <button
                          onClick={() => copyToClipboard(hostedUIToken)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom UI Token */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">🔧 Custom UI Token</h3>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1 text-sm">
                        <input
                          type="checkbox"
                          checked={autoFetchCustomToken}
                          onChange={(e) => setAutoFetchCustomToken(e.target.checked)}
                          className="rounded"
                        />
                        <span>Auto-fetch</span>
                      </label>
                      <button
                        onClick={fetchCurrentToken}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Get Current Token
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={customUIToken}
                      onChange={(e) => setCustomUIToken(e.target.value)}
                      placeholder="Paste your Custom UI JWT token here or auto-fetch..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-xs resize-none"
                      type={showTokens.customUI ? 'text' : 'password'}
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() => setShowTokens(prev => ({ ...prev, customUI: !prev.customUI }))}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens.customUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {customUIToken && (
                        <button
                          onClick={() => copyToClipboard(customUIToken)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Status */}
              {(hostedUITokenInfo || customUITokenInfo) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Quick Status</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {hostedUITokenInfo && (
                      <div>
                        <span className="text-green-600">✅ Hosted UI token decoded</span>
                        <p className="text-gray-600">Expires: {formatTimestamp(hostedUITokenInfo.payload.exp)}</p>
                      </div>
                    )}
                    {customUITokenInfo && (
                      <div>
                        <span className="text-green-600">✅ Custom UI token decoded</span>
                        <p className="text-gray-600">Expires: {formatTimestamp(customUITokenInfo.payload.exp)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Token Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Hosted UI Analysis */}
                {hostedUITokenInfo && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-600 mb-4">🌐 Hosted UI Token</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700">Header</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(hostedUITokenInfo.header, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700">Payload</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-64">
                          {JSON.stringify(hostedUITokenInfo.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom UI Analysis */}
                {customUITokenInfo && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-600 mb-4">🔧 Custom UI Token</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700">Header</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(customUITokenInfo.header, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700">Payload</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-64">
                          {JSON.stringify(customUITokenInfo.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {(!hostedUITokenInfo && !customUITokenInfo) && (
                <div className="text-center text-gray-500 py-8">
                  <p>No tokens to analyze. Please provide tokens in the Input tab.</p>
                </div>
              )}
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              {comparison.length > 0 ? (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Comparison Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{comparison.filter(c => c.status === 'match').length} Matches</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>{comparison.filter(c => c.status === 'mismatch').length} Mismatches</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span>{comparison.filter(c => c.status === 'missing').length} Missing</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hosted UI</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom UI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {comparison.map((comp, index) => (
                          <tr key={index} className={comp.status === 'mismatch' ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{comp.claim}</div>
                                <div className="text-xs text-gray-500">{comp.description}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(comp.status)}
                                <span className={`text-sm capitalize ${
                                  comp.status === 'match' ? 'text-green-600' :
                                  comp.status === 'mismatch' ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {comp.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono max-w-xs truncate">
                              {comp.hostedUI !== undefined ? JSON.stringify(comp.hostedUI) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono max-w-xs truncate">
                              {comp.customUI !== undefined ? JSON.stringify(comp.customUI) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No tokens to compare. Please provide both tokens in the Input tab.</p>
                </div>
              )}
            </div>
          )}

          {/* Troubleshoot Tab */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">🛠️ Troubleshooting Guide</h3>
                <p className="text-blue-700 text-sm">
                  Based on your token comparison, here are the recommended steps to align your tokens:
                </p>
              </div>

              {getTroubleshootingSteps().map((step, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  step.priority === 'critical' ? 'border-red-300 bg-red-50' :
                  step.priority === 'high' ? 'border-orange-300 bg-orange-50' :
                  'border-yellow-300 bg-yellow-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      step.priority === 'critical' ? 'bg-red-500' :
                      step.priority === 'high' ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{step.issue}</h4>
                      <p className="text-gray-700 text-sm mt-1">{step.solution}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                        step.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        step.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {step.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {getTroubleshootingSteps().length === 0 && comparison.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">🎉 Tokens are aligned!</h4>
                  <p className="text-green-700 text-sm">Your Hosted UI and Custom UI tokens appear to be properly aligned.</p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">General Recommendations</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use the same App Client ID for both Hosted UI and custom UI</li>
                  <li>• Implement OAuth2 Authorization Code Flow with PKCE in your custom UI</li>
                  <li>• Request the same scopes: openid, email, profile</li>
                  <li>• Configure proper redirect URIs in your Cognito App Client</li>
                  <li>• Validate tokens at <a href="https://jwt.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">jwt.io</a> for detailed analysis</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JwtTokenAlignmentTool;
