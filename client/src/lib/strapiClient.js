// client/src/lib/strapiClient.js
import { strapi } from '@strapi/client';
import axios from 'axios';
import qs from 'qs';
import { userData } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

// Strapi client untuk collections
export const getStrapiClient = () => {
  const { jwt } = userData();
  return strapi({ 
    baseURL: `${API_URL}/api`,
    token: jwt 
  });
};

// Axios instance untuk auth endpoints (tidak perlu token)
export const strapiAuthAxios = axios.create({
  baseURL: `${API_URL}/api`,
});

// Axios instance untuk custom endpoints (perlu token)
export const strapiAxios = axios.create({
  baseURL: `${API_URL}/api`,
});

// Auto-inject token untuk axios (kecuali auth endpoints)
strapiAxios.interceptors.request.use((config) => {
  const { jwt } = userData();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

// Error handling interceptor
strapiAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Convenience methods untuk custom endpoints
export const fetchCurrentUser = async () => {
  const { data } = await strapiAxios.get('/users/me');
  return data;
};

export const getCurrentUserId = async () => {
  const user = await fetchCurrentUser();
  return user?.id || user?.data?.id;
};

// Auth methods (tidak perlu token)
export const login = async (identifier, password) => {
  const { data } = await strapiAuthAxios.post('/auth/local', {
    identifier,
    password,
  });
  return data;
};

export const register = async (userData) => {
  const { data } = await strapiAuthAxios.post('/auth/local/register', userData);
  return data;
};

// File upload
export const uploadFile = async (file, name = null) => {
  const formData = new FormData();
  formData.append('files', file);
  if (name) {
    formData.append('name', name);
  }
  const { data } = await strapiAxios.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// Update user
export const updateUser = async (userId, userData) => {
  const { data } = await strapiAxios.put(`/users/${userId}`, userData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
};

// Helper untuk build query string dengan qs (untuk query kompleks yang tidak support di Strapi client)
export const buildStrapiQuery = (params) => {
  const queryParts = [];
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    
    // Handle string keys dengan brackets (seperti 'filters[student][id]')
    if (key.includes('[')) {
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    } else if (key === 'populate') {
      // Handle populate - format array untuk multiple populate
      if (typeof value === 'string') {
        // Jika string dengan comma, convert ke array format
        const populateFields = value.split(',').map(f => f.trim());
        populateFields.forEach((field, index) => {
          queryParts.push(`populate[${index}]=${field}`);
        });
      } else if (Array.isArray(value)) {
        // Jika sudah array
        value.forEach((field, index) => {
          queryParts.push(`populate[${index}]=${field}`);
        });
      } else {
        queryParts.push(`populate=${encodeURIComponent(value)}`);
      }
    } else if (key === 'filters' && typeof value === 'object') {
      // Handle filters object
      if (value.student?.id) {
        queryParts.push(`filters[student][id]=${value.student.id}`);
      }
      if (value.statusJadwal) {
        queryParts.push(`filters[statusJadwal]=${encodeURIComponent(value.statusJadwal)}`);
      }
      // Handle $and operator
      if (value.$and && Array.isArray(value.$and)) {
        value.$and.forEach((filter, index) => {
          if (filter.student?.id) {
            queryParts.push(`filters[$and][${index}][student][id]=${filter.student.id}`);
          }
          if (filter.statusJadwal) {
            queryParts.push(`filters[$and][${index}][statusJadwal]=${encodeURIComponent(filter.statusJadwal)}`);
          }
        });
      }
    } else {
      // Regular params
      queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  });
  
  return queryParts.join('&');
};

// Fetch dengan axios untuk query kompleks (fallback jika Strapi client tidak support)
export const fetchWithQuery = async (endpoint, queryParams) => {
  const query = buildStrapiQuery(queryParams);
  const fullUrl = `${strapiAxios.defaults.baseURL}${endpoint}?${query}`;
  
  console.log('🔍 Request URL:', fullUrl);
  
  try {
    const { data } = await strapiAxios.get(`${endpoint}?${query}`);
    
    // Log response structure untuk debugging Strapi v5
    console.log('✅ Response structure:', {
      hasData: !!data.data,
      isArray: Array.isArray(data.data),
      dataLength: data.data?.length,
      firstItem: data.data?.[0],
      firstItemKeys: data.data?.[0] ? Object.keys(data.data[0]) : null,
      hasAttributes: data.data?.[0]?.attributes !== undefined,
      hasDocumentId: data.data?.[0]?.documentId !== undefined,
      hasId: data.data?.[0]?.id !== undefined,
    });
    
    return data;
  } catch (error) {
    console.error('❌ Query failed:', fullUrl);
    console.error('❌ Error response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

