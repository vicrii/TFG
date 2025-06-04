import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import axios from 'axios';

export type FontSize = 'small' | 'medium' | 'large';

interface UIPreferences {
  fontSize: FontSize;
  animationsEnabled: boolean;
}

interface UIContextType {
  fontSize: FontSize;
  animationsEnabled: boolean;
  setFontSize: (size: FontSize) => void;
  toggleAnimations: () => void;
  actualFontSize: string; // css value
}

const defaultUIPreferences: UIPreferences = {
  fontSize: 'medium',
  animationsEnabled: true
};

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
  user?: any; // Recibir user como prop en lugar de usar useAuth
}

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const getFontSizeValue = (size: FontSize): string => {
  switch (size) {
    case 'small': return '14px';
    case 'medium': return '16px';
    case 'large': return '18px';
    default: return '16px';
  }
};

export const UIProvider: React.FC<UIProviderProps> = ({ children, user }) => {
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
  
  // Memorizar el valor del tamaño de fuente actual para evitar cálculos innecesarios
  const actualFontSize = useMemo(() => 
    getFontSizeValue(uiPreferences.fontSize), 
    [uiPreferences.fontSize]
  );

  // Aplicar preferencias de UI
  const applyPreferences = useCallback(() => {
    // Aplicar modo claro siempre
    document.documentElement.setAttribute('data-bs-theme', 'light');
    
    // Aplicar tamaño de fuente global
    document.documentElement.style.setProperty('--base-font-size', actualFontSize);
    
    // Desactivar animaciones si es necesario
    document.documentElement.classList.toggle('disable-animations', !uiPreferences.animationsEnabled);
  }, [uiPreferences, actualFontSize]);

  // Aplicar preferencias cuando cambian
  useEffect(() => {
    applyPreferences();
  }, [uiPreferences, applyPreferences]);

  // Guardar las preferencias en localStorage
  useEffect(() => {
    localStorage.setItem('uiPreferences', JSON.stringify(uiPreferences));
  }, [uiPreferences]);

  // Funciones para cambiar las preferencias de UI
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

  // Memorizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    fontSize: uiPreferences.fontSize,
    animationsEnabled: uiPreferences.animationsEnabled,
    setFontSize,
    toggleAnimations,
    actualFontSize
  }), [
    uiPreferences,
    setFontSize,
    toggleAnimations,
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
  if (!context) {
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
  const { fontSize, toggleAnimations } = context;
  return { fontSize, toggleAnimations };
} 