import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../config/api';

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Edit states for inline editing
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile form state (keeping your existing structure)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });

  // Password form state (keeping your existing structure)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile on component mount (keeping your existing function)
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(getApiUrl('/api/account/profile'), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileForm({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          username: data.user.username
        });
        // Set edit values for inline editing
        setEditValues({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          username: data.user.username || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  // Keep your existing handleProfileSubmit function but modify for inline editing
  const handleFieldSave = async (field) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      // Update profileForm with current edit values
      const updatedProfileForm = {
        firstName: editValues.firstName,
        lastName: editValues.lastName,
        email: editValues.email,
        username: editValues.username
      };

      const response = await fetch(getApiUrl('/api/account/profile'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedProfileForm)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setProfileForm(updatedProfileForm);
        setEditingField(null);
        setMessage('Profile updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  // Keep your existing handlePasswordSubmit function
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/account/password'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordModal(false);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('Network error updating password');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldEdit = (field) => {
    setEditingField(field);
    setError('');
    setMessage('');
  };

  const handleFieldCancel = () => {
    // Reset to original values
    setEditValues({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || ''
    });
    setEditingField(null);
    setError('');
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || user?.email || 'User';
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8">
      {/* Success/Error Messages */}
      {message && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <div className="mb-8 flex items-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-6">
          <span className="text-xl font-semibold text-blue-700">
            {getInitials()}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-semibold text-gray-900">{getDisplayName()}</h1>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
            Admin
          </span>
        </div>
      </div>

      {/* Account Settings List */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {/* Email Address */}
        <div className="p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Email address</h3>
            </div>
            <div className="flex-1">
              {editingField === 'email' ? (
                <div className="flex items-center justify-end space-x-3">
                  <input
                    type="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues({...editValues, email: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                  <button
                    onClick={() => handleFieldSave('email')}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">{user?.email}</p>
                  <button
                    onClick={() => handleFieldEdit('email')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* First Name */}
        <div className="p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">First name</h3>
            </div>
            <div className="flex-1">
              {editingField === 'firstName' ? (
                <div className="flex items-center justify-end space-x-3">
                  <input
                    type="text"
                    value={editValues.firstName}
                    onChange={(e) => setEditValues({...editValues, firstName: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                  <button
                    onClick={() => handleFieldSave('firstName')}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">{user?.firstName || 'Not set'}</p>
                  <button
                    onClick={() => handleFieldEdit('firstName')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Last Name */}
        <div className="p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Last name</h3>
            </div>
            <div className="flex-1">
              {editingField === 'lastName' ? (
                <div className="flex items-center justify-end space-x-3">
                  <input
                    type="text"
                    value={editValues.lastName}
                    onChange={(e) => setEditValues({...editValues, lastName: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                  <button
                    onClick={() => handleFieldSave('lastName')}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">{user?.lastName || 'Not set'}</p>
                  <button
                    onClick={() => handleFieldEdit('lastName')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Username</h3>
            </div>
            <div className="flex-1">
              {editingField === 'username' ? (
                <div className="flex items-center justify-end space-x-3">
                  <input
                    type="text"
                    value={editValues.username}
                    onChange={(e) => setEditValues({...editValues, username: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                  />
                  <button
                    onClick={() => handleFieldSave('username')}
                    disabled={saving}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleFieldCancel}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">{user?.username || 'Not set'}</p>
                  <button
                    onClick={() => handleFieldEdit('username')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="p-6">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Password</h3>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 mb-1">Set a unique password to protect your account.</p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Change Password →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
