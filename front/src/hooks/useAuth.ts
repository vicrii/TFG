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
  checkUserForWallet: (walletAddress: string) => Promise<User | null>;
  isTabReturning: boolean;
}

export function useAuth(): AuthHookReturn {
  // Usar el hook seguro para wallet
  const { publicKey, connected, disconnect, error: walletError } = useSafeWallet();
  
  const [user, setUser] = useState<User | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTabReturning, setIsTabReturning] = useState(false);

  // Log wallet errors silently
  useEffect(() => {
    if (walletError) {
      console.warn('[useAuth] Wallet error detected but continuing:', walletError.message);
    }
  }, [walletError]);

  // Manejo del Page Visibility API para tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab se oculta
        console.log('[useAuth] Tab hidden');
      } else {
        // Tab se vuelve visible
        console.log('[useAuth] Tab visible again');
        if (isInitialized) {
          setIsTabReturning(true);
          // Dar tiempo para que los procesos se restauren
          setTimeout(() => {
            setIsTabReturning(false);
          }, 800); // Delay más largo para tabs
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized]);

  // Función para persistir estado en localStorage
  const persistState = (user: User | null) => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  };

  // Función para configurar usuario y headers
  const setAuthUser = (newUser: User | null) => {
    persistState(newUser);
    setUser(newUser);
    
    if (newUser && newUser.walletAddress) {
      console.log('[useAuth] Setting auth header for user:', newUser.walletAddress);
      apiClient.setAuthHeader(newUser.walletAddress);
    } else {
      console.log('[useAuth] User cleared, auth header removed');
    }
  };

  // Efecto para restaurar estado desde localStorage al inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Starting initialization...');
        
        // Dar tiempo a que los wallet adapters se inicialicen
        await new Promise(resolve => setTimeout(resolve, 300));
        
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
          console.log('[useAuth] Restoring user from localStorage:', parsedUser.walletAddress);
        setUser(parsedUser);
        if (parsedUser?.walletAddress) {
          apiClient.setAuthHeader(parsedUser.walletAddress);
          }
        }
        
        console.log('[useAuth] Initialization complete');
        setIsInitialized(true);
        
      } catch (error) {
        console.error('[useAuth] Error during initialization:', error);
        localStorage.removeItem('authUser');
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []); // Solo ejecutar una vez al montar

  // Efecto para controlar el loading state basado en inicialización
  useEffect(() => {
    if (isInitialized) {
      // Delay adicional para asegurar que todo esté estable
      const timer = setTimeout(() => {
        console.log('[useAuth] Setting loading to false');
        setLoading(false);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // Efecto para limpiar usuario cuando la wallet se desconecta
  useEffect(() => {
    if (!connected && user && isInitialized && !isTabReturning) {
      console.log('[useAuth] Wallet disconnected, clearing user state');
      setAuthUser(null);
      setShowRegister(false);
    }
  }, [connected, user, isInitialized, isTabReturning]);

  // Efecto para verificar usuario automáticamente cuando se conecta una wallet
  useEffect(() => {
    if (connected && publicKey && isInitialized && !isTabReturning) {
      const walletAddress = publicKey.toString();
      console.log('[useAuth] Wallet connected, checking user for:', walletAddress);
      
      // Solo verificar si no tenemos un usuario o si es una wallet diferente
      if (!user || user.walletAddress !== walletAddress) {
        checkUserForWallet(walletAddress);
      }
    }
  }, [connected, publicKey, isInitialized, isTabReturning, user]);

  // Función para verificar usuario manualmente (llamada desde componentes cuando necesiten)
  const checkUserForWallet = async (walletAddress: string) => {
    try {
      const existingUser = await authService.checkUserExists(walletAddress);
      
      if (existingUser) {
        setAuthUser(existingUser);
        setShowRegister(false);
        return existingUser;
      } else {
        setShowRegister(true);
        return null;
      }
    } catch (error: any) {
      console.warn('[useAuth] Error checking user for wallet:', error);
      
      if (!error.message?.includes('Network Error') && 
          !error.message?.includes('Connection refused')) {
        setShowRegister(true);
      }
      return null;
    }
  };

  // Función para manejar registro
  const handleRegister = async (userData: any): Promise<User | null> => { 
    try {
      const newUser: User = await authService.registerUser(userData);
      setAuthUser(newUser);
      return newUser;
    } catch (error) {
      console.error('[useAuth] Registration error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    showRegister,
    setShowRegister,
    handleRegister,
    checkUserForWallet, // Exponer función para verificación manual
    isTabReturning,
  };
}