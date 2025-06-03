import React from 'react';
import { Spinner } from 'react-bootstrap';
import { LoadingSpinnerProps } from '../../types/common.types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size, text }) => {
  return (
    <div className="d-flex flex-column align-items-center">
      <Spinner animation="border" size={size} />
      {text && <span className="mt-2">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;