import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Container, Alert, Button, Card } from 'react-bootstrap';
import { FaBug, FaHome, FaRedo } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para que el siguiente renderizado muestre la UI alternativa
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
   
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <Container className="py-5">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-danger text-white py-3">
              <h2 className="mb-0 d-flex align-items-center">
                <FaBug className="me-2" /> 
                ¡Ups! Algo salió mal
              </h2>
            </Card.Header>
            <Card.Body className="p-4">
              <Alert variant="danger">
                <p className="mb-0">
                  Se ha producido un error en la aplicación. Esto podría deberse a un problema temporal o a un error en el código.
                </p>
              </Alert>

              <h5 className="mt-4">¿Qué puedo hacer?</h5>
              <ul className="mt-3">
                <li>Intenta recargar la página para resolver problemas temporales.</li>
                <li>Limpia la caché del navegador si el problema persiste.</li>
                <li>Regresa a la página principal e intenta nuevamente más tarde.</li>
                <li>Si el problema continúa, contacta al soporte técnico.</li>
              </ul>

              <div className="mt-4 d-flex gap-3">
                <Button 
                  variant="primary" 
                  onClick={this.handleReset}
                  className="d-flex align-items-center"
                >
                  <FaRedo className="me-2" />
                  Intentar de nuevo
                </Button>
                <Button 
                  variant="outline-primary" 
                  as={Link as any} 
                  to="/"
                  className="d-flex align-items-center"
                >
                  <FaHome className="me-2" />
                  Ir a la página principal
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4">
                  <h6 className="text-danger">Detalles del error (solo visible en desarrollo):</h6>
                  <div className="bg-light p-3 rounded" style={{ fontFamily: 'monospace', fontSize: '0.9rem', overflowX: 'auto' }}>
                    <p className="mb-2">{this.state.error?.toString()}</p>
                    <pre className="mb-0">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 