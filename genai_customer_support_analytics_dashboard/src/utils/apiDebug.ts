import { useListService } from '../services/listService';

export const testApiConnection = async () => {
  console.log('🧪 Testing API connection...');
  
  try {
    const { getList } = useListService();
    const data = await getList();
    console.log('✅ API connection successful!');
    console.log('📊 Data received:', data);
    return data;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    throw error;
  }
};
