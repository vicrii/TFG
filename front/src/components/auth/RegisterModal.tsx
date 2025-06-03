import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

interface RegisterModalProps {
  show: boolean;
  walletAddress: string;
  onSubmit: (userData: any) => Promise<void>;
  onClose: () => void;
}

function RegisterModal({ show, walletAddress, onSubmit, onClose }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit({
        walletAddress,
        ...formData
      });
      onClose();
    } catch (err) {
      setError('Error al registrar usuario. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>Completa tu Perfil</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre de Usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Elige un nombre de usuario"
              value={formData.displayName}
              onChange={(e) => setFormData({
                ...formData,
                displayName: e.target.value
              })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({
                ...formData,
                email: e.target.value
              })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Cuéntanos sobre ti..."
              value={formData.bio}
              onChange={(e) => setFormData({
                ...formData,
                bio: e.target.value
              })}
            />
          </Form.Group>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Completar Registro'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default RegisterModal;