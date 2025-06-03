import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export type Theme = 'light' | 'dark' | 'system';
export type CodeEditorTheme = 'vs-dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large';

interface UIPreferences {
  theme: Theme;
  codeEditorTheme: CodeEditorTheme;
  fontSize: FontSize;
  animationsEnabled: boolean;
  highContrastMode: boolean;
}

interface UIContextType {
  theme: Theme;
  codeEditorTheme: CodeEditorTheme;
  fontSize: FontSize;
  animationsEnabled: boolean;
  highContrastMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setCodeEditorTheme: (theme: CodeEditorTheme) => void;
  setFontSize: (size: FontSize) => void;
  toggleAnimations: () => void;
  toggleHighContrast: () => void;
  isDarkMode: boolean;
  actualFontSize: string; // css value
}

const defaultUIPreferences: UIPreferences = {
  theme: 'system',
  codeEditorTheme: 'vs-dark',
  fontSize: 'medium',
  animationsEnabled: true,
  highContrastMode: false
};

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

// Use dynamic API URL function similar to apiClient
const getApiUrl = () => {
  // En desarrollo, usar la variable de entorno o localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  // En producción (Railway), usar ruta relativa ya que frontend y backend están en el mismo dominio
  return '/api';
};

const getFontSizeValue = (size: FontSize): string => {
  switch (size) {
    case 'small': return '0.875rem'; // 14px
    case 'large': return '1.125rem'; // 18px
    case 'medium':
    default: return '1rem'; // 16px
  }
};

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Inicializar el estado con valores guardados en localStorage
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(() => {
    try {
      const storedPreferences = localStorage.getItem('uiPreferences');
      if (storedPreferences) {
        return { 
          ...defaultUIPreferences,
          ...JSON.parse(storedPreferences) 
        } as UIPreferences;
      }
    } catch (error) {
      console.error('Error parsing stored UI preferences:', error);
    }
    return defaultUIPreferences;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Memorizar el valor del tamaño de fuente actual para evitar cálculos innecesarios
  const actualFontSize = useMemo(() => 
    getFontSizeValue(uiPreferences.fontSize), 
    [uiPreferences.fontSize]
  );

  // Función para detectar si el sistema prefiere modo oscuro
  const getSystemThemePreference = useCallback((): boolean => {
    return window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Aplicar tema oscuro o claro según las preferencias
  const applyTheme = useCallback(() => {
    let useDarkMode = false;
    
    if (uiPreferences.theme === 'dark') {
      useDarkMode = true;
    } else if (uiPreferences.theme === 'system') {
      useDarkMode = getSystemThemePreference();
    }
    
    setIsDarkMode(useDarkMode);
    
    // Aplicar tema a Bootstrap
    document.documentElement.setAttribute('data-bs-theme', useDarkMode ? 'dark' : 'light');
    
    // Aplicar alto contraste si está activado
    if (uiPreferences.highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Aplicar tamaño de fuente global
    document.documentElement.style.setProperty('--base-font-size', actualFontSize);
    
    // Desactivar animaciones si es necesario
    document.documentElement.classList.toggle('disable-animations', !uiPreferences.animationsEnabled);
  }, [uiPreferences, getSystemThemePreference, actualFontSize]);

  // Escuchar cambios en el tema del sistema operativo
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Cuando cambia el tema del sistema, actualizar si estamos en modo 'system'
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (uiPreferences.theme === 'system') {
        applyTheme();
      }
    };

    // Añadir event listener para cambios en el tema del sistema
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if ('addListener' in mediaQuery) {
      // Para compatibilidad con navegadores antiguos
      // @ts-ignore - TypeScript no reconoce esta propiedad obsoleta pero necesaria para algunos navegadores
      mediaQuery.addListener(handleSystemThemeChange);
    }

    // Ejecutar inicialmente para establecer el tema
    applyTheme();

    // Limpiar event listener
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if ('removeListener' in mediaQuery) {
        // @ts-ignore
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [uiPreferences.theme, applyTheme]);

  // Aplicar preferencias cuando cambian
  useEffect(() => {
    applyTheme();
  }, [uiPreferences, applyTheme]);

  // Cargar las preferencias del usuario cuando inicia sesión
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user?.walletAddress) return;
      
      try {
        const response = await axios.get(`${getApiUrl()}/users/settings`, {
          headers: {
            'x-wallet-address': user.walletAddress
          }
        });
        
        if (response.data && response.data.uiPreferences) {
          // Actualizar solo si hay datos válidos de preferencias de UI
          setUIPreferences(prev => ({
            ...prev,
            ...response.data.uiPreferences
          }));
        }
      } catch (error) {
        // No mostrar error si es 404 (usuario nuevo sin preferencias guardadas)
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          console.error('Error loading user UI preferences:', error);
        }
      }
    };

    fetchUserPreferences();
  }, [user?.walletAddress]);

  // Guardar las preferencias en localStorage
  useEffect(() => {
    localStorage.setItem('uiPreferences', JSON.stringify(uiPreferences));
  }, [uiPreferences]);

  // Funciones para cambiar las preferencias de UI
  const toggleTheme = useCallback(() => {
    setUIPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setUIPreferences(prev => ({
      ...prev,
      theme
    }));
  }, []);

  const setCodeEditorTheme = useCallback((codeEditorTheme: CodeEditorTheme) => {
    setUIPreferences(prev => ({
      ...prev,
      codeEditorTheme
    }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setUIPreferences(prev => ({
      ...prev,
      fontSize
    }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setUIPreferences(prev => ({
      ...prev,
      animationsEnabled: !prev.animationsEnabled
    }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setUIPreferences(prev => ({
      ...prev,
      highContrastMode: !prev.highContrastMode
    }));
  }, []);

  // Memorizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    theme: uiPreferences.theme,
    codeEditorTheme: uiPreferences.codeEditorTheme,
    fontSize: uiPreferences.fontSize,
    animationsEnabled: uiPreferences.animationsEnabled,
    highContrastMode: uiPreferences.highContrastMode,
    toggleTheme,
    setTheme,
    setCodeEditorTheme,
    setFontSize,
    toggleAnimations,
    toggleHighContrast,
    isDarkMode,
    actualFontSize
  }), [
    uiPreferences,
    toggleTheme,
    setTheme,
    setCodeEditorTheme,
    setFontSize,
    toggleAnimations,
    toggleHighContrast,
    isDarkMode,
    actualFontSize
  ]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}; 

// Reemplazamos el hook useTheme con una implementación directa para compatibilidad con Fast Refresh
export function useTheme() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a UIProvider');
  }
  const { theme, toggleTheme, isDarkMode } = context;
  return { theme, toggleTheme, isDarkMode };
} 