import React from 'react';
import { Alert } from 'react-bootstrap'; // Assuming you use react-bootstrap

interface ErrorMessageProps {
  message: string | null; // Allow null to easily hide the component
  variant?: string; // Optional: Allow different alert styles (e.g., 'warning')
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, variant = 'danger' }) => {
  if (!message) {
    return null; // Don't render anything if there's no message
  }

  return (
    <Alert variant={variant} className="my-3"> {/* Add some margin */}
      <Alert.Heading as="h6">Error</Alert.Heading> {/* Optional heading */}
      <p className="mb-0">{message}</p>
    </Alert>
  );
};

export default ErrorMessage;