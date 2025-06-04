import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class WalletErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    // Detectar si es un error de wallet específico
    const isWalletError = error.message?.includes('WalletConnectionError') ||
                          error.message?.includes('WalletNotConnectedError') ||
                          error.message?.includes('Unexpected error') ||
                          error.name?.includes('Wallet');
    
    if (isWalletError) {
      // Completamente silenciado - no mostrar nada en consola
      return { hasError: false };
    }
    
    // Para otros errores, sí mostrar el error boundary
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isWalletError = error.message?.includes('WalletConnectionError') ||
                          error.message?.includes('WalletNotConnectedError') ||
                          error.message?.includes('Unexpected error') ||
                          error.name?.includes('Wallet');
    
    if (isWalletError) {
      return;
    }
    
    // Para errores no relacionados con wallet, loggear normalmente
    console.error('[WalletErrorBoundary] Error no relacionado con wallet:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-3 text-center">
          <p>Error en la aplicación. Por favor, recarga la página.</p>
          <button 
            className="btn btn-primary" 
            onClick={this.handleReset}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary; 