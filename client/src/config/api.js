// client/src/config/api.js
const API_CONFIG = {
  // Automatically detect environment
  BASE_URL: import.meta.env.PROD 
    ? 'https://pretty-youthfulness-production.up.railway.app'  // Your Railway URL
    : 'http://localhost:5000',  // Local development
    
  // API endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
    PROFILE: '/api/account/profile',
    PASSWORD: '/api/account/password',
    CLIENTS: '/api/clients',
    TASKS: '/api/tasks',
    USERS: '/api/users'
  }
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Common API headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API helper functions
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const config = {
    headers: getAuthHeaders(),
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default API_CONFIG;
