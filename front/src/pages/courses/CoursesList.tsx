import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllCoursesForModerator, toggleCoursePublishStatus, updateCourse } from '../../services/course/courseService';
import { useWallet } from '@solana/wallet-adapter-react';
import { FaEdit, FaSave, FaTimes, FaBook, FaSearch, FaGraduationCap, FaTags, FaExclamationTriangle, FaDollarSign, FaToggleOn, FaPlus } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';

// Tipo para los datos editables del curso
type EditableCourseData = {
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  published: boolean;
};

const CoursesList: React.FC = () => {
  const wallet = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();

  const walletAddress = wallet?.publicKey?.toString();
  const walletConnected = wallet?.connected;
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
  });
  const [publishingId, setPublishingId] = useState<string | null>(null);
  
  // Estado para el modal de edición
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditableCourseData>({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    price: 0,
    level: 'beginner',
    tags: [],
    published: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    let isComponentMounted = true;

    const loadCourses = async () => {
      if (!walletConnected || !walletAddress) {
        if (isComponentMounted) {
          setError('No wallet address found. Please connect your wallet.');
          setLoading(false);
        }
        return;
      }

      try {
        const fetchedCourses = await getAllCoursesForModerator(walletAddress);
        if (isComponentMounted) {
          setCourses(fetchedCourses); 
        }
      } catch (error) {
        if (isComponentMounted) {
          console.error('Error fetching courses:', error);
          setError('Failed to fetch courses. Please try again later.');
        }
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isComponentMounted = false;
    };
  }, [walletConnected, walletAddress]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Extrae niveles y categorías únicos dinámicamente (en minúsculas)
  const levels = Array.from(new Set(courses.map(course => (course.level || '').toLowerCase()))).filter(Boolean);
  const categories = Array.from(new Set(courses.map(course => (course.category || '').toLowerCase()))).filter(Boolean);
  
  const filteredCourses = courses.filter(course => {
    // Search filter
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Level filter (case-insensitive)
    const matchesLevel =
      filters.level === 'all' ||
      (course.level && course.level.toLowerCase() === filters.level.toLowerCase());
    
    // Category filter (case-insensitive)
    const matchesCategory =
      filters.category === 'all' ||
      (course.category && course.category.toLowerCase() === filters.category.toLowerCase());
    
    return matchesSearch && matchesLevel && matchesCategory;
  });
  
  const handlePublish = async (courseId: string) => {
    setPublishingId(courseId);
    setError(null);
    try {
      await toggleCoursePublishStatus(courseId, walletAddress || '');
      // Recargar cursos tras publicar/despublicar
      const fetchedCourses = await getAllCoursesForModerator(walletAddress || '');
      setCourses(fetchedCourses);
    } catch (error) {
      setError('Error al cambiar el estado de publicación del curso.');
    } finally {
      setPublishingId(null);
    }
  };

  // Funciones para manejar el modal de edición
  const handleShowEditModal = (course: any) => {
    setEditingCourse(course._id);
    setEditingData({
      title: course.title || '',
      description: course.description || '',
      content: course.content || '',
      imageUrl: course.imageUrl || '',
      price: course.price ?? 0,
      level: course.level || 'beginner',
      tags: course.tags || [],
      published: course.published
    });
    setEditError(null);
    setEditSuccess(null);
    setValidationErrors({});
    setShowEditModal(true);
  };
  
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCourse(null);
    setEditError(null);
    setEditSuccess(null);
    setValidationErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setEditingData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
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
    
    if (!editingData.title.trim()) {
      errors.title = 'El título es requerido';
    }
    if (!editingData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }
    if (!editingData.content.trim()) {
      errors.content = 'El contenido es requerido';
    }
    if (editingData.price < 0) {
      errors.price = 'El precio no puede ser negativo';
    }
    if (editingData.imageUrl && !editingData.imageUrl.match(/^https?:\/\/.+/)) {
      errors.imageUrl = 'La URL de la imagen debe ser válida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !editingCourse) {
      return;
    }
    
    setIsSubmitting(true);
    setEditError(null);
    
    try {
      if (!walletAddress) {
        throw new Error('Debes estar autenticado para editar un curso');
      }

      const updatedCourse = await updateCourse(editingCourse, editingData, walletAddress);
      
      // Actualizar el estado local con los datos actualizados
      setCourses(courses.map(course => 
        course._id === editingCourse ? { ...course, ...updatedCourse } : course
      ));
      
      setEditSuccess('Curso actualizado correctamente');
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess(null);
        setEditingCourse(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating course:', error);
      setEditError(error.message || 'Error al actualizar el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header moderno */}
      <div className="text-center mb-5">
        <div className="d-inline-block p-4 rounded-3 shadow-lg" 
             style={{ 
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               color: 'white'
             }}>
          <h1 className="mb-0 d-flex align-items-center justify-content-center">
            <FaEdit className="me-3" size={40} />
            Gestión de Cursos
          </h1>
          <p className="mb-0 mt-2 opacity-75">Administra y publica tus cursos</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-gradient text-white text-center py-3" 
                   style={{ background: 'linear-gradient(45deg, #11998e, #38ef7d)' }}>
          <h2 className="mb-0">
            <FaBook className="me-2" color="black" />
            Explore Courses
          </h2>
          <p className="mb-0 mt-2 opacity-75" style={{ color: 'black' }}>View and manage all users in the platform. You can update roles and view user details.</p>
        </Card.Header>
        <Card.Body className="p-4">
          {!walletConnected ? (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>Wallet not connected</Alert.Heading>
              <p>Please connect your wallet to view and manage courses.</p>
            </Alert>
          ) : user?.role !== 'moderator' ? (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>Access Denied</Alert.Heading>
              <p>You don't have permission to view the courses list.</p>
            </Alert>
          ) : (
            <>
              {/* Filtros modernos */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-primary">
                      <FaSearch className="me-2" />
                      Buscar cursos
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por título o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-3 border-0 shadow-sm"
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-primary">
                      <FaGraduationCap className="me-2" />
                      Nivel
                    </Form.Label>
                    <Form.Select 
                      name="level"
                      value={filters.level}
                      onChange={handleFilterChange}
                      className="rounded-3 border-0 shadow-sm"
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="all">Todos los niveles</option>
                      {levels.map(level => (
                        <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-bold text-primary">
                      <FaTags className="me-2" />
                      Categoría
                    </Form.Label>
                    <Form.Select 
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="rounded-3 border-0 shadow-sm"
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando cursos...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="rounded-3 border-0 shadow-sm">
                  <Alert.Heading className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    Error
                  </Alert.Heading>
                  <p>{error}</p>
                  <div className="d-flex justify-content-end">
                    <Button onClick={() => {}} variant="outline-danger" className="rounded-3">
                      Reintentar
                    </Button>
                  </div>
                </Alert>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-5">
                  <FaBook size={60} className="mb-3 text-muted opacity-50" />
                  <h4 className="text-muted mb-3">No hay cursos disponibles</h4>
                  <p className="text-muted">
                    {searchTerm || filters.level !== 'all' || filters.category !== 'all' 
                      ? 'No se encontraron cursos que coincidan con los criterios de búsqueda.' 
                      : 'Aún no hay cursos disponibles.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 text-muted">
                      Mostrando {filteredCourses.length} de {courses.length} cursos
                    </h5>
                    <Link to="/create-course" className="text-decoration-none">
                      <Button 
                        className="rounded-3 px-4 shadow-sm"
                        style={{ 
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          border: 'none'
                        }}
                      >
                        <FaPlus className="me-2" />
                        Crear Nuevo Curso
                      </Button>
                    </Link>
                  </div>

                  {/* Lista compacta de cursos en lugar de cards */}
                  <div className="bg-white rounded-3 shadow-sm overflow-hidden">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead style={{ background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)' }}>
                          <tr>
                            <th className="border-0 py-3 ps-4 text-dark">
                              <FaBook className="me-2 text-primary" />
                              Curso
                            </th>
                            <th className="border-0 py-3 text-dark">
                              <FaGraduationCap className="me-2 text-primary" />
                              Nivel
                            </th>
                            <th className="border-0 py-3 text-dark">
                              <FaDollarSign className="me-2 text-primary" />
                              Precio
                            </th>
                            <th className="border-0 py-3 text-dark">
                              <FaToggleOn className="me-2 text-primary" />
                              Estado
                            </th>
                            <th className="border-0 py-3 text-center text-dark">
                              <FaEdit className="me-2 text-primary" />
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCourses.map((course, index) => (
                            <tr key={course._id} style={{ 
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                              borderLeft: `4px solid ${course.published ? '#28a745' : '#ffc107'}`
                            }}>
                              <td className="border-0 py-3 ps-4">
                                <div className="d-flex align-items-center">
                                  <div 
                                    className="rounded me-3 d-flex align-items-center justify-content-center"
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      background: course.imageUrl 
                                        ? `url(${course.imageUrl}) center/cover` 
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      minWidth: '50px'
                                    }}
                                  >
                                    {!course.imageUrl && (
                                      <FaBook className="text-white" size={20} />
                                    )}
                                  </div>
                                  <div className="flex-grow-1 min-width-0">
                                    <h6 className="mb-1 text-dark fw-bold" title={course.title}>
                                      {course.title.length > 40 ? course.title.substring(0, 40) + '...' : course.title}
                                    </h6>
                                    <small className="text-muted" title={course.description}>
                                      {course.description.length > 60 ? course.description.substring(0, 60) + '...' : course.description}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="border-0 py-3">
                                <Badge 
                                  className="rounded-pill px-3 py-2"
                                  style={{
                                    background: course.level === 'beginner' 
                                      ? 'linear-gradient(45deg, #28a745, #20c997)'
                                      : course.level === 'intermediate'
                                      ? 'linear-gradient(45deg, #fd7e14, #ffc107)'
                                      : 'linear-gradient(45deg, #6f42c1, #e83e8c)',
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  {course.level === 'beginner' ? 'Principiante' : 
                                   course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                </Badge>
                              </td>
                              <td className="border-0 py-3">
                                <span className="fw-bold text-dark">
                                  {course.price === 0 ? (
                                    <Badge bg="success" className="rounded-pill" style={{ color: 'white' }}>Gratis</Badge>
                                  ) : (
                                    <span className="text-primary">{course.price} SOL</span>
                                  )}
                                </span>
                              </td>
                              <td className="border-0 py-3">
                                <Badge 
                                  className="rounded-pill px-3 py-2"
                                  style={{
                                    background: course.published 
                                      ? 'linear-gradient(45deg, #28a745, #20c997)' 
                                      : 'linear-gradient(45deg, #6c757d, #495057)',
                                    color: 'white',
                                    border: 'none'
                                  }}
                                >
                                  {course.published ? 'Publicado' : 'Borrador'}
                                </Badge>
                              </td>
                              <td className="border-0 py-3">
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleShowEditModal(course)}
                                    className="rounded-3"
                                    title="Editar curso"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button 
                                    variant={course.published ? 'outline-danger' : 'outline-success'} 
                                    size="sm"
                                    onClick={() => handlePublish(course._id || '')}
                                    disabled={publishingId === course._id}
                                    className="rounded-3"
                                    title={course.published ? 'Despublicar' : 'Publicar'}
                                  >
                                    {publishingId === course._id ? (
                                      <Spinner animation="border" size="sm" />
                                    ) : (
                                      <FaToggleOn />
                                    )}
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
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal de edición de curso */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Curso</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {editError && <Alert variant="danger">{editError}</Alert>}
            {editSuccess && <Alert variant="success">{editSuccess}</Alert>}

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={editingData.title}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.title}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={editingData.description}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.description}
                    required
                    rows={3}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contenido</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="content"
                    value={editingData.content}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.content}
                    required
                    rows={5}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.content}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>URL de la imagen</Form.Label>
                  <Form.Control
                    type="text"
                    name="imageUrl"
                    value={editingData.imageUrl}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.imageUrl}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.imageUrl}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Precio (SOL)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={editingData.price}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.price}
                    required
                    min="0"
                    step="0.1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.price}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nivel</Form.Label>
                  <Form.Select
                    name="level"
                    value={editingData.level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Etiquetas (separadas por comas)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={editingData.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                      setEditingData(prev => ({ ...prev, tags }));
                    }}
                    placeholder="ejemplo: programación, web, javascript"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="published"
                    name="published"
                    label="Curso publicado"
                    checked={editingData.published}
                    onChange={(e) => setEditingData(prev => ({ ...prev, published: e.target.checked }))}
                  />
                </Form.Group>
              </Col>
            </Row>
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
    </Container>
  );
};

export default CoursesList; 