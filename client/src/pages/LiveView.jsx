import { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders } from '../config/api';

export default function LiveView() {
  const [stagingDeals, setStagingDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStagingDeals();
  }, []);

  const fetchStagingDeals = async () => {
    try {
      const response = await fetch(getApiUrl('/api/staging'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStagingDeals(data.deals);
      } else {
        setError('Failed to load staging deals');
      }
    } catch (error) {
      console.error('Fetch staging deals error:', error);
      setError('Network error loading staging deals');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDeal = async (dealId) => {
    try {
      setError('');
      const response = await fetch(getApiUrl(`/api/staging/${dealId}/complete`), {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Deal completed and moved to Clients page!');
        await fetchStagingDeals(); // Refresh the list
      } else {
        setError(data.error || 'Failed to complete deal');
      }
    } catch (error) {
      console.error('Complete deal error:', error);
      setError('Network error completing deal');
    }
  };

  return (
    <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-17">
      {/* Messages */}
      {message && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Live View Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md w-full">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Live Activity Feed
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Deals in progress - complete them to move to Clients page
          </p>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">Loading staging deals...</div>
        ) : stagingDeals.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No deals in progress. Create "In Progress" deals to see them here!
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-full divide-y divide-gray-200">
            <table className="min-max-w-[2000px] mx-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stagingDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        In Progress
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div className="font-medium">{deal.client_name}</div>
                        {deal.client_company && (
                          <div className="text-sm text-gray-500">{deal.client_company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deal.deal_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {deal.client_email && <div>{deal.client_email}</div>}
                        {deal.client_phone && <div>{deal.client_phone}</div>}
                        {!deal.client_email && !deal.client_phone && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {deal.deal_notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleCompleteDeal(deal.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
