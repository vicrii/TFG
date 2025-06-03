// Configuración del cliente API base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Timeout para las solicitudes en ms - aumentado para operaciones de analytics
const TIMEOUT_MS = 15000; // 15 segundos

/**
 * Función para crear un objeto AbortController con timeout
 */
const createAbortController = (timeoutMs: number = TIMEOUT_MS): { controller: AbortController; signal: AbortSignal } => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    // Timeout silencioso - no mostrar warning
    controller.abort();
  }, timeoutMs);
  
  // Limpiar timeout si la petición se completa antes
  const originalSignal = controller.signal;
  originalSignal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });
  
  return {
    controller,
    signal: originalSignal
  };
};

/**
 * Opciones por defecto para las peticiones fetch
 */
let defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Para enviar cookies
};

/**
 * Cliente API básico para realizar peticiones HTTP
 */
export const apiClient = {
  /**
   * Envía una petición GET a la API
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Usar timeout más largo para operaciones de analytics
    const isAnalyticsRequest = endpoint.includes('/analytics');
    const timeoutMs = isAnalyticsRequest ? 30000 : TIMEOUT_MS; // 30 segundos para analytics
    
    const { signal } = createAbortController(timeoutMs);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        method: 'GET',
        signal,
      });
      
      if (!response.ok) {
        await this.handleError(response);
      }
      
      const data = await response.json();
      
      // Debug específico para contenido de lecciones
      if (endpoint.includes('/lessons/') && !endpoint.includes('/by-course/')) {
        console.log(`Lesson content check for ${endpoint}:`, {
          hasContent: !!data.content,
          contentLength: data.content ? data.content.length : 0,
          contentStart: data.content ? data.content.substring(0, 50) + '...' : 'No content'
        });
      }
      
      console.log(`API Response for ${endpoint}:`, data);
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds. This might be due to the backend not running or taking too long to respond.`);
      }
      throw error;
    }
  },
  
  /**
   * Envía una petición POST a la API
   */
  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const { signal } = createAbortController();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      signal,
    });
    
    if (!response.ok) {
      await this.handleError(response);
    }
    
    return await response.json();
  },
  
  /**
   * Envía una petición PUT a la API
   */
  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    const { signal } = createAbortController();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      signal,
    });
    
    if (!response.ok) {
      await this.handleError(response);
    }
    
    return await response.json();
  },
  
  /**
   * Envía una petición PATCH a la API
   */
  async patch<T>(endpoint: string, data: any = {}, options: RequestInit = {}): Promise<T> {
    const { signal } = createAbortController();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
      signal,
    });
    
    if (!response.ok) {
      await this.handleError(response);
    }
    
    return await response.json();
  },
  
  /**
   * Envía una petición DELETE a la API
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { signal } = createAbortController();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      method: 'DELETE',
      signal,
    });
    
    if (!response.ok) {
      await this.handleError(response);
    }
    
    return await response.json();
  },
  
  /**
   * Establece la dirección de wallet como cabecera para autenticación
   */
  setAuthHeader(walletAddress: string): RequestInit {
    if (!walletAddress) {
      console.error('Error: Attempting to set auth header with empty wallet address');
      return {};
    }
    
    console.log('Setting auth header for wallet:', walletAddress);
    
    // Actualizar defaultOptions globalmente
    defaultOptions = {
      ...defaultOptions,
      headers: {
        ...((defaultOptions.headers || {}) as Record<string, string>),
        'x-wallet-address': walletAddress,
      },
    };
    
    // También devolver las opciones específicas para esta petición
    return {
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': walletAddress,
      },
      credentials: 'include',
    };
  },
  
  /**
   * Maneja errores de la API
   */
  async handleError(response: Response): Promise<never> {
    let errorMessage = `Error: ${response.status}`;
    
    try {
      const text = await response.text();
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto directamente
      if (text) {
        errorMessage = text;
      }
      }
    } catch (e) {
      // Si no se puede leer el texto, usar el mensaje de error por defecto
      console.error('Error reading response:', e);
    }
    
    throw new Error(errorMessage);
  },
}; 