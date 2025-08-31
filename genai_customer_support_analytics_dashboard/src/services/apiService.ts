// Minimal PCA-compatible API service
const API_BASE_URL = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod';

// Get tokens from Amplify authentication
const getTokens = async (): Promise<{idToken?: string, accessToken?: string}> => {
  // Primary: Get tokens from localStorage (stored by our login)
  const idToken = localStorage.getItem('id_token');
  const accessToken = localStorage.getItem('access_token');
  
  if (idToken) {
    console.log('🔍 Using ID token from Amplify login');
  }
  if (accessToken) {
    console.log('🔍 Using Access token from Amplify login');
  }
  
  if (!idToken && !accessToken) {
    console.warn('🚨 No tokens found - user may not be authenticated');
  }
  
  return { idToken: idToken || undefined, accessToken: accessToken || undefined };
};

// Simple API request function for Cognito User Pool authorizer
const makeRequest = async (url: string, options: RequestInit = {}): Promise<any> => {
  const { idToken, accessToken } = await getTokens();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Try different token approaches for API Gateway
  let tokenToUse = idToken || accessToken;
  let tokenType = 'ID';
  
  if (idToken) {
    tokenToUse = idToken;
    tokenType = 'ID';
    console.log('🔍 Using ID token for API Gateway');
  } else if (accessToken) {
    tokenToUse = accessToken;
    tokenType = 'Access';
    console.log('🔍 Using Access token for API Gateway');
  }
  
  if (tokenToUse) {
    // Debug: decode and analyze the token
    try {
      const payload = JSON.parse(atob(tokenToUse.split('.')[1]));
      console.log(`🔍 ${tokenType} Token Analysis:`, {
        aud: payload.aud,
        client_id: payload.client_id,
        token_use: payload.token_use,
        iss: payload.iss,
        scope: payload.scope,
        exp: new Date(payload.exp * 1000).toISOString()
      });
    } catch (e) {
      console.log(`⚠️ Could not decode ${tokenType.toLowerCase()} token for analysis`);
    }
    
    // Use Bearer prefix (standard for Cognito User Pool authorizers)
    headers.Authorization = `Bearer ${tokenToUse}`;
    console.log(`🚀 Using Bearer ${tokenType} token for Cognito User Pool authorizer`);
    
  } else {
    console.log('⚠️ No tokens available - request may fail');
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log('📞 Making request to:', fullUrl);
  console.log('📞 Headers:', headers);
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  console.log('📞 Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API request failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText
    });
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
};

// Only the endpoints that actually exist in PCA
export interface ListItem {
  [key: string]: any;
}

/**
 * List items (the main endpoint we need)
 */
export const list = async (params?: Record<string, any>): Promise<ListItem[]> => {
  console.log('📞 Calling PCA /list endpoint');
  let url = '/list';
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    url += `?${queryParams.toString()}`;
  }
  
  const response = await makeRequest(url);
  return Array.isArray(response) ? response : [];
};

/**
 * Get entities (secondary endpoint)
 */
export const entities = async (): Promise<any> => {
  console.log('📞 Calling PCA /entities endpoint');
  const response = await makeRequest('/entities');
  return response;
};

// Aliases for backward compatibility
export const getList = list;

// No-op setter for backward compatibility
export const setOAuthTokenGetter = (getOAuthToken: () => Promise<string | null>) => {
  console.log('🔧 OAuth token getter set (no-op)');
};

// Simple hook
export const useApiService = () => {
  return {
    list,
    getList: list,
    entities,
    isReady: true,
  };
};
