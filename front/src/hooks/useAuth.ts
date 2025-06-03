import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useSafeWallet } from './useSafeWallet';
import { authService } from '../services/auth/authService';
import { apiClient } from '../services/api/api.client';

interface User {
  walletAddress: string;
  displayName: string;
  email: string;
  role: 'student' | 'instructor' | 'admin' | 'moderator';
}

interface AuthHookReturn {
  user: User | null;
  loading: boolean;
  showRegister: boolean;
  setShowRegister: Dispatch<SetStateAction<boolean>>;
  handleRegister: (userData: any) => Promise<User | null>; 
  logout: () => void;
}

export function useAuth(): AuthHookReturn {
  // Usar el hook seguro para wallet
  const { publicKey, connected, disconnect, error: walletError } = useSafeWallet();
  
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);

  // Log wallet errors silently
  useEffect(() => {
    if (walletError) {
      console.warn('[useAuth] Wallet error detected but continuing:', walletError.message);
    }
  }, [walletError]);

  const persistState = (user: User | null) => {
    if (user) {
      // Store auth state in localStorage for persistence
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      // Remove when logging out or no user
      localStorage.removeItem('authUser');
    }
  };

  const setAuthUser = (newUser: User | null, force = false) => {
    // Si newUser es null y no se fuerza el cambio, verificar localStorage primero
    if (!newUser && !force) {
      try {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && parsedUser.walletAddress) {
            // No sobrescribir con null si tenemos un usuario en localStorage
            setUser(parsedUser);
            // Configurar el header de autenticación automáticamente
            apiClient.setAuthHeader(parsedUser.walletAddress);
            return;
          }
        }
      } catch (err) {
        console.error('[useAuth] Error checking localStorage during setAuthUser');
      }
    }
    
    // Si forzamos o no hay usuario en localStorage, proceder normalmente
    persistState(newUser); // Persist authentication state
    setUser(newUser);
    
    // Configurar o limpiar el header de autenticación automáticamente
    if (newUser && newUser.walletAddress) {
      console.log('[useAuth] Setting auth header for user:', newUser.walletAddress);
      apiClient.setAuthHeader(newUser.walletAddress);
    } else {
      console.log('[useAuth] Clearing auth header (user logged out)');
      // No hay método para limpiar headers, pero defaultOptions se mantendrán hasta que se establezca otro
    }
  }

  // OPTIMIZED: Only run once on mount to restore auth state
  useEffect(() => {
    // Try to restore authentication state from localStorage on initial load
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Configurar el header de autenticación automáticamente al restaurar desde localStorage
        if (parsedUser && parsedUser.walletAddress) {
          console.log('[useAuth] Restoring auth header from localStorage:', parsedUser.walletAddress);
          apiClient.setAuthHeader(parsedUser.walletAddress);
        }
        setLoading(false);
      } catch (error) {
        localStorage.removeItem('authUser');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency array - only run once

  // OPTIMIZED: Debounce wallet state changes to prevent rapid re-renders
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isComponentMounted = true;

    const checkUser = async () => {
      // Si no hay wallet disponible, mantener el usuario de localStorage y no hacer cambios
      if (!connected) {
        if (isComponentMounted) {
          setLoading(false);
        }
        return;
      }
      
      // Solo proceed if connected and publicKey is available
      if (connected && publicKey) {
        try {
          if (isComponentMounted) {
            setLoading(true);
          }
          const walletAddress = publicKey.toString();
          
          try {
            const existingUser: User | null = await authService.checkUserExists(walletAddress);
                      
            if (isComponentMounted) {
              if (existingUser) {
                setAuthUser(existingUser); 
                setShowRegister(false);
              } else {
                setAuthUser(null, true); // Forzar null si el API dice que el usuario no existe
                setShowRegister(true);
              }
            }
          } catch (error: any) {
            if (!isComponentMounted) return;

            console.warn('[useAuth] Error checking user existence:', error);

            // Manejar explícitamente errores de conexión
            if (error.message && (
                error.message.includes('Network Error') ||
                error.message.includes('Connection refused') ||
                error.message.includes('ERR_CONNECTION_REFUSED') ||
                error.name === 'AbortError' ||
                error.code === 'NETWORK_ERROR'
            )) {
              // Verificar si hay usuario almacenado en localStorage para modo offline
              const savedUser = localStorage.getItem('authUser');
              if (savedUser) {
                try {
                  const parsedUser = JSON.parse(savedUser);
                  setAuthUser(parsedUser);
                  // Configurar el header de autenticación también en modo offline
                  if (parsedUser && parsedUser.walletAddress) {
                    apiClient.setAuthHeader(parsedUser.walletAddress);
                  }
                  setShowRegister(false);
                } catch (parseError) {
                  // No establecer usuario a null, mantener el estado actual
                  setShowRegister(false); // No mostrar registro en modo offline
                }
              } else {
                // No establecer usuario a null si ya hay un usuario en el estado
                if (!user) {
                  setAuthUser(null);
                }
                setShowRegister(false); // No mostrar registro en modo offline
              }
            } else {
              // Otros errores - no establecer usuario a null si ya hay un usuario en el estado
              if (!user) {
                setAuthUser(null);
              }
              setShowRegister(true);
            }
          }
        } catch (error) {
          if (!isComponentMounted) return;
          
          console.error('[useAuth] Unexpected error in wallet check:', error);
          
          // En caso de error inesperado, mantener estado actual
          if (!user) {
            // Solo limpiar si no hay usuario actual
            setAuthUser(null); 
          }
          setShowRegister(false); // Error general, mejor no mostrar register
        } finally {
          if (isComponentMounted) {
            setLoading(false);
          }
        }
      } else {
        if (!isComponentMounted) return;
        // No establecer usuario a null automáticamente, verificar localStorage primero
        const savedUser = localStorage.getItem('authUser');
        if (savedUser && !user) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Configurar el header de autenticación
            if (parsedUser && parsedUser.walletAddress) {
              apiClient.setAuthHeader(parsedUser.walletAddress);
            }
          } catch (parseError) {
            // Error parsing localStorage, clear it
            localStorage.removeItem('authUser');
          }
        }
        setLoading(false);
        setShowRegister(false);
      }
    };

    // Debounce la verificación del usuario para evitar múltiples llamadas rápidas
    const debouncedCheckUser = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isComponentMounted) {
          checkUser().catch(error => {
            console.error('[useAuth] Error in debounced checkUser:', error);
          });
        }
      }, 300); // Delay de 300ms
    };

    debouncedCheckUser();

    return () => {
      isComponentMounted = false;
      clearTimeout(timeoutId);
    };
  }, [connected, publicKey?.toString()]); // Add wallet to dependencies for better tracking

  const handleRegister = async (userData: any): Promise<User | null> => { 
    try {
      const newUser: User = await authService.registerUser(userData);
      setAuthUser(newUser);
      return newUser;
    } catch (error) {
      console.error('[useAuth] Registration error:', error);
      throw error; // Re-throw para que el componente maneje el error
    }
  };

  const logout = () => {
    setAuthUser(null, true); // Force clear
    setShowRegister(false);
    // Disconnect wallet if available
    if (disconnect) {
      try {
        disconnect();
      } catch (error) {
        console.warn('[useAuth] Error disconnecting wallet:', error);
      }
    }
  };

  return {
    user,
    loading,
    showRegister,
    setShowRegister,
    handleRegister,
    logout,
  };
}