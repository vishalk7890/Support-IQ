import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { SigV4ApiClient } from '../utils/sigv4ApiClient';

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

export class JwtApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private getOAuthToken?: () => Promise<string | null>;

  constructor(baseUrl: string, apiKey?: string, getOAuthToken?: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.getOAuthToken = getOAuthToken;
  }

  /**
   * Makes an authenticated API request using JWT Bearer token
   */
  async request<T = any>(options: ApiRequestOptions): Promise<T> {
    const { method, url, body, headers = {} } = options;

    // Get JWT token from current auth session
    const authHeaders: Record<string, string> = {};
    
    try {
      // Simple approach: Always use ID token for Cognito User Pool Authorizer
      let tokenToUse: string | null = null;
      
      if (this.getOAuthToken) {
        tokenToUse = await this.getOAuthToken();
        console.log('🔍 Token from getOAuthToken:', tokenToUse ? `Token received (length: ${tokenToUse.length})` : 'No token');
        
        if (tokenToUse) {
          console.log('🔍 Token preview:', tokenToUse.substring(0, 50) + '...');
          
          // Make token copyable from console
          console.log('📝 FULL TOKEN (copy this entire line):');
          console.log(tokenToUse);
          
          // Also add to window for easy access
          if (typeof window !== 'undefined') {
            (window as any).currentToken = tokenToUse;
            console.log('📝 Token also available as: window.currentToken');
            console.log('📝 To copy: copy(window.currentToken)');
          }
          
          // Decode and log token info for debugging
          try {
            const tokenParts = tokenToUse.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const now = Math.floor(Date.now() / 1000);
              const isExpired = payload.exp < now;
              const timeToExpiry = payload.exp - now;
              
              console.log('🔍 Token payload:', {
                aud: payload.aud,
                iss: payload.iss,
                token_use: payload.token_use,
                client_id: payload.client_id,
                username: payload['cognito:username'] || payload.username,
                exp: payload.exp,
                iat: payload.iat,
                isExpired: isExpired,
                timeToExpiry: timeToExpiry > 0 ? `${Math.floor(timeToExpiry / 60)} minutes` : 'EXPIRED'
              });
              
              if (isExpired) {
                console.warn('⚠️ TOKEN IS EXPIRED! This will cause authentication failure.');
              }
            }
          } catch (e) {
            console.warn('Could not decode token for debugging:', e);
          }
        }
      } else {
        console.log('❌ No getOAuthToken function available');
      }
      
      if (tokenToUse) {
        // Use standard Authorization header only
        authHeaders.Authorization = `Bearer ${tokenToUse}`;
        console.log('🚀 Using token for authorization');
      } else {
        console.log('❌ No token available for authorization');
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
    }

    // Add API key if available
    if (this.apiKey) {
      authHeaders['x-api-key'] = this.apiKey;
    }

    const requestUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(requestUrl, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text() as unknown as T;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'POST', url, body, headers });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PUT', url, body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, body, headers });
  }
}

/**
 * Hook to create and manage an authenticated API client using SigV4
 */
export const useApiClient = ({ baseUrl }: { baseUrl: string; apiKey?: string }) => {
  const { user, refresh } = useAuth();

  const apiClient = useMemo(() => {
    // Get environment variables for SigV4 configuration
    const region = (import.meta.env as any).VITE_AWS_REGION || 'us-east-1';
    const identityPoolId = (import.meta.env as any).VITE_COGNITO_IDENTITY_POOL_ID;
    const userPoolId = (import.meta.env as any).VITE_COGNITO_USER_POOL_ID;

    if (!identityPoolId || !userPoolId) {
      console.error('❌ Missing required environment variables for SigV4 authentication');
      console.error('Required: VITE_COGNITO_IDENTITY_POOL_ID, VITE_COGNITO_USER_POOL_ID');
      return null;
    }

    return new SigV4ApiClient(baseUrl, region, 'execute-api', identityPoolId, userPoolId);
  }, [baseUrl]);

  const refreshAuth = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    apiClient,
    isReady: !!user && !!apiClient,
    refreshAuth,
  };
};

/**
 * Hook for making authenticated API requests with fallback from SigV4 to JWT
 */
export const useAuthenticatedRequest = (baseUrl: string = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod') => {
  const { user, getOAuthToken } = useAuth();
  const { apiClient, refreshAuth } = useApiClient({ baseUrl });

  // Create JWT client as fallback
  const jwtClient = useMemo(() => {
    return new JwtApiClient(baseUrl, undefined, getOAuthToken);
  }, [baseUrl, getOAuthToken]);

  const makeRequest = useCallback(async <T = any>(
    url: string,
    requestOptions: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> => {
    if (!user) {
      throw new Error('User not authenticated. Please sign in.');
    }

    const { method = 'GET', body, headers } = requestOptions;

    // Try SigV4 first, fallback to JWT if SigV4 fails
    if (apiClient) {
      try {
        console.log('🔐 Attempting SigV4 authentication...');
        return await apiClient.request<T>({
          method,
          url,
          body,
          headers,
        });
      } catch (error) {
        console.warn('⚠️ SigV4 authentication failed, falling back to JWT:', error);
      }
    }

    // Fallback to JWT Bearer token
    console.log('🔄 Using JWT Bearer token authentication...');
    try {
      return await jwtClient.request<T>({
        method,
        url,
        body,
        headers,
      });
    } catch (error) {
      // If JWT fails due to auth (401/403), try refreshing auth once
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        console.log('🔄 Refreshing authentication...');
        await refreshAuth();
        return await jwtClient.request<T>({
          method,
          url,
          body,
          headers,
        });
      }
      throw error;
    }
  }, [apiClient, jwtClient, user, refreshAuth]);

  return {
    makeRequest,
    isReady: !!user,
    refreshAuth,
  };
};
