import { apiClient } from '../api/api.client';

// Interfaces
export interface UserData {
  walletAddress: string;
  displayName: string;
  email: string;
  bio?: string;
  role: 'student' | 'instructor' | 'admin' | 'moderator';
  createdAt: string;
  settings?: {
    displayName?: string;
    email?: string;
    profileImage?: string;
    notificationPreferences?: {
      emailNotifications: boolean;
      courseUpdates: boolean;
      examReminders: boolean;
      achievements: boolean;
    };
    privacySettings?: {
      showProgress: boolean;
      showActivity: boolean;
      showAchievements: boolean;
    };
    uiPreferences?: {
      theme: 'light' | 'dark' | 'system';
      fontSize: 'small' | 'medium' | 'large';
      codeEditorTheme: 'vs-dark' | 'light';
    };
  };
}

// API para autenticación
export const authApi = {
  /**
   * Verifica si un usuario existe por su dirección de wallet
   */
  async checkUserExists(walletAddress: string): Promise<UserData | null> {
    try {
      try {
        const user = await apiClient.get<UserData>(`/users/${walletAddress}`);
        return user;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error(`Error checking if user exists for wallet ${walletAddress}:`, error);
      
      // En caso de error de conexión, verificar si hay datos guardados
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout'))) {
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
          try {
            const userData = JSON.parse(authUser);
            if (userData.walletAddress === walletAddress) {
              console.log('Using cached user data due to connection error');
              return userData;
            }
          } catch (e) {
            console.error('Error parsing cached user data:', e);
          }
        }
      }
      
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario
   */
  async registerUser(userData: {
    walletAddress: string;
    displayName: string;
    email: string;
    bio?: string;
    role?: 'student' | 'instructor' | 'admin' | 'moderator';
  }): Promise<UserData> {
    try {
      return await apiClient.post<UserData>('/users', userData);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  /**
   * Verifica la conexión con el backend
   */
  async checkBackendConnection(): Promise<boolean> {
    try {
      await apiClient.get('/health');
      return true;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  },

  /**
   * Obtiene la dirección de wallet almacenada en localStorage
   */
  getStoredWalletAddress(): string | null {
    try {
      const authUser = localStorage.getItem('authUser');
      if (!authUser) return null;
      
      const user = JSON.parse(authUser);
      return user.walletAddress || null;
    } catch (error) {
      console.error('Error getting stored wallet address:', error);
      return null;
    }
  }
};

// Exportar el servicio de autenticación con el método setWalletAddress añadido
export const authService = {
  ...authApi,
  
  setWalletAddress(walletAddress: string) {
    // Utilizar el método del apiClient para establecer la cabecera de autenticación
    apiClient.setAuthHeader(walletAddress);
    return walletAddress;
  }
}; 