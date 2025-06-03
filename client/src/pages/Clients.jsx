import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders } from '../config/api';

export default function Clients() {
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    dealTitle: '',
    dealValue: '',
    dealStatus: 'prospect',
    dealNotes: ''
  });

  useEffect(() => {
    fetchClients();
    fetchClientsList();

    // Auto-open modal if navigated from homepage "Add Deal" button
    if (location.state?.openModal) {
      setShowModal(true);
    }
  }, [location]);

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = clientsList.filter(client =>
        client.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowDropdown(true);
    } else {
      setFilteredClients([]);
      setShowDropdown(false);
    }
  }, [searchTerm, clientsList]);

  const fetchClients = async () => {
    try {
      const response = await fetch(getApiUrl('/api/clients'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      } else {
        setError('Failed to load clients');
      }
    } catch (error) {
      console.error('Fetch clients error:', error);
      setError('Network error loading clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsList = async () => {
    try {
      const response = await fetch(getApiUrl('/api/clients/list'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClientsList(data.clients);
      }
    } catch (error) {
      console.error('Fetch clients list error:', error);
    }
  };

  const handleAddDeal = () => {
    setShowModal(true);
    setError('');
    setMessage('');
    setSearchTerm('');
    setSelectedClient(null);
    setFilteredClients([]);
    setShowDropdown(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSearchTerm('');
    setSelectedClient(null);
    setFilteredClients([]);
    setShowDropdown(false);
    setFormData({
      clientEmail: '',
      clientPhone: '',
      clientCompany: '',
      dealTitle: '',
      dealValue: '',
      dealStatus: 'prospect',
      dealNotes: ''
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedClient(null);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setShowDropdown(false);
    
    setFormData(prev => ({
      ...prev,
      clientEmail: client.email || '',
      clientPhone: client.phone || '',
      clientCompany: client.company || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const submitData = {
      clientId: selectedClient ? selectedClient.id : null,
      clientName: selectedClient ? selectedClient.name : searchTerm,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      clientCompany: formData.clientCompany,
      dealTitle: formData.dealTitle,
      dealValue: formData.dealValue,
      dealStatus: formData.dealStatus,
      dealNotes: formData.dealNotes
    };

    try {
      const response = await fetch(getApiUrl('/api/clients/deals'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Deal added successfully ${selectedClient ? 'for existing client' : 'with new client'}!`);
        await fetchClients();
        await fetchClientsList();
        handleCloseModal();
      } else {
        setError(data.error || 'Failed to add deal');
      }
    } catch (error) {
      console.error('Add deal error:', error);
      setError('Network error adding deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Action bar */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Clients Overview</h2>
          <p className="text-sm text-gray-500">Manage your clients and their deals</p>
        </div>
        <button
          onClick={handleAddDeal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Deal
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6 text-center">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No clients yet. Click "Add Deal" to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {client.email && <div>{client.email}</div>}
                        {client.phone && <div>{client.phone}</div>}
                        {!client.email && !client.phone && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {client.deal_count || 0} deal{(client.deal_count || 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.total_value ? `$${parseFloat(client.total_value).toLocaleString()}` : '$0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.last_deal_date ? new Date(client.last_deal_date).toLocaleDateString() : 
                       new Date(client.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Deal</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Type client name (existing or new)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{client.name}</div>
                          {client.company && (
                            <div className="text-sm text-gray-500">{client.company}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Client Indicator */}
                  {selectedClient && (
                    <div className="mt-1 text-sm text-green-600">
                      ✓ Selected existing client: {selectedClient.name}
                      {selectedClient.company && ` (${selectedClient.company})`}
                    </div>
                  )}
                  
                  {/* New Client Indicator */}
                  {!selectedClient && searchTerm && filteredClients.length === 0 && (
                    <div className="mt-1 text-sm text-blue-600">
                      ➕ Will create new client: {searchTerm}
                    </div>
                  )}
                </div>

                {/* Client Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({...formData, clientCompany: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <hr className="my-4" />
                
                {/* Deal Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deal Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.dealTitle}
                    onChange={(e) => setFormData({...formData, dealTitle: e.target.value})}
                    placeholder="e.g., Website Redesign, Q1 Marketing Campaign"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Deal Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({...formData, dealValue: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.dealStatus}
                    onChange={(e) => setFormData({...formData, dealStatus: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows="3"
                    value={formData.dealNotes}
                    onChange={(e) => setFormData({...formData, dealNotes: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add Deal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
