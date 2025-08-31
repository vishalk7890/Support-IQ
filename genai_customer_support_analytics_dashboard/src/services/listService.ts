import { useAuthenticatedRequest } from '../hooks/useApiClient';

const API_BASE_URL = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod';

export interface ListItem {
  id?: string;
  uri?: string;
  jobName?: string;
  confidence?: number;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Allow for additional properties
}

export interface ListResponse {
  items: ListItem[];
  totalCount: number;
  pageSize: number;
  nextToken?: string;
}

/**
 * Custom hook for list operations
 */
export const useListService = () => {
  const { makeRequest, isReady } = useAuthenticatedRequest(API_BASE_URL);

  const getList = async (params?: {
    pageSize?: number;
    nextToken?: string;
    filter?: string;
  }): Promise<ListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }
    if (params?.filter) {
      queryParams.append('filter', params.filter);
    }

    const url = `/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔍 Fetching list data from:', url);
    
    // API returns array directly, not wrapped in an object
    const response = await makeRequest<ListItem[] | ListResponse>(url, {
      method: 'GET'
    });
    
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      console.log('✅ API returned direct array with', response.length, 'items');
      return {
        items: response,
        totalCount: response.length,
        pageSize: response.length
      };
    } else {
      console.log('✅ API returned wrapped response');
      return response as ListResponse;
    }
  };

  const getListItem = async (id: string): Promise<ListItem> => {
    console.log('🔍 Fetching list item:', id);
    
    return await makeRequest<ListItem>(`/list/${id}`, {
      method: 'GET'
    });
  };

  const createListItem = async (item: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ListItem> => {
    console.log('➕ Creating list item:', item);
    
    return await makeRequest<ListItem>('/list', {
      method: 'POST',
      body: item
    });
  };

  const updateListItem = async (id: string, updates: Partial<ListItem>): Promise<ListItem> => {
    console.log('✏️ Updating list item:', id, updates);
    
    return await makeRequest<ListItem>(`/list/${id}`, {
      method: 'PUT',
      body: updates
    });
  };

  const deleteListItem = async (id: string): Promise<void> => {
    console.log('🗑️ Deleting list item:', id);
    
    await makeRequest<void>(`/list/${id}`, {
      method: 'DELETE'
    });
  };

  return {
    getList,
    getListItem,
    createListItem,
    updateListItem,
    deleteListItem,
    isReady
  };
};
