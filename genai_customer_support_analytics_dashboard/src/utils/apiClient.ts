import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-js';
import { formatUrl } from '@aws-sdk/util-format-url';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: Date;
}

export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  headers?: Record<string, string>;
  region?: string;
  service?: string;
}

export class ApiClient {
  private credentials: AWSCredentials;
  private region: string;
  private service: string;

  constructor(credentials: AWSCredentials, region = 'us-east-1', service = 'execute-api') {
    this.credentials = credentials;
    this.region = region;
    this.service = service;
  }

  /**
   * Makes a signed API request using AWS SigV4
   */
  async request<T = any>(options: ApiRequestOptions): Promise<T> {
    const { method, url, body, headers = {}, region = this.region, service = this.service } = options;

    // Parse the URL
    const urlObj = new URL(url);
    
    // Prepare the request
    const request = {
      method,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : undefined,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    // Create the signer
    const signer = new SignatureV4({
      credentials: this.credentials,
      region,
      service,
      sha256: Sha256,
    });

    // Sign the request
    const signedRequest = await signer.sign(request);

    // Convert signed request to fetch options
    const fetchOptions: RequestInit = {
      method: signedRequest.method,
      headers: signedRequest.headers,
      body: signedRequest.body,
    };

    // Make the request
    const response = await fetch(formatUrl(signedRequest), fetchOptions);

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

  /**
   * Update credentials (useful when they expire)
   */
  updateCredentials(credentials: AWSCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Check if credentials are expired
   */
  areCredentialsExpired(): boolean {
    if (!this.credentials.expiration) {
      return false;
    }
    return new Date() >= this.credentials.expiration;
  }
}

/**
 * Factory function to create an API client with credentials
 */
export const createApiClient = (credentials: AWSCredentials, region?: string, service?: string): ApiClient => {
  return new ApiClient(credentials, region, service);
};
