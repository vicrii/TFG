import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { LazyLoaderProps } from '../../types/common.types';

// Función de ayuda para crear componentes lazy
export const createLazyComponent = (importFunc: () => Promise<{ default: ComponentType<any> }>) => {
  return lazy(importFunc);
};

const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  component: Component, 
  fallback,
  loadingText = 'Cargando...',
  props = {}
}) => {
  const defaultFallback = <LoadingSpinner text={loadingText} />;
  
  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...props} />
    </Suspense>
  );
};

export default LazyLoader; 