// client/src/lib/strapiClient.js
import { strapi } from '@strapi/client';
import axios from 'axios';
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
  try {
    // Strapi v5: /users/me endpoint mungkin tidak support populate avatar
    // atau field name-nya berbeda. Fetch tanpa populate dulu, jika perlu avatar
    // bisa di-fetch terpisah atau gunakan populate dengan format yang benar
    const { data } = await strapiAxios.get('/users/me');
    return data;
  } catch (err) {
    throw err;
  }
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
// Note: Untuk Strapi v5, user hanya bisa update profile sendiri menggunakan /users/me endpoint
export const updateUser = async (userId, userData) => {
  // Strapi v5: Format data dengan wrapper { data: { ... } }
  // Handle avatar: Strapi v5 expect ID saja (number), bukan object
  let formattedData = { ...userData };
  
  // Handle avatar: Strapi v5 menggunakan relation 'avatar' dengan ID saja
  if (userData.avatarId) {
    // Format untuk Strapi v5: avatar sebagai relation ID (number saja, bukan object)
    formattedData.avatar = userData.avatarId; // ID saja, bukan object
    // Remove avatarId dan avatarUrl jika ada (disimpan sebagai relation)
    delete formattedData.avatarId;
    delete formattedData.avatarUrl;
  } else if (userData.avatar) {
    // Jika avatar adalah object { id, url }, extract ID saja
    if (typeof userData.avatar === 'object' && userData.avatar.id) {
      formattedData.avatar = userData.avatar.id; // Extract ID saja
    } else {
      // Jika avatar sudah ID, pakai langsung
      formattedData.avatar = userData.avatar;
    }
  }
  
  const updatePayload = {
    data: formattedData
  };

  // Always use /users/me for Strapi v5 (more secure and doesn't need userId)
  try {
    const { data } = await strapiAxios.put('/users/me', updatePayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return data;
  } catch (meErr) {
    // If /users/me fails, try without data wrapper (Strapi v4 style)
    try {
      const { data } = await strapiAxios.put('/users/me', formattedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return data;
    } catch (directErr) {
      throw directErr;
    }
  }
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
        // Jika string adalah '*' atau 'true', gunakan langsung
        if (value === '*' || value === 'true') {
          queryParts.push(`populate=*`);
        } else if (value.includes(',')) {
          // Jika string dengan comma, convert ke array format
          const populateFields = value.split(',').map(f => f.trim());
          populateFields.forEach((field, index) => {
            queryParts.push(`populate[${index}]=${field}`);
          });
        } else {
          queryParts.push(`populate=${encodeURIComponent(value)}`);
        }
      } else if (Array.isArray(value)) {
        // Jika sudah array
        value.forEach((field, index) => {
          queryParts.push(`populate[${index}]=${field}`);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Handle populate object format (Strapi v5 nested populate)
        // Contoh: { schedule: { populate: '*' }, konselor: true }
        Object.keys(value).forEach((field, index) => {
          const fieldValue = value[field];
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            // Nested populate seperti { schedule: { populate: '*' } }
            if (fieldValue.populate) {
              if (fieldValue.populate === '*') {
                queryParts.push(`populate[${field}][populate]=*`);
              } else {
                queryParts.push(`populate[${field}][populate]=${encodeURIComponent(fieldValue.populate)}`);
              }
            } else {
              // Complex nested object - convert to JSON string
              queryParts.push(`populate[${field}]=${encodeURIComponent(JSON.stringify(fieldValue))}`);
            }
          } else if (fieldValue === true) {
            // Simple populate: { konselor: true }
            queryParts.push(`populate[${field}]=true`);
          } else {
            queryParts.push(`populate[${field}]=${encodeURIComponent(fieldValue)}`);
          }
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
  
  try {
    const { data } = await strapiAxios.get(`${endpoint}?${query}`);
    return data;
  } catch (error) {
    throw error;
  }
};

