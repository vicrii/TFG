import React from 'react';
import { Container } from 'react-bootstrap';
import { AppFooterProps } from '../../types/common.types';

const AppFooter: React.FC<AppFooterProps> = ({ className }) => {
  return (
    <footer className={`py-3 bg-light ${className || ''}`}>
      <Container>
        <p className="text-center mb-0">
          © {new Date().getFullYear()} Solana Learn. Todos los derechos reservados.
        </p>
      </Container>
    </footer>
  );
};

export default AppFooter;