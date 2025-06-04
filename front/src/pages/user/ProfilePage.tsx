import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { FaUser, FaWallet, FaCalendarAlt, FaStar } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<any>({
    name: '',
    bio: '',
    avatarUrl: '',
    role: 'student',
    createdAt: ''
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.walletAddress) {
      fetchUserProfile();
    }
  }, [user?.walletAddress]);
  
  const fetchUserProfile = async () => {
    if (!user?.walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      userService.setWalletAddress(user.walletAddress);
      const userData = await userService.getUserDetails(user.walletAddress);
      
      setProfile({
        name: userData.displayName || 'Usuario',
        bio: userData.bio || 'Sin biografía disponible',
        avatarUrl: '',
        role: userData.role || 'student',
        createdAt: userData.createdAt || new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'instructor': return 'primary';
      case 'moderator': return 'warning';
      default: return 'success';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'instructor': return 'Instructor';
      case 'moderator': return 'Moderador';
      default: return 'Estudiante';
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={6}>
            <Alert variant="warning" className="text-center">
              <FaUser size={48} className="mb-3" />
              <h4>Autenticación requerida</h4>
              <p>Por favor conecta tu wallet para acceder a tu perfil.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          {loading ? (
            <Card className="shadow-lg border-0">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <h5 className="mt-3 text-muted">Cargando perfil...</h5>
              </Card.Body>
            </Card>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              <h4>Error al cargar el perfil</h4>
              <p>{error}</p>
            </Alert>
          ) : (
            <div className="profile-container">
              {/* Tarjeta principal del perfil */}
              <Card className="shadow-lg border-0 overflow-hidden">
                {/* Header con gradiente */}
                <div 
                  className="profile-header"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    height: '200px',
                    position: 'relative'
                  }}
                >
                  {/* Avatar centrado */}
                  <div 
                    className="position-absolute"
                    style={{
                      bottom: '-60px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div 
                      className="bg-white rounded-circle p-3 shadow-lg"
                      style={{ width: '120px', height: '120px' }}
                    >
                      <img 
                        src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=96&background=667eea&color=ffffff&bold=true`} 
                        alt="Avatar" 
                        className="rounded-circle w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Contenido del perfil */}
                <Card.Body className="pt-5 pb-4 text-center">
                  <div className="mt-4">
                    {/* Nombre y rol */}
                    <h2 className="mb-2 fw-bold text-dark">{profile.name}</h2>
                    <Badge 
                      bg={getRoleBadgeVariant(profile.role)} 
                      className="mb-3 px-3 py-2 fs-6"
                      style={{ borderRadius: '50px' }}
                    >
                      <FaStar className="me-1" />
                      {getRoleLabel(profile.role)}
                    </Badge>

                    {/* Biografía */}
                    <div className="mx-auto mb-4" style={{ maxWidth: '400px' }}>
                      <p className="text-muted fs-5 lh-base" style={{ fontStyle: 'italic' }}>
                        "{profile.bio}"
                      </p>
                    </div>

                    {/* Información adicional */}
                    <Row className="g-3">
                      <Col sm={6}>
                        <div className="bg-light rounded-3 p-3">
                          <FaWallet className="text-primary mb-2" size={20} />
                          <h6 className="mb-1 text-muted small">WALLET ADDRESS</h6>
                          <code className="small d-block text-truncate fw-bold">
                            {user.walletAddress}
                          </code>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="bg-light rounded-3 p-3">
                          <FaCalendarAlt className="text-success mb-2" size={20} />
                          <h6 className="mb-1 text-muted small">MIEMBRO DESDE</h6>
                          <p className="mb-0 small fw-bold">
                            {formatDate(profile.createdAt)}
                          </p>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>

              {/* Mensaje informativo */}
              <div className="text-center mt-4">
                <small className="text-muted">
                  Para editar tu perfil, contacta con el soporte técnico
                </small>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Estilos personalizados */}
      <style>{`
        .profile-container {
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-header {
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }

        .card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        }

        .bg-light {
          transition: background-color 0.3s ease;
        }

        .bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </Container>
  );
};

export default ProfilePage; 