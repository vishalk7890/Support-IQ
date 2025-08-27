import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiClient, createApiClient } from '../utils/apiClient';

export interface UseApiClientOptions {
  region?: string;
  service?: string;
}

export interface UseApiClientReturn {
  apiClient: ApiClient | null;
  isReady: boolean;
  refreshCredentials: () => Promise<void>;
}

/**
 * Hook to get an authenticated API client for making SigV4 signed requests
 */
export const useApiClient = (options: UseApiClientOptions = {}): UseApiClientReturn => {
  const { user, getCredentials, refresh } = useAuth();
  const { region, service } = options;

  // Create API client when credentials are available
  const apiClient = useMemo(() => {
    if (!user?.credentials) {
      return null;
    }
    return createApiClient(user.credentials, region, service);
  }, [user?.credentials, region, service]);

  // Check if API client is ready to use
  const isReady = useMemo(() => {
    return apiClient !== null && !apiClient.areCredentialsExpired();
  }, [apiClient]);

  // Refresh credentials if they're expired or missing
  const refreshCredentials = useCallback(async () => {
    try {
      // First try to get fresh credentials
      const freshCredentials = await getCredentials();
      
      if (freshCredentials && apiClient) {
        apiClient.updateCredentials(freshCredentials);
      } else {
        // If that fails, refresh the entire auth context
        await refresh();
      }
    } catch (error) {
      console.error('Failed to refresh credentials:', error);
      // Fallback to full auth refresh
      await refresh();
    }
  }, [getCredentials, apiClient, refresh]);

  return {
    apiClient,
    isReady,
    refreshCredentials,
  };
};

/**
 * Hook for making API requests with automatic credential management
 */
export const useAuthenticatedRequest = (options: UseApiClientOptions = {}) => {
  const { apiClient, isReady, refreshCredentials } = useApiClient(options);

  const makeRequest = useCallback(async <T = any>(
    url: string,
    requestOptions: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> => {
    if (!apiClient) {
      throw new Error('API client not available. User may not be authenticated.');
    }

    // Check if credentials are expired and refresh if needed
    if (apiClient.areCredentialsExpired()) {
      await refreshCredentials();
    }

    const { method = 'GET', body, headers } = requestOptions;

    try {
      return await apiClient.request<T>({
        method,
        url,
        body,
        headers,
      });
    } catch (error) {
      // If request fails due to auth, try refreshing credentials once
      if (error instanceof Error && error.message.includes('403')) {
        await refreshCredentials();
        return await apiClient.request<T>({
          method,
          url,
          body,
          headers,
        });
      }
      throw error;
    }
  }, [apiClient, refreshCredentials]);

  return {
    makeRequest,
    isReady,
    refreshCredentials,
  };
};
