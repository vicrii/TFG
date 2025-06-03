// Use dynamic API URL function similar to apiClient
const getApiUrl = () => {
  // En desarrollo, usar la variable de entorno o localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  // En producción (Railway), usar ruta relativa ya que frontend y backend están en el mismo dominio
  return '/api';
};

export const API_URL = getApiUrl(); 