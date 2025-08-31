import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Eye, Calendar, Activity } from 'lucide-react';
import { useListService, ListItem } from '../../services/listService';

const ListViewer: React.FC = () => {
  const { getList, isReady } = useListService();
  const [listData, setListData] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);

  const fetchData = async () => {
    if (!isReady) {
      setError('Authentication required. Please sign in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Attempting to fetch /list data...');
      const response = await getList();
      console.log('✅ Successfully fetched list data:', response);
      
      // Handle both array response and object with items array
      const items = Array.isArray(response) ? response : response.items || [];
      
      // Ensure each item has an ID for React keys
      const itemsWithIds = items.map((item, index) => ({
        ...item,
        id: item.id || item.uri || item.jobName || `item-${index}`,
      }));
      
      console.log('📋 Processed items with IDs:', itemsWithIds);
      setListData(itemsWithIds);
    } catch (err) {
      console.error('❌ Error fetching list:', err);
      
      // More detailed error message
      let errorMessage = 'Failed to fetch list data';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for specific error types
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Check API Gateway authorizer configuration.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Access forbidden. Check API permissions and resource policies.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found. Verify the /list endpoint exists.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = listData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [listData, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatValue = (key: string, value: any) => {
    if (!value) return '-';
    
    // Format dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    
    // Format status with colors
    if (key.toLowerCase() === 'status') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value.toLowerCase() === 'active' || value.toLowerCase() === 'completed' 
            ? 'bg-green-100 text-green-800'
            : value.toLowerCase() === 'pending' || value.toLowerCase() === 'in-progress'
            ? 'bg-yellow-100 text-yellow-800' 
            : value.toLowerCase() === 'failed' || value.toLowerCase() === 'error'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    }
    
    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading list data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800 mb-2">
          <Activity size={20} />
          <span className="font-semibold">Error Loading Data</span>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get column headers from the first item (if available)
  const columns = listData.length > 0 ? Object.keys(listData[0]) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">List Data</h2>
            <p className="text-gray-600">Data from /list API endpoint</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search in all fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {columns.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {columns.map(col => (
                <option key={col} value={col}>Sort by {col}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="text-blue-600" size={20} />
              <span className="text-blue-900 font-semibold">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{listData.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="text-green-600" size={20} />
              <span className="text-green-900 font-semibold">Filtered Items</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{filteredAndSortedData.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="text-purple-600" size={20} />
              <span className="text-purple-900 font-semibold">Last Updated</span>
            </div>
            <p className="text-sm text-purple-600">
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {listData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Activity className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">The /list endpoint returned no data or is empty.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{col}</span>
                        {sortBy === col && (
                          <span className="text-blue-600">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((item, index) => (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatValue(col, item[col])}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(selectedItem).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <span className="text-gray-900 max-w-xs text-right">
                      {formatValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListViewer;
