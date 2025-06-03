import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button, Tabs, Tab, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { enrollmentService, IEnrollment } from '../../services/enrollment/enrollmentService';
import { apiClient } from '../../services/api/api.client';
import EnrolledCourseCard from '../../components/courses/EnrolledCourseCard';
import { FaTrophy, FaPlay, FaGraduationCap } from 'react-icons/fa';

// Mock data for fallback when server is unavailable
const mockEnrollments: IEnrollment[] = [
  {
    _id: 'mock-enrollment-1',
    user: 'mock-user',
    course: {
      _id: 'mock-course-1',
      title: 'Curso de ejemplo (offline)',
      description: 'Este es un curso de ejemplo mostrado cuando el servidor no está disponible.',
      content: 'Contenido de ejemplo',
      instructor: 'Sistema',
      price: 0,
      level: 'beginner',
      tags: ['offline', 'ejemplo'],
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    enrolledAt: new Date().toISOString(),
    status: 'active',
    progress: 0
  }
];

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [usingBasicMode, setUsingBasicMode] = useState<boolean>(false);
  
  // Estados para separar cursos por estado
  const [coursesInProgress, setCoursesInProgress] = useState<IEnrollment[]>([]);
  const [completedCourses, setCompletedCourses] = useState<IEnrollment[]>([]);

  const fetchEnrollments = async (useBasicEndpoint = false) => {
    if (!user?.walletAddress) {
      setError("No hay una wallet conectada. Por favor, inicia sesión primero.");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      
      // Set auth headers at the API client level with explicit wallet address
      const walletAddress = user.walletAddress;
      console.log(`Using wallet address for authentication: ${walletAddress}`);
      apiClient.setAuthHeader(walletAddress);
      
      let data;
      if (useBasicEndpoint) {
        console.log('Fetching basic enrollments...');
        setUsingBasicMode(true);
        data = await enrollmentService.getBasicEnrollments();
      } else {
        console.log('Fetching full enrollments...');
        data = await enrollmentService.getEnrolledCourses();
      }
      
      console.log(`Successfully retrieved ${Array.isArray(data) ? data.length : 0} enrollments`);
      
      // OPTIMIZATION: Cache successful results
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('cachedEnrollments', JSON.stringify(data));
      }
      
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar inscripciones', err);
      
      // Try to use cached data first
      const cachedEnrollments = localStorage.getItem('cachedEnrollments');
      if (cachedEnrollments) {
        try {
          console.log('Using cached enrollments due to error');
          const parsed = JSON.parse(cachedEnrollments);
          setEnrollments(parsed);
          setError("No se pudo conectar con el servidor. Mostrando datos guardados anteriormente.");
          setLoading(false);
          return;
        } catch (e) {
          console.error('Error parsing cached enrollments:', e);
        }
      }
      
      // If server unavailable after all attempts, show mock data
      if (err.message && (
        err.message.includes('Error fetching enrolled courses') || 
        err.message.includes('Error fetching basic enrollments')
      )) {
        console.log('Server unavailable - using mock data');
        setEnrollments(mockEnrollments);
        setUsingMockData(true);
        setError("El servidor no está disponible en este momento. Mostrando datos de ejemplo.");
        setLoading(false);
        return;
      }
      
      // More detailed error reporting
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || 'Sin mensaje';
        console.error(`Server error (${status}): ${message}`);
        setError(`Error del servidor: ${status} - ${message}`);
      } else if (err.request) {
        console.error('Network error - no response received');
        setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté funcionando.');
      } else {
        console.error(`General error: ${err.message}`);
        setError(`Error: ${err.message}`);
      }
      
      if (err.response && err.response.status === 401) {
        console.warn('Authentication error detected');
        setError('Tu sesión podría haber expirado. Intenta recargar la página o volver a iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OPTIMIZED: Add cleanup and prevent multiple loads
  useEffect(() => {
    let isComponentMounted = true;

    const loadEnrollments = async () => {
      if (!user?.walletAddress) {
        if (isComponentMounted) {
          setError("No hay una wallet conectada. Por favor, inicia sesión primero.");
          setLoading(false);
        }
        return;
      }

      await fetchEnrollments();
    };

    loadEnrollments();

    return () => {
      isComponentMounted = false;
    };
  }, [user?.walletAddress]); // SIMPLIFIED: Only depend on wallet address

  // OPTIMIZED: Memoize course separation to prevent unnecessary recalculations
  useEffect(() => {
    if (enrollments.length > 0) {
      const inProgress: IEnrollment[] = [];
      const completed: IEnrollment[] = [];
      
      enrollments.forEach(enrollment => {
        // Un curso está completado si el progreso es 100%
        if (enrollment.progress >= 100) {
          completed.push(enrollment);
        } else {
          inProgress.push(enrollment);
        }
      });
      
      // OPTIMIZATION: Only update state if values actually changed
      setCoursesInProgress(prev => {
        if (prev.length === inProgress.length && 
            prev.every((course, index) => course._id === inProgress[index]?._id)) {
          return prev; // No change, return previous state
        }
        return inProgress;
      });
      
      setCompletedCourses(prev => {
        if (prev.length === completed.length && 
            prev.every((course, index) => course._id === completed[index]?._id)) {
          return prev; // No change, return previous state
        }
        return completed;
      });
      
      console.log('Courses separated:', {
        total: enrollments.length,
        inProgress: inProgress.length,
        completed: completed.length
      });
    } else {
      setCoursesInProgress([]);
      setCompletedCourses([]);
    }
  }, [enrollments]);

  const handleRetry = () => {
    if (user?.walletAddress) {
      setLoading(true);
      setError(null);
      fetchEnrollments(false);
    } else {
      setError("No hay una wallet conectada. Por favor, inicia sesión primero.");
    }
  };

  const handleTryBasicMode = () => {
    fetchEnrollments(true);
  };

  // OPTIMIZATION: Early return for loading state to prevent rendering large component
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando tus cursos...</p>
      </Container>
    );
  }

  if (error && !usingMockData && enrollments.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error al cargar tus cursos</h4>
          <p>{error}</p>
          <div className="mt-3 d-flex flex-wrap gap-2">
            <Button variant="outline-primary" onClick={handleRetry} className="me-2">
              Intentar nuevamente
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={handleTryBasicMode}
            >
              Cargar versión simplificada
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          <p>Por favor, inicia sesión para ver tus cursos inscritos.</p>
          <Button 
            variant="primary" 
            className="mt-2"
            onClick={() => navigate('/')}
          >
            Ir al inicio
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">Mis Cursos</h2>
        </Card.Header>
        <Card.Body>
          <p className="lead">
            Aquí encontrarás todos los cursos en los que te has inscrito. Continúa tu aprendizaje desde donde lo dejaste.
          </p>
          {usingBasicMode && (
            <Alert variant="info" className="mb-0">
              <p className="mb-0">
                <strong>Nota:</strong> Estás viendo la versión simplificada de tus cursos. Algunas funciones como el progreso detallado podrían no estar disponibles.
              </p>
            </Alert>
          )}
          {usingMockData && (
            <Alert variant="warning" className="mb-0">
              <p className="mb-0">
                <strong>Atención:</strong> El servidor no está disponible. Mostrando datos de ejemplo. 
                <Button 
                  variant="link" 
                  className="p-0 ms-2" 
                  onClick={handleRetry}
                >
                  Intentar conectar nuevamente
                </Button>
              </p>
            </Alert>
          )}
          {error && enrollments.length > 0 && (
            <Alert variant="warning" className="mt-3">
              <p className="mb-0">{error}</p>
              <Button 
                variant="link" 
                className="p-0" 
                onClick={handleRetry}
              >
                Intentar nuevamente
              </Button>
            </Alert>
          )}
        </Card.Body>
      </Card>

      {(!enrollments || enrollments.length === 0) ? (
        <Alert variant="info">
          <p>No estás inscrito en ningún curso todavía.</p>
          <Button 
            variant="primary" 
            className="mt-2"
            onClick={() => navigate('/courses')}
          >
            Explorar cursos disponibles
          </Button>
        </Alert>
      ) : (
        <Tabs defaultActiveKey="in-progress" id="course-tabs" className="mb-4">
          <Tab 
            eventKey="in-progress" 
            title={
              <span>
                <FaPlay className="me-2" />
                En progreso
                {coursesInProgress.length > 0 && (
                  <Badge bg="primary" className="ms-2">{coursesInProgress.length}</Badge>
                )}
              </span>
            }
          >
            {coursesInProgress.length === 0 ? (
              <Alert variant="info" className="mt-3">
                <div className="text-center py-4">
                  <FaGraduationCap size={48} className="text-muted mb-3" />
                  <h5>No tienes cursos en progreso</h5>
                  <p className="text-muted">
                    Explora nuestro catálogo y comienza tu aprendizaje.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/courses')}
                  >
                    Explorar cursos
                  </Button>
                </div>
              </Alert>
            ) : (
              <Row className="g-4 mt-1">
                {coursesInProgress.map((enrollment) => (
                  <Col key={enrollment._id} md={6} lg={4}>
                    <EnrolledCourseCard 
                      course={enrollment.course}
                      progress={enrollment.progress || 0}
                      enrolledAt={enrollment.enrolledAt}
                      isEnrolled={true}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Tab>
          
          <Tab 
            eventKey="completed" 
            title={
              <span>
                <FaTrophy className="me-2" />
                Completados
                {completedCourses.length > 0 && (
                  <Badge bg="success" className="ms-2">{completedCourses.length}</Badge>
                )}
              </span>
            }
          >
            {completedCourses.length === 0 ? (
              <Alert variant="info" className="mt-3">
                <div className="text-center py-4">
                  <FaTrophy size={48} className="text-muted mb-3" />
                  <h5>Aún no has completado ningún curso</h5>
                  <p className="text-muted">
                    Completa todas las lecciones de un curso para que aparezca aquí.
                  </p>
                  {coursesInProgress.length > 0 && (
                    <Button 
                      variant="outline-primary" 
                      onClick={() => {
                        const tabs = document.querySelector('#course-tabs .nav-tabs');
                        const inProgressTab = tabs?.querySelector('[data-rr-ui-event-key="in-progress"]') as HTMLElement;
                        inProgressTab?.click();
                      }}
                    >
                      Ver cursos en progreso
                    </Button>
                  )}
                </div>
              </Alert>
            ) : (
              <Row className="g-4 mt-1">
                {completedCourses.map((enrollment) => (
                  <Col key={enrollment._id} md={6} lg={4}>
                    <EnrolledCourseCard 
                      course={enrollment.course}
                      progress={100}
                      enrolledAt={enrollment.enrolledAt}
                      isEnrolled={true}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Tab>
        </Tabs>
      )}
    </Container>
  );
};

export default MyCoursesPage; 