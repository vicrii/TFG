import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Tab, Tabs, Modal } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { lessonService } from '../../services/lesson/lessonService';
import { courseService } from '../../services/course/courseService';
import { enrollmentService } from '../../services/enrollment/enrollmentService';
import LessonContent from '../../components/lesson/LessonContent';
import LessonQuiz from '../../components/lesson/LessonQuiz';
import { FaArrowLeft, FaArrowRight, FaBook, FaCheck, FaLock, FaExclamationTriangle } from 'react-icons/fa';

const LessonDetail: React.FC = () => {
  const { courseId, lessonNumber } = useParams<{ courseId: string, lessonNumber: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('content');
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState<boolean>(true);
  
  // Estados para modal de advertencia
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');

  useEffect(() => {
    console.log('Effect triggered with:', { user, authLoading, courseId, lessonNumber });
    
    // Si la autenticación aún está cargando, no hacer nada
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    // Si no hay usuario después de que la autenticación termine, establecer error
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      setCheckingEnrollment(false);
      return;
    }
    
    if (!courseId || !lessonNumber) {
      setError('Missing course or lesson number');
      setLoading(false);
      setCheckingEnrollment(false);
      return;
    }
    
    // Verificar inscripción antes de cargar la lección
    checkEnrollmentAndLoad();
    setActiveTab('content');
  }, [user, authLoading, courseId, lessonNumber]);
  
  // Redirigir si la anterior no está completada (pero permitir si la anterior no tiene quiz)
  useEffect(() => {
    if (!allLessons.length || !lessonNumber || !courseId) return;
    
    const currentIdx = parseInt(lessonNumber) - 1;
    
    // Si no es la primera lección, verificar que la anterior esté completada
    if (currentIdx > 0) {
      const prevLesson = allLessons[currentIdx - 1];
      
      // Si la lección anterior no está completada, redirigir
      if (!prevLesson?.isCompleted) {
        console.log('Redirecting: previous lesson not completed', {
          currentLesson: currentIdx + 1,
          previousLesson: prevLesson?.title,
          previousCompleted: prevLesson?.isCompleted
        });
        
        setWarningMessage('Debes completar la lección anterior para acceder a esta.');
        setShowWarningModal(true);
        navigate(`/course/${courseId}/lesson/${currentIdx}`, { replace: true });
        return;
      }
    }
  }, [allLessons, lessonNumber, courseId, navigate]);

  const showAccessWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const fetchLessonAndCourse = async () => {
    if (!user?.walletAddress || !courseId || !lessonNumber) {
      setError('Faltan datos necesarios para cargar la lección');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cargar curso y lecciones en paralelo
      const [courseData, lessons] = await Promise.all([
        courseService.getCourseById(courseId, user.walletAddress),
        lessonService.getCourseLessons(courseId, user.walletAddress)
      ]);

      if (!courseData) {
        throw new Error('Curso no encontrado');
      }
      
      // Encontrar la lección por su número (lessonNumber es 1-based)
      const lessonIndex = parseInt(lessonNumber) - 1;
      if (lessonIndex < 0 || lessonIndex >= lessons.length) {
        throw new Error('Lección no encontrada');
      }

      // Obtener la lección completa por ID para incluir ejercicios y preguntas
      const lessonPreview = lessons[lessonIndex];
      const lessonData = await lessonService.getLessonById(lessonPreview._id, user.walletAddress);
      
      // Actualizar todos los estados
      setLesson(lessonData);
      setCourse(courseData);
      setAllLessons(lessons);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchLessonAndCourse:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar la lección');
      setLoading(false);
    }
  };
  
  const checkEnrollmentAndLoad = async () => {
    if (!user?.walletAddress || !courseId) {
      setError('Faltan datos necesarios');
      setLoading(false);
      setCheckingEnrollment(false);
      return;
    }

    try {
      setCheckingEnrollment(true);
      console.log('Checking enrollment for course:', courseId);
      
      // Verificar si el usuario está inscrito
      const enrollmentStatus = await enrollmentService.checkEnrollmentStatus(courseId);
      setIsEnrolled(enrollmentStatus.isEnrolled);
      
      if (!enrollmentStatus.isEnrolled) {
        console.log('User not enrolled in course');
        setError('No estás inscrito en este curso');
        setLoading(false);
        setCheckingEnrollment(false);
        return;
      }
      
      // Si está inscrito, cargar la lección
      await fetchLessonAndCourse();
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setError('Error al verificar la inscripción');
      setLoading(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };
  
  const handlePrevious = () => {
    if (!course?.lessons || !lessonNumber || !courseId) return;
    
    const currentIndex = parseInt(lessonNumber) - 1;
    if (currentIndex > 0) {
      navigate(`/course/${courseId}/lesson/${currentIndex}`);
    }
  };
  
  const handleNext = () => {
    if (!course?.lessons || !lessonNumber || !courseId) return;
    
    const currentIndex = parseInt(lessonNumber) - 1;
    if (currentIndex < course.lessons.length - 1) {
      navigate(`/course/${courseId}/lesson/${currentIndex + 2}`);
    }
  };
  
  // Refrescar lecciones tras completar un quiz
  const refreshLessons = async () => {
    if (!user?.walletAddress || !courseId) return;
    
    try {
      console.log('Refrescando lecciones después de completar quiz...');
      
      // Reducir delay para respuesta más rápida
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obtener lecciones actualizadas
      const lessons = await lessonService.getCourseLessons(courseId, user.walletAddress);
      console.log('Lecciones refrescadas:', lessons.map(l => ({ title: l.title, isCompleted: l.isCompleted })));
      
      setAllLessons(lessons);
      
      // También actualizar la lección actual con datos completos
      const lessonIndex = parseInt(lessonNumber || '0') - 1;
      if (lessonIndex >= 0 && lessonIndex < lessons.length) {
        const lessonPreview = lessons[lessonIndex];
        const lessonData = await lessonService.getLessonById(lessonPreview._id, user.walletAddress);
        console.log('Lección actual actualizada:', { title: lessonData?.title, isCompleted: lessonData?.isCompleted });
        setLesson(lessonData);
      }
    } catch (error) {
      console.error('Error refrescando lecciones:', error);
    }
  };
  
  // Log para depuración del estado de las lecciones
  console.log('allLessons:', allLessons.map(l => ({ title: l.title, isCompleted: l.isCompleted })));
  
  // Mostrar spinner mientras la autenticación está cargando
  if (authLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Verificando autenticación...</p>
      </div>
    );
  }
  
  // Solo después de que la autenticación esté resuelta, verificar si hay usuario
  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h4>Authentication Required</h4>
          <p>Please connect your wallet to view this lesson.</p>
        </Alert>
      </Container>
    );
  }
  
  if (checkingEnrollment) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Verificando inscripción...</p>
      </div>
    );
  }
  
  if (!isEnrolled && !loading) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading className="d-flex align-items-center">
            <FaLock className="me-2" />
            Acceso Restringido
          </Alert.Heading>
          <p>No estás inscrito en este curso. Debes inscribirte para acceder a las lecciones.</p>
          <div className="d-flex gap-2 mt-3">
            <Button 
              variant="primary" 
              onClick={() => navigate(`/course/${courseId}`)}
            >
              Ver Curso e Inscribirse
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/courses')}
            >
              Explorar Cursos
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading lesson...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <div className="d-flex justify-content-end">
          <Button onClick={fetchLessonAndCourse} variant="outline-danger">
            Retry
          </Button>
        </div>
      </Alert>
    );
  }
  
  if (!lesson || !course) {
    return (
      <Alert variant="warning">
        <p>Lesson not found or you don't have access to this content.</p>
      </Alert>
    );
  }
  
  const currentIndex = lessonNumber ? parseInt(lessonNumber) - 1 : -1;
  const isFirstLesson = currentIndex === 0;
  const isLastLesson = currentIndex === (allLessons.length ?? 0) - 1;
  
  console.log('Current lesson state:', {
    currentIndex,
    allLessonsLength: allLessons.length,
    currentLesson: allLessons[currentIndex]?.title,
    currentLessonCompleted: allLessons[currentIndex]?.isCompleted
  });
  
  return (
    <Container fluid className="py-4 lesson-detail">
      <Row>
        {/* Columna lateral con lista de lecciones */}
        <Col md={3} className="lesson-sidebar">
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Lecciones del Curso</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {allLessons.map((l: any, index: number) => {
                  // Lógica simplificada: primera lección siempre accesible, las demás solo si la anterior está completada
                  const canAccess = index === 0 || allLessons[index - 1]?.isCompleted;
                  
                  return (
                    <button
                      key={l._id}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${
                        index === currentIndex ? 'active' : ''
                      } ${!canAccess ? 'disabled' : ''} ${l.isCompleted ? 'completed-lesson' : ''}`}
                      onClick={() => {
                        if (canAccess) {
                          navigate(`/course/${courseId}/lesson/${index + 1}`);
                        } else {
                          showAccessWarning('Debes completar la lección anterior para acceder a esta.');
                        }
                      }}
                      disabled={!canAccess}
                      style={{
                        ...(!canAccess ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                        ...(l.isCompleted ? {
                          borderLeft: '4px solid #28a745',
                          backgroundColor: '#f8fff9'
                        } : {}),
                        ...(index === currentIndex ? {
                          backgroundColor: '#0d6efd',
                          color: 'white'
                        } : {})
                      }}
                    >
                      <div className="d-flex align-items-center w-100">
                        <div 
                          className="lesson-number me-2"
                          style={{
                            backgroundColor: l.isCompleted 
                              ? '#28a745' 
                              : (index === currentIndex ? 'white' : 'var(--bs-light)'),
                            color: l.isCompleted 
                              ? 'white' 
                              : (index === currentIndex ? '#0d6efd' : 'inherit')
                          }}
                        >
                          {l.isCompleted ? <FaCheck size={12} /> : index + 1}
                        </div>
                        <div className="lesson-info flex-grow-1">
                          <div className="lesson-title">{l.title}</div>
                          {l.isCompleted && (
                            <small 
                              className="text-success"
                              style={{
                                color: index === currentIndex ? 'rgba(255,255,255,0.8) !important' : undefined
                              }}
                            >
                              <FaCheck className="me-1" /> Completada
                            </small>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Contenido principal */}
        <Col md={9}>
          <div className="lesson-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <Link to={`/course/${courseId}`} className="text-decoration-none me-3">
                  <Button variant="outline-secondary" size="sm" className="d-flex align-items-center">
                    <FaBook className="me-2" />
                    {course.title}
                  </Button>
                </Link>
                <h2 className="mb-0 lesson-title">Lección {currentIndex + 1}: {lesson.title}</h2>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  onClick={handlePrevious}
                  disabled={isFirstLesson}
                  className="d-flex align-items-center"
                >
                  <FaArrowLeft className="me-2" />
                  Anterior
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={handleNext}
                  disabled={isLastLesson}
                  className="d-flex align-items-center"
                >
                  Siguiente
                  <FaArrowRight className="ms-2" />
                </Button>
              </div>
            </div>
          </div>
          
          <Card className="shadow-sm lesson-content-card">
            <Card.Body className="p-4">
              <Tabs
                activeKey={activeTab}
                onSelect={async (k) => {
                  // El quiz solo está disponible si la lección anterior está completada (o es la primera lección)
                  const canAccessQuiz = currentIndex === 0 || allLessons[currentIndex - 1]?.isCompleted;
                  
                  if (k === 'quiz' && !canAccessQuiz) {
                    showAccessWarning('Debes completar la lección anterior para acceder a este quiz.');
                    return;
                  }
                  setActiveTab(k!);
                  if (k === 'quiz') {
                    // Refresca el estado al volver del quiz
                    await refreshLessons();
                  }
                }}
                className="lesson-tabs"
              >
                <Tab eventKey="content" title="Contenido">
                  <LessonContent lesson={lesson} onCompleted={refreshLessons} />
                </Tab>
                {(lesson.quizQuestions && lesson.quizQuestions.length > 0) || (lesson.codeExercises && lesson.codeExercises.length > 0) ? (
                  <Tab
                    eventKey="quiz"
                    title={(() => {
                      const hasQuiz = lesson.quizQuestions && lesson.quizQuestions.length > 0;
                      const hasCodeExercises = lesson.codeExercises && lesson.codeExercises.length > 0;
                      
                      if (hasQuiz && hasCodeExercises) {
                        return `Quiz & Ejercicios (${lesson.quizQuestions.length}) + ${lesson.codeExercises.length} ejercicios`;
                      } else if (hasQuiz) {
                        return `Quiz (${lesson.quizQuestions.length})`;
                      } else if (hasCodeExercises) {
                        return `Ejercicios (${lesson.codeExercises.length})`;
                      }
                      return 'Quiz & Ejercicios';
                    })()}
                    disabled={currentIndex > 0 && !allLessons[currentIndex - 1]?.isCompleted}
                  >
                    <LessonQuiz lessonId={lesson._id} courseId={courseId || ''} onCompleted={refreshLessons} />
                  </Tab>
                ) : null}
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de advertencia de acceso */}
      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Acceso restringido
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <FaLock size={48} className="text-warning mb-3" />
            <p className="mb-0">{warningMessage}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning" onClick={() => setShowWarningModal(false)}>
            Entendido
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .lesson-detail {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .lesson-sidebar {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          padding: 1rem 0.5rem;
          min-height: 400px;
          position: sticky;
          top: 90px;
          z-index: 2;
        }
        
        .lesson-header {
          background: var(--bs-light);
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .lesson-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--bs-dark);
        }
        
        .lesson-content-card {
          border: none;
          border-radius: 0.5rem;
        }
        
        .lesson-tabs {
          margin-top: 1rem;
        }
        
        .lesson-tabs .nav-link {
          font-weight: 500;
          padding: 0.75rem 1.5rem;
        }
        
        .lesson-tabs .nav-link.active {
          background-color: var(--bs-primary);
          color: white;
          border: none;
        }
        
        .lesson-tabs .tab-content {
          padding: 1.5rem 0;
        }

        .lesson-number {
          width: 28px;
          height: 28px;
          background: var(--bs-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .completed-lesson {
          transition: all 0.2s ease;
        }

        .completed-lesson:hover {
          background-color: #e8f5e8 !important;
        }

        .list-group-item:hover:not(.disabled):not(.active) {
          background-color: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .list-group-item.active {
          border-color: #0d6efd !important;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
        }

        .lesson-info {
          flex: 1;
          min-width: 0;
        }

        .lesson-info .lesson-title {
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .list-group-item {
          cursor: pointer;
          border: none;
          border-radius: 8px;
          margin-bottom: 4px;
          transition: background 0.2s;
        }

        .list-group-item:hover {
          background: #f0f4ff;
        }

        .list-group-item.active {
          background: #0d6efd;
          color: #fff;
          font-weight: bold;
        }
      `}</style>
    </Container>
  );
};

export default LessonDetail; 