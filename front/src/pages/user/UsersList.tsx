import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Spinner, Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { FaEdit, FaSave, FaTimes, FaUserShield, FaUser, FaUserCog, FaSearch, FaExclamationTriangle, FaUsers, FaEye } from 'react-icons/fa';

type UserRole = 'user' | 'moderator' | 'admin';

type EditableUserData = {
  name: string;
  displayName: string;
  email: string;
  role: UserRole;
};

const UsersList: React.FC = () => {
  const { user, loading: authLoading, isTabReturning } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingData, setEditingData] = useState<EditableUserData>({
    name: '',
    displayName: '',
    email: '',
    role: 'user'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estado para el modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Estado para modal de error
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');
  
  useEffect(() => {
    console.log('UsersList effect triggered:', { user, authLoading, isTabReturning });
    
    // Si la autenticación aún está cargando o la tab está regresando, no hacer nada
    if (authLoading || isTabReturning) {
      console.log('Auth still loading or tab returning, waiting...');
      return;
    }
    
    if (user?.walletAddress && user?.role === 'moderator') {
      fetchUsers();
    }
  }, [user?.walletAddress, user?.role, authLoading, isTabReturning]);
  
  const fetchUsers = async () => {
    if (!user?.walletAddress || user?.role !== 'moderator') return;
    
    try {
      setLoading(true);
      setError(null);
      
      userService.setWalletAddress(user.walletAddress);
      const usersData = await userService.getAllUsers();
      setUsers(usersData || []);
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (!user?.walletAddress || user?.role !== 'moderator') return;
    
    try {
      userService.setWalletAddress(user.walletAddress);
      await userService.updateUserRole(userId, newRole, user.walletAddress);
      
      // Update the local state to reflect the change
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setErrorModalMessage(`No se pudo actualizar el rol del usuario: ${err.message}`);
      setShowErrorModal(true);
    }
  };
  
  // Funciones para el modal de edición
  const handleShowEditModal = (userData: any) => {
    console.log("Usuario a editar:", userData);
    setEditingUser(userData);
    setEditingData({
      name: userData.name || '',
      displayName: userData.displayName || '',
      email: userData.email || '',
      role: userData.role || 'user'
    });
    setEditError(null);
    setEditSuccess(null);
    setValidationErrors({});
    setShowEditModal(true);
  };
  
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditError(null);
    setEditSuccess(null);
    setValidationErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setEditingData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar el error de validación cuando el usuario modifica el campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editingData.displayName.trim()) {
      errors.displayName = 'El nombre visible es requerido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !editingUser) {
      return;
    }
    
    setIsSubmitting(true);
    setEditError(null);
    
    try {
      if (!user?.walletAddress) {
        throw new Error('Debes estar autenticado para editar un usuario');
      }
      
      // Asegurar que tenemos todos los campos requeridos
      const updateData = {
        ...editingData,
        role: editingData.role || 'user' // Asegurar que role siempre tiene un valor
      };

      console.log("Enviando actualización para:", editingUser.walletAddress, updateData);
      
      userService.setWalletAddress(user.walletAddress);
      await userService.updateUser(editingUser.walletAddress, updateData);
      
      // Actualizar el estado local con los datos actualizados
      setUsers(users.map(u => 
        u.walletAddress === editingUser.walletAddress ? { ...u, ...updateData } : u
      ));
      
      setEditSuccess('Usuario actualizado correctamente');
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess(null);
        setEditingUser(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setEditError(error.message || 'Error al actualizar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const name = user.name || user.displayName || '';
    const wallet = user.walletAddress || '';
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      wallet.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Mostrar spinner mientras la autenticación está cargando o tab regresando
  if (authLoading || isTabReturning) {
    return (
      <Container className="py-5">
        <Card className="shadow-lg border-0">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <h5 className="mt-3 text-muted">Verificando autenticación...</h5>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  // Solo después de que la autenticación esté resuelta, verificar si hay usuario
  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h4>Autenticación requerida</h4>
          <p>Por favor conecta tu wallet para gestionar usuarios.</p>
        </Alert>
      </Container>
    );
  }

  if (user.role !== 'moderator') {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          <strong>Acceso denegado</strong>
          <p className="mb-0 mt-2">Solo los moderadores pueden acceder a la gestión de usuarios.</p>
        </Alert>
      </Container>
    );
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'moderator':
        return <Badge style={{ background: 'linear-gradient(45deg, #6f42c1, #e83e8c)', color: 'white', border: 'none' }} className="d-flex align-items-center gap-1 rounded-pill px-3 py-2"><FaUserShield /> Moderador</Badge>;
      case 'admin':
        return <Badge style={{ background: 'linear-gradient(45deg, #dc3545, #fd7e14)', color: 'white', border: 'none' }} className="d-flex align-items-center gap-1 rounded-pill px-3 py-2"><FaUserCog /> Admin</Badge>;
      default:
        return <Badge style={{ background: 'linear-gradient(45deg, #28a745, #20c997)', color: 'white', border: 'none' }} className="d-flex align-items-center gap-1 rounded-pill px-3 py-2"><FaUser /> Usuario</Badge>;
    }
  };
  
  const handleShowUserDetails = (userData: any) => {
    setSelectedUser(userData);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };
  
  return (
    <Container fluid className="px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header moderno */}
      <div className="text-center mb-5">
        <div className="d-inline-block p-4 rounded-3 shadow-lg" 
             style={{ 
               background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
               color: '#333'
             }}>
          <h1 className="mb-0 d-flex align-items-center justify-content-center">
            <FaUserCog className="me-3" size={40} />
            Gestión de Usuarios
          </h1>
          <p className="mb-0 mt-2 opacity-75">Administra roles y permisos de usuarios</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-gradient text-white text-center py-3" 
                   style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
          <h2 className="mb-0" style={{ color: 'black' }}>
            <FaUsers className="me-2" style={{ color: 'black' }}/>
            Gestión de Usuarios
          </h2>
          <p className="mb-0 mt-2 opacity-75" style={{ color: 'black' }}>Ver y administrar todos los usuarios de la plataforma. Puedes actualizar roles y ver detalles de usuarios.</p>
        </Card.Header>
        <Card.Body className="p-4">
          {/* Filtros modernos */}
          <Row className="mb-4">
            <Col md={8}>
              <Form.Group>
                <Form.Label className="fw-bold text-primary">
                  <FaSearch className="me-2" />
                  Buscar usuarios
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre o dirección de wallet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-3 border-0 shadow-sm"
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold text-primary">
                  <FaUserShield className="me-2" />
                  Filtrar por rol
                </Form.Label>
                <Form.Select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-3 border-0 shadow-sm"
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <option value="all">Todos los roles</option>
                  <option value="user">Usuario</option>
                  <option value="moderator">Moderador</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Cargando usuarios...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="rounded-3 border-0 shadow-sm">
              <Alert.Heading className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2" />
                Error
              </Alert.Heading>
              <p>{error}</p>
              <div className="d-flex justify-content-end">
                <Button onClick={fetchUsers} variant="outline-danger" className="rounded-3">
                  Reintentar
                </Button>
              </div>
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <FaUsers size={60} className="mb-3 text-muted opacity-50" />
              <h4 className="text-muted mb-3">No hay usuarios disponibles</h4>
              <p className="text-muted">
                {searchTerm || roleFilter !== 'all' 
                  ? 'No se encontraron usuarios que coincidan con los criterios de búsqueda.' 
                  : 'Aún no hay usuarios registrados.'}
              </p>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 text-muted">
                  Mostrando {filteredUsers.length} de {users.length} usuarios
                </h5>
              </div>

              {/* Lista compacta de usuarios en lugar de cards */}
              <div className="bg-white rounded-3 shadow-sm overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)' }}>
                      <tr>
                        <th className="border-0 py-3 ps-4 text-dark">
                          <FaUser className="me-2 text-primary" />
                          Usuario
                        </th>
                        <th className="border-0 py-3 text-dark">
                          <FaUserShield className="me-2 text-primary" />
                          Rol
                        </th>
                        <th className="border-0 py-3 text-dark">
                          <FaUsers className="me-2 text-primary" />
                          Wallet
                        </th>
                        <th className="border-0 py-3 text-dark">
                          Fecha de Registro
                        </th>
                        <th className="border-0 py-3 text-center text-dark">
                          <FaEdit className="me-2 text-primary" />
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr key={user._id} style={{ 
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                          borderLeft: `4px solid ${
                            user.role === 'moderator' ? '#6f42c1' : 
                            user.role === 'admin' ? '#dc3545' : '#28a745'
                          }`
                        }}>
                          <td className="border-0 py-3 ps-4">
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  background: user.role === 'moderator' 
                                    ? 'linear-gradient(135deg, #6f42c1, #e83e8c)' 
                                    : user.role === 'admin'
                                    ? 'linear-gradient(135deg, #dc3545, #fd7e14)'
                                    : 'linear-gradient(135deg, #28a745, #20c997)',
                                  color: 'white',
                                  minWidth: '50px'
                                }}
                              >
                                {user.role === 'moderator' ? (
                                  <FaUserShield size={20} />
                                ) : user.role === 'admin' ? (
                                  <FaUserCog size={20} />
                                ) : (
                                  <FaUser size={20} />
                                )}
                              </div>
                              <div className="flex-grow-1 min-width-0">
                                <h6 className="mb-1 text-dark fw-bold">
                                  {user.name || user.displayName || 'Usuario'}
                                </h6>
                                {user.email && (
                                  <small className="text-muted" title={user.email}>
                                    {user.email.length > 30 ? user.email.substring(0, 30) + '...' : user.email}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="border-0 py-3">
                            <code className="bg-light px-2 py-1 rounded" style={{ color: '#212529', fontWeight: '500' }}>
                              {user.walletAddress ? 
                                `${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}` 
                                : 'Sin wallet'}
                            </code>
                          </td>
                          <td className="border-0 py-3 text-dark">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
                          </td>
                          <td className="border-0 py-3">
                            <div className="d-flex gap-2 justify-content-center">
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleShowEditModal(user)}
                                className="rounded-3"
                                title="Editar usuario"
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => handleShowUserDetails(user)}
                                className="rounded-3"
                                title="Ver detalles"
                              >
                                <FaEye />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal para editar usuario */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {editError && <Alert variant="danger">{editError}</Alert>}
            {editSuccess && <Alert variant="success">{editSuccess}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Nombre visible</Form.Label>
              <Form.Control
                type="text"
                name="displayName"
                value={editingData.displayName}
                onChange={handleInputChange}
                isInvalid={!!validationErrors.displayName}
                required
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.displayName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editingData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="role"
                value={editingData.role}
                onChange={handleInputChange}
                required
              >
                <option value="user">Usuario</option>
                <option value="moderator">Moderador</option>
              </Form.Select>
            </Form.Group>

          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={handleCloseEditModal}
              disabled={isSubmitting}
            >
              <FaTimes className="me-2" />
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> 
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para ver detalles del usuario */}
      <Modal show={showDetailsModal} onHide={handleCloseDetailsModal}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: selectedUser.role === 'moderator' 
                      ? 'linear-gradient(135deg, #6f42c1, #e83e8c)' 
                      : selectedUser.role === 'admin'
                      ? 'linear-gradient(135deg, #dc3545, #fd7e14)'
                      : 'linear-gradient(135deg, #28a745, #20c997)',
                    color: 'white'
                  }}
                >
                  {selectedUser.role === 'moderator' ? (
                    <FaUserShield size={35} />
                  ) : selectedUser.role === 'admin' ? (
                    <FaUserCog size={35} />
                  ) : (
                    <FaUser size={35} />
                  )}
                </div>
                <h4 className="text-dark">{selectedUser.name || selectedUser.displayName || 'Usuario'}</h4>
                {getRoleBadge(selectedUser.role)}
              </div>
              
              <div className="row">
                <div className="col-sm-4"><strong>Wallet Address:</strong></div>
                <div className="col-sm-8">
                  <code className="text-dark bg-light px-2 py-1 rounded" style={{ color: '#212529', fontWeight: '500' }}>
                    {selectedUser.walletAddress ? 
                      `${selectedUser.walletAddress.substring(0, 6)}...${selectedUser.walletAddress.substring(selectedUser.walletAddress.length - 4)}` 
                      : 'Sin wallet'}
                  </code>
                </div>
              </div>
              <hr />
              
              {selectedUser.email && (
                <>
                  <div className="row">
                    <div className="col-sm-4"><strong>Email:</strong></div>
                    <div className="col-sm-8 text-dark">{selectedUser.email}</div>
                  </div>
                  <hr />
                </>
              )}
              
              <div className="row">
                <div className="col-sm-4"><strong>Fecha de Registro:</strong></div>
                <div className="col-sm-8 text-dark">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No disponible'}
                </div>
              </div>
              <hr />
              
              <div className="row">
                <div className="col-sm-4"><strong>Última Actualización:</strong></div>
                <div className="col-sm-8 text-dark">
                  {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No disponible'}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetailsModal}>
            <FaTimes className="me-2" />
            Cerrar
          </Button>
          <Button variant="primary" onClick={() => {
            handleCloseDetailsModal();
            handleShowEditModal(selectedUser);
          }}>
            <FaEdit className="me-2" />
            Editar Usuario
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de error */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Error al actualizar rol
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">{errorModalMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowErrorModal(false)}>
            Entendido
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UsersList; 