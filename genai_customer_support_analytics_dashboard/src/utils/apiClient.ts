import { fetchAuthSession } from '@aws-amplify/auth';

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
      }
      
      if (tokenToUse) {
        authHeaders.Authorization = tokenToUse;
        console.log('🚀 Using ID token for authorization');
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
 * Factory function to create a JWT-based API client
 */
export const createJwtApiClient = (baseUrl: string, apiKey?: string, getOAuthToken?: () => Promise<string | null>): JwtApiClient => {
  return new JwtApiClient(baseUrl, apiKey, getOAuthToken);
};