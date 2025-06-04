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
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser?.walletAddress) {
          console.log('[useAuth] Restoring auth header from localStorage:', parsedUser.walletAddress);
          apiClient.setAuthHeader(parsedUser.walletAddress);
        }
      } catch (error) {
        console.error('[useAuth] Error parsing saved user, clearing localStorage');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []); // Solo ejecutar una vez al montar

  // Efecto para limpiar usuario cuando la wallet se desconecta
  useEffect(() => {
    if (!connected && user) {
      console.log('[useAuth] Wallet disconnected, clearing user state');
      setAuthUser(null);
      setShowRegister(false);
    }
  }, [connected, user]);

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
  };
}