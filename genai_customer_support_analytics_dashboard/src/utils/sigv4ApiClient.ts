import { fetchAuthSession } from '@aws-amplify/auth';
import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from '@aws-sdk/client-cognito-identity';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { formatUrl } from '@aws-sdk/util-format-url';
import { Sha256 } from '@aws-crypto/sha256-js';

export interface SigV4ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}

export class SigV4ApiClient {
  private baseUrl: string;
  private region: string;
  private service: string;
  private identityPoolId: string;
  private userPoolId: string;

  constructor(
    baseUrl: string,
    region: string = 'us-east-1',
    service: string = 'execute-api',
    identityPoolId: string,
    userPoolId: string
  ) {
    this.baseUrl = baseUrl;
    this.region = region;
    this.service = service;
    this.identityPoolId = identityPoolId;
    this.userPoolId = userPoolId;
  }

  /**
   * Get AWS credentials from Cognito Identity Pool
   */
  private async getAWSCredentials(): Promise<AWSCredentials> {
    try {
      console.log('🔍 SigV4: Getting AWS credentials...');
      
      // Get the current auth session to get ID token
      const session = await fetchAuthSession();
      const idToken = session?.tokens?.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No ID token available for credential exchange');
      }

      console.log('🔍 SigV4: ID token available, exchanging for AWS credentials');

      // Create Cognito Identity client
      const cognitoIdentityClient = new CognitoIdentityClient({
        region: this.region,
      });

      // Get identity ID
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: this.identityPoolId,
        Logins: {
          [`cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`]: idToken,
        },
      });

      const identityResponse = await cognitoIdentityClient.send(getIdCommand);
      const identityId = identityResponse.IdentityId;

      if (!identityId) {
        throw new Error('Failed to get identity ID from Cognito Identity Pool');
      }

      console.log('🔍 SigV4: Got identity ID, getting credentials');

      // Get credentials for identity
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
        Logins: {
          [`cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`]: idToken,
        },
      });

      const credentialsResponse = await cognitoIdentityClient.send(getCredentialsCommand);
      const credentials = credentialsResponse.Credentials;

      if (!credentials || !credentials.AccessKeyId || !credentials.SecretKey) {
        throw new Error('Failed to get valid AWS credentials from Cognito Identity Pool');
      }

      console.log('✅ SigV4: Successfully obtained AWS credentials');

      return {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretKey,
        sessionToken: credentials.SessionToken,
        expiration: credentials.Expiration,
      };
    } catch (error) {
      console.error('❌ SigV4: Error getting AWS credentials:', error);
      throw error;
    }
  }

  /**
   * Makes an authenticated API request using AWS SigV4 signing
   */
  async request<T = any>(options: SigV4ApiRequestOptions): Promise<T> {
    const { method, url, body, headers = {} } = options;

    try {
      // Get AWS credentials
      const credentials = await this.getAWSCredentials();

      // Prepare the request URL
      const requestUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
      const parsedUrl = new URL(requestUrl);

      // Create the request object
      const request = {
        method,
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        protocol: parsedUrl.protocol,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      };

      // Create SigV4 signer
      const signer = new SignatureV4({
        service: this.service,
        region: this.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
        sha256: Sha256,
      });

      // Sign the request
      const signedRequest = await signer.sign(request);
      const signedUrl = formatUrl(signedRequest);

      console.log('🚀 SigV4: Making signed request to:', requestUrl);

      // Make the HTTP request
      const response = await fetch(signedUrl, {
        method: signedRequest.method,
        headers: signedRequest.headers,
        body: signedRequest.body,
      });

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
    } catch (error) {
      console.error('❌ SigV4: Request failed:', error);
      throw error;
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
