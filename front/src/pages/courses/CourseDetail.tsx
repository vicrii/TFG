import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ProgressBar, Form, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaGraduationCap, FaTag, FaUser, FaCoins, FaChalkboardTeacher, FaClock, FaEdit, FaSave, FaTimes, FaCheckCircle, FaSearchMinus } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { getCourseById, getPublicCourseById, updateCourse } from '../../services/course/courseService';
import { LessonList } from '../../components/courses/LessonList';
import { Course } from '../../types/course';
import { Lesson } from '../../types/lesson';
import { checkEnrollmentStatus, enrollInCourse, unenrollFromCourse } from '../../services/enrollment/enrollmentService';
import { apiClient } from '../../services/api/api.client';
import { lessonService } from '../../services/lesson/lessonService';
import { courseService, ICourseData } from '../../services/course/courseService';

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

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [previewLessons, setPreviewLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lessonsLoading, setLessonsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLessonMsg, setShowAddLessonMsg] = useState(
    location.state && (location.state as any).showAddLessonMsg
  );
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
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
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState<boolean>(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  // Estados para el progreso real del usuario
  const [userProgress, setUserProgress] = useState<{
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  }>({
    completedLessons: 0,
    totalLessons: 0,
    percentage: 0
  });

  // Función para calcular el progreso real basado en lecciones - MOVED UP BEFORE USAGE
  const calculateUserProgress = (lessonsData: Lesson[]) => {
    if (!lessonsData || lessonsData.length === 0) {
      setUserProgress({ completedLessons: 0, totalLessons: 0, percentage: 0 });
      return;
    }

    const totalLessons = lessonsData.length;
    const completedLessons = lessonsData.filter(lesson => lesson.isCompleted).length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    console.log('User progress calculated:', { completedLessons, totalLessons, percentage });

    setUserProgress({
      completedLessons,
      totalLessons,
      percentage
    });
  };

  // OPTIMIZED: Reduce dependencies and prevent unnecessary re-renders
  useEffect(() => {
    if (!courseId) {
      navigate('/courses');
      return;
    }

    let isComponentMounted = true;

    const fetchCourseAndLessons = async () => {
      if (!isComponentMounted) return;

      try {
        setLoading(true);
        setLessonsLoading(true);
        setError(null);
        
        // Cargar curso y lecciones en paralelo
        const promises: Promise<any>[] = [];
        
        // Promise para cargar el curso
        if (user?.walletAddress) {
          promises.push(getCourseById(courseId, user.walletAddress));
        } else {
          promises.push(getPublicCourseById(courseId));
        }
        
        // Promise para cargar las lecciones
        if (user?.walletAddress) {
          // Usuario autenticado - cargar lecciones completas
          apiClient.setAuthHeader(user.walletAddress);
          promises.push(lessonService.getCourseLessons(courseId, user.walletAddress));
        } else {
          // Usuario no autenticado - cargar vista previa
          promises.push(fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/public/courses/${courseId}/lesson-previews`)
            .then(response => {
              if (!response.ok) throw new Error('Error al cargar vistas previas');
              return response.json();
            }));
        }
        
        // Ejecutar ambas cargas en paralelo
        const [courseData, lessonsData] = await Promise.all(promises);
        
        if (!isComponentMounted) return;
        
        // Procesar datos del curso
        if (courseData) {
          // Verificar permisos para cursos no publicados
          if (user?.walletAddress && !courseData.published && 
                (typeof courseData.instructor === 'object' 
                  ? user.walletAddress !== courseData.instructor.walletAddress 
                  : user.walletAddress !== courseData.instructor) && 
              user.role !== 'moderator') {
            navigate('/courses');
            return;
          }
          setCourse(courseData as unknown as Course);
        } else {
          throw new Error('No se encontró el curso solicitado');
        }
        
        // Procesar datos de lecciones
        if (user?.walletAddress) {
          try {
            const fetchedLessons = await lessonService.getCourseLessons(courseId, user.walletAddress);
            console.log('Fetched lessons:', fetchedLessons?.length || 0);
            
            if (fetchedLessons && fetchedLessons.length > 0) {
              setLessons(fetchedLessons);
              // Calcular progreso real del usuario
              calculateUserProgress(fetchedLessons);
            } else {
              console.log('No lessons found or empty array returned');
              setLessons([]);
              calculateUserProgress([]);
            }
          } catch (error) {
            console.error('Error fetching lessons:', error);
            setLessons([]);
            calculateUserProgress([]);
          }
        } else {
          setPreviewLessons(lessonsData || []);
        }
        
      } catch (err: any) {
        if (!isComponentMounted) return;
        console.error('Error fetching course and lessons:', err);
        setError(err.message || 'Error al cargar los datos del curso');
      } finally {
        if (isComponentMounted) {
          setLoading(false);
          setLessonsLoading(false);
        }
      }
    };

    fetchCourseAndLessons();

    return () => {
      isComponentMounted = false;
    };
  }, [courseId, user?.walletAddress]); // SIMPLIFIED: Only essential dependencies

  useEffect(() => {
    if (showAddLessonMsg) {
      const timer = setTimeout(() => setShowAddLessonMsg(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAddLessonMsg]);

  // OPTIMIZED: Separate enrollment check
  useEffect(() => {
    let isComponentMounted = true;

    const checkStudentEnrollment = async () => {
      if (!user?.walletAddress || !courseId) return;
      
      try {
        console.log(`Checking enrollment status for course ${courseId} and wallet ${user.walletAddress.substring(0, 6)}...`);
        
        // Set the auth header at the API client level
        apiClient.setAuthHeader(user.walletAddress);
        
        try {
          const { isEnrolled } = await checkEnrollmentStatus(courseId);
          if (isComponentMounted) {
            setIsEnrolled(isEnrolled);
            console.log(`Enrollment status retrieved: ${isEnrolled}`);
          }
        } catch (error) {
          // If the enrollment check fails, assume not enrolled
          console.error('Error checking enrollment status:', error);
          if (isComponentMounted) {
            setIsEnrolled(false);
          }
        }
      } catch (err) {
        console.error('Error general al verificar inscripción:', err);
        // Failsafe: assume not enrolled if there's any error
        if (isComponentMounted) {
          setIsEnrolled(false);
        }
      }
    };

    checkStudentEnrollment();

    return () => {
      isComponentMounted = false;
    };
  }, [user?.walletAddress, courseId]);

  // OPTIMIZED: Window focus listener for automatic refresh
  useEffect(() => {
    const handleFocus = async () => {
      if (user?.walletAddress && courseId && isEnrolled) {
        console.log('Window focused - refreshing progress...');
        try {
          const fetchedLessons = await lessonService.getCourseLessons(courseId, user.walletAddress);
          if (fetchedLessons && fetchedLessons.length > 0) {
            setLessons(fetchedLessons);
            calculateUserProgress(fetchedLessons);
          }
        } catch (error) {
          console.error('Error refreshing lessons on focus:', error);
        }
      }
    };

    // Escuchar cuando la ventana recibe el foco (usuario regresa de otra página)
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.walletAddress, courseId, isEnrolled]);

  const handleEnrollment = async () => {
    if (!user?.walletAddress) {
      setEnrollmentError('Debes iniciar sesión para inscribirte en este curso');
      return;
    }

    try {
      setEnrollmentLoading(true);
      setEnrollmentError(null);
      
      console.log(`Processing enrollment action (${isEnrolled ? 'unenroll' : 'enroll'}) for course ${courseId} and wallet ${user.walletAddress.substring(0, 6)}...`);
      
      // Set the auth header at the API client level
      apiClient.setAuthHeader(user.walletAddress);
      
      if (isEnrolled) {
        try {
          await unenrollFromCourse(courseId!);
          setIsEnrolled(false);
          setEnrollmentSuccess('Te has dado de baja del curso exitosamente');
          console.log('Successfully unenrolled from course');
        } catch (error) {
          console.error('Error unenrolling from course:', error);
          // If server error but the action might have succeeded
          if (error instanceof Error && error.message.includes('500')) {
            console.log('Server error during unenroll, but action might have succeeded. Assuming unenrolled.');
            setIsEnrolled(false);
            setEnrollmentSuccess('Te has dado de baja del curso');
          } else {
            throw error;
          }
        }
      } else {
        try {
          await enrollInCourse(courseId!);
          setIsEnrolled(true);
          setEnrollmentSuccess('¡Te has inscrito exitosamente en el curso!');
          console.log('Successfully enrolled in course');
        } catch (error) {
          console.error('Error enrolling in course:', error);
          // If server error but the action might have succeeded
          if (error instanceof Error && error.message.includes('500')) {
            console.log('Server error during enroll, but action might have succeeded. Assuming enrolled.');
            setIsEnrolled(true);
            setEnrollmentSuccess('¡Te has inscrito en el curso!');
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('Error al procesar inscripción:', err);
      setEnrollmentError(err.message || 'Error al procesar tu inscripción');
    } finally {
      setEnrollmentLoading(false);
      if (enrollmentSuccess) {
        setTimeout(() => setEnrollmentSuccess(null), 5000);
      }
    }
  };

  // Nueva función para manejar los cambios en el formulario
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

  // Nueva función para validar el formulario
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

  // Nueva función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setEditError(null);
    
    try {
      if (!user?.walletAddress) {
        throw new Error('Debes estar autenticado para editar un curso');
      }

      // Intentar obtener la wallet de localStorage si no está disponible
      let walletAddress = user.walletAddress;
      if (!walletAddress) {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.walletAddress) {
              walletAddress = parsedUser.walletAddress;
            }
          } catch (err) {
            console.error('Error al parsear usuario de localStorage', err);
          }
        }
      }

      if (!walletAddress) {
        throw new Error('No se pudo obtener la dirección de wallet para autenticación');
      }

      const updatedCourse = await updateCourse(courseId!, editingData, walletAddress);
      
      // Actualizar el estado local con los datos actualizados
      setCourse(updatedCourse as unknown as Course);
      
      setEditSuccess('Curso actualizado correctamente');
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccess(null);
      }, 1500);
    } catch (error: any) {
      console.error('Error updating course:', error);
      setEditError(error.message || 'Error al actualizar el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowEditModal = () => {
    if (!course) return;
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
    setEditError(null);
    setEditSuccess(null);
    setValidationErrors({});
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Cargando detalles del curso...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Card className="shadow-sm">
          <Card.Body className="text-center p-5">
            <Alert variant="danger" className="mb-4">{error}</Alert>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/courses')}
              className="d-flex align-items-center mx-auto"
            >
              <FaArrowLeft className="me-2" />
              Volver a cursos
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="mt-5">
        <Card className="shadow-sm">
          <Card.Body className="text-center p-5">
            <Alert variant="warning" className="mb-4">No se encontró el curso solicitado</Alert>
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/courses')}
              className="d-flex align-items-center mx-auto"
            >
              <FaArrowLeft className="me-2" />
              Volver a cursos
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const getLevelVariant = (level: string) => {
    switch (level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'primary';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return level;
    }
  };

  const getProgress = () => {
    // Usar progreso real del usuario si está disponible
    if (userProgress.totalLessons > 0) {
      return userProgress.percentage;
    }
    // Fallback al progreso estático del curso
    if (!course.totalLessons) return 0;
    return (course.completedLessons || 0) / course.totalLessons * 100;
  };

  const canEditCourse = user && (
    (typeof course.instructor === 'object' 
      ? user.walletAddress === course.instructor.walletAddress 
      : user.walletAddress === course.instructor) || 
    user.role === 'moderator'
  );

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button 
          variant="outline-primary" 
          onClick={() => navigate('/courses')}
          className="d-flex align-items-center"
        >
          <FaArrowLeft className="me-2" />
          Volver a cursos
        </Button>

        {canEditCourse && (
          <Button 
            variant="outline-secondary" 
            className="d-flex align-items-center"
            onClick={handleShowEditModal}
          >
              <FaEdit className="me-2" />
              Editar Curso
            </Button>
        )}
      </div>

      <Card className="shadow-sm mb-4">
        {course.imageUrl && (
          <div style={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
            <Card.Img 
              src={course.imageUrl} 
              alt={course.title}
              style={{ 
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
              onClick={() => setShowImageModal(true)}
            />
            {!course.published && (
              <Badge 
                bg="warning" 
                className="position-absolute top-0 end-0 m-3"
              >
                Borrador
              </Badge>
            )}
          </div>
        )}
        
        <Card.Body className="p-4">
          <Row>
            <Col lg={8}>
              <div className="d-flex align-items-center mb-3">
                <h1 className="mb-0">{course.title}</h1>
                <Badge 
                  bg={getLevelVariant(course.level)} 
                  className="ms-3 d-flex align-items-center"
                >
                  <FaGraduationCap className="me-1" />
                  {getLevelText(course.level)}
                </Badge>
              </div>

              <p className="lead text-muted mb-4">{course.description}</p>

              {course.tags.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <FaTag className="text-muted me-2" />
                    <strong>Etiquetas</strong>
                  </div>
                  <div>
                    {course.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        bg="light" 
                        text="dark" 
                        className="me-2 mb-2 py-2 px-3"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="d-flex align-items-center mb-3">
                  <FaChalkboardTeacher className="me-2" />
                  Contenido del curso
                </h4>
                <Card.Text style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontSize: '1.1rem'
                }}>
                  {course.content}
                </Card.Text>
              </div>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaUser className="text-primary me-2" />
                      <h5 className="mb-0">Instructor</h5>
                    </div>
                    <p className="mb-0">
                      {typeof course.instructor === 'object' 
                        ? course.instructor.displayName 
                        : course.instructor}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaCoins className="text-warning me-2" />
                      <h5 className="mb-0">Precio</h5>
                    </div>
                    <p className="h3 mb-0">{course.price === 0 ? "Gratis" : `${Number(course.price).toFixed(2)} SOL`}</p>
                  </div>
                  
                  {/* Contenedor con ID específico para controlar el contenido */}
                  <div id="price-section-divider" style={{ position: 'relative' }}>
                    {/* Este elemento captura y oculta el "00" suelto */}
                    <span style={{ 
                      position: 'absolute', 
                      visibility: 'hidden',
                      height: '1px',
                      width: '1px',
                      overflow: 'hidden'
                    }}>00</span>
                  </div>

                  {course.totalDuration && (
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <FaClock className="text-info me-2" />
                        <h5 className="mb-0">Duración total</h5>
                      </div>
                      <p className="mb-0">{course.totalDuration} minutos</p>
                    </div>
                  )}

                  {userProgress.totalLessons > 0 && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>Progreso del curso</strong>
                        <span>{Math.round(getProgress())}%</span>
                      </div>
                      <ProgressBar 
                        now={getProgress()} 
                        variant="success" 
                        className="mb-2" 
                      />
                      <small className="text-muted">
                        {userProgress.completedLessons > 0 
                          ? `${userProgress.completedLessons} de ${userProgress.totalLessons} lecciones completadas`
                          : `${userProgress.totalLessons} lecciones disponibles`
                        }
                      </small>
                    </div>
                  )}

                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-100 mt-3"
                    disabled={!course.published || enrollmentLoading}
                    onClick={handleEnrollment}
                  >
                    {enrollmentLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : isEnrolled ? 'Darse de baja del curso' : 'Inscribirse al curso'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Mostrar spinner si aún se están cargando las lecciones */}
      {lessonsLoading ? (
        <Card className="shadow-sm text-center py-5">
          <Card.Body>
            <Spinner animation="border" className="mb-3" />
            <div>Cargando lecciones...</div>
          </Card.Body>
        </Card>
      ) : (
        <LessonList 
          lessons={lessons}
          previewLessons={previewLessons}
          onLessonsUpdate={(updatedLessons: Lesson[]) => setLessons(updatedLessons)}
        />
      )}

      {showAddLessonMsg && (
        <Alert 
          variant="success" 
          dismissible 
          onClose={() => setShowAddLessonMsg(false)}
          className="mt-4 text-center"
        >
          <Alert.Heading>¡Curso creado con éxito!</Alert.Heading>
          <p className="mb-0">Ahora puedes empezar a añadir lecciones a tu curso.</p>
        </Alert>
      )}

      {enrollmentError && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setEnrollmentError(null)}
          className="mt-4 text-center"
        >
          <Alert.Heading>Error</Alert.Heading>
          <p className="mb-0">{enrollmentError}</p>
        </Alert>
      )}

      {enrollmentSuccess && (
        <Alert 
          variant="success" 
          dismissible 
          onClose={() => setEnrollmentSuccess(null)}
          className="mt-4 text-center"
        >
          <Alert.Heading>Éxito</Alert.Heading>
          <p className="mb-0">{enrollmentSuccess}</p>
        </Alert>
      )}

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

      {/* Modal para mostrar la imagen en grande */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{course.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <img 
            src={course.imageUrl} 
            alt={course.title}
            style={{ 
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CourseDetail; 