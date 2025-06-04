import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Modal, Form, Alert, Badge, ListGroup, Row, Col, ProgressBar, Accordion, Tab, Tabs, Spinner } from 'react-bootstrap';
import { FaPlay, FaPencilAlt, FaTrash, FaPlus, FaClock, FaCheck, FaLock, FaSignInAlt, FaEye, FaCode, FaQuestionCircle, FaArrowLeft, FaArrowRight, FaCog, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { Lesson, CodeExercise, CodeTestCase } from '../../types/lesson';
import { lessonService } from '../../services/lesson/lessonService';
import { formatDuration } from '../../utils/formatDuration';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/course/courseService';
import { apiClient } from '../../services/api/api.client';
import './LessonList.css';

interface LessonListProps {
  lessons?: Lesson[];
  previewLessons?: Lesson[];
  onLessonsUpdate?: (lessons: Lesson[]) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ 
  lessons: propLessons = [], 
  previewLessons: propPreviewLessons = [], 
  onLessonsUpdate 
}) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>(propLessons);
  const [previewLessons, setPreviewLessons] = useState<Lesson[]>(propPreviewLessons);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    duration: 0,
    order: 0,
    quizQuestions: [],
    codeExercises: []
  });
  const [activeTabKey, setActiveTabKey] = useState('content');
  
  // Estados para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<{id: string, title: string} | null>(null);

  useEffect(() => {
    if (JSON.stringify(propLessons) !== JSON.stringify(lessons)) {
      setLessons(propLessons);
    }
  }, [propLessons]);

  useEffect(() => {
    if (JSON.stringify(propPreviewLessons) !== JSON.stringify(previewLessons)) {
      setPreviewLessons(propPreviewLessons);
    }
  }, [propPreviewLessons]);

  useEffect(() => {
    let isComponentMounted = true;

    const checkInstructorStatus = async () => {
      if (!courseId || !user?.walletAddress) return;
      
      try {
        const course = await courseService.getCourseById(courseId, user.walletAddress);
        if (course && isComponentMounted) {
          setIsInstructor(course.instructor === user.walletAddress || user.role === 'moderator');
        }
      } catch (error) {
        if (isComponentMounted) {
          console.error('Error checking instructor status:', error);
          setError('Error al verificar permisos de instructor');
        }
      }
    };

    checkInstructorStatus();

    return () => {
      isComponentMounted = false;
    };
  }, [courseId, user?.walletAddress]);

  const refreshLessons = async () => {
    if (!courseId || !user?.walletAddress || !onLessonsUpdate) return;
    
    try {
      console.log(`Refrescando lecciones para el curso ${courseId}`);
      
      // Create auth options
      apiClient.setAuthHeader(user.walletAddress);
      
      // Hacer la solicitud a la API
      const data = await lessonService.getCourseLessons(courseId, user.walletAddress);
      console.log(`Lecciones refrescadas exitosamente: ${data.length}`);
      
      // Actualizar a través del callback del padre
      onLessonsUpdate(data);
      setError(null);
    } catch (error: any) {
      console.error('Error al refrescar lecciones:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar las lecciones.';
      setError(errorMessage);
    }
  };

  const handleShowModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData(lesson);
    } else {
      setEditingLesson(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        videoUrl: '',
        duration: 0,
        order: lessons.length,
        quizQuestions: [],
        codeExercises: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0,
      order: lessons.length,
      quizQuestions: [],
      codeExercises: []
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.walletAddress) {
        setError('No hay una wallet conectada');
        return;
      }
      
      if (editingLesson) {
        await lessonService.updateLesson(editingLesson._id, formData, user.walletAddress);
      } else {
        await lessonService.createLesson(courseId!, formData as any, user.walletAddress);
      }
      
      handleCloseModal();
      refreshLessons();
      setError(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setError('Error al guardar la lección');
    }
  };

  const handleDelete = async (lessonId: string) => {
    try {
      if (!user?.walletAddress) {
        setError('No hay una wallet conectada');
        return;
      }
      
      await lessonService.deleteLesson(lessonId, user.walletAddress);
      refreshLessons();
      setError(null);
      // Cerrar el modal después de eliminar
      setShowDeleteModal(false);
      setLessonToDelete(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError('Error al eliminar la lección');
    }
  };

  // Nueva función para mostrar el modal de confirmación
  const showDeleteConfirmation = (lesson: Lesson) => {
    setLessonToDelete({
      id: lesson._id,
      title: lesson.title
    });
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmDelete = () => {
    if (lessonToDelete) {
      handleDelete(lessonToDelete.id);
    }
  };

  // Función para cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setLessonToDelete(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Nuevo: Función para añadir un ejercicio de código
  const handleAddCodeExercise = () => {
    setFormData(prev => {
      const newCodeExercise: CodeExercise = {
        id: Date.now().toString(), // ID temporal
        title: 'Nuevo Ejercicio',
        description: 'Descripción del ejercicio',
        language: 'javascript',
        initialCode: '// Escribe tu código aquí\n\n',
        solution: '// Solución\n\n',
        hint: 'Pista para resolver el ejercicio',
        expectedOutput: 'Salida esperada'
      };
      
      return {
        ...prev,
        codeExercises: [...(prev.codeExercises || []), newCodeExercise]
      };
    });
  };

  // Nuevo: Función para eliminar un ejercicio de código
  const handleDeleteCodeExercise = (index: number) => {
    setFormData(prev => {
      const updatedExercises = [...(prev.codeExercises || [])];
      updatedExercises.splice(index, 1);
      return {
        ...prev,
        codeExercises: updatedExercises
      };
    });
  };

  // Nuevo: Función para actualizar un ejercicio de código
  const handleCodeExerciseChange = (
    index: number,
    field: keyof CodeExercise,
    value: string | CodeTestCase[]
  ) => {
    setFormData(prev => {
      const updatedExercises = [...(prev.codeExercises || [])];
      updatedExercises[index] = {
        ...updatedExercises[index],
        [field]: value
      };
      return {
        ...prev,
        codeExercises: updatedExercises
      };
    });
  };

  // Render preview for unauthenticated users
  if (!user?.walletAddress) {
  return (
      <Card className="shadow border-0">
        <Card.Header className="border-bottom">
          <h3 className="mb-0 lesson-text">Lecciones del Curso</h3>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {previewLessons.length > 0 ? (
            <div>
              <div className="alert alert-info">
                <div className="d-flex align-items-center">
                  <FaEye className="me-2" />
                  <div>
                    <strong>Vista previa de lecciones</strong>
                    <p className="mb-0">Inicia sesión para acceder al contenido completo de las lecciones.</p>
                  </div>
                </div>
              </div>
              
              <ListGroup variant="flush">
                {previewLessons.map((lesson, index) => (
                  <ListGroup.Item
                    key={lesson._id}
                    className="mb-3 rounded-3 hover-shadow transition-all lesson-item"
                  >
                    <Row className="align-items-center g-3">
                      <Col>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                          <h5 className="mb-0 lesson-text">{lesson.title}</h5>
                          <Badge bg="primary" pill className="px-3">Lección {index + 1}</Badge>
                          <Badge bg="secondary" pill className="px-3">
                            Vista previa
                          </Badge>
                        </div>
                        {lesson.description && (
                          <p className="mb-2 lesson-description">{lesson.description}</p>
                        )}
                        {lesson.duration && lesson.duration > 0 ? (
                          <small className="lesson-meta d-flex align-items-center">
                            <FaClock className="me-1" />
                            {formatDuration(lesson.duration)}
                          </small>
                        ) : null}
                      </Col>
                      <Col xs="auto">
                        <Button
                          variant="primary"
                          size="sm"
                          className="d-flex align-items-center shadow-sm"
                          onClick={() => navigate('/login')}
                        >
                          <FaLock className="me-1" /> Iniciar sesión para acceder
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              <div className="text-center mt-4">
                <Button
                  variant="primary"
                  className="d-flex align-items-center mx-auto"
                  style={{ width: 'fit-content' }}
                  onClick={() => navigate('/login')}
                >
                  <FaSignInAlt className="me-2" />
                  Iniciar sesión para acceder a todas las lecciones
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-5 text-center">
              <FaLock size={48} className="text-muted mb-3" />
              <h4 className="mb-3">Acceso restringido</h4>
              <p className="mb-4">
                Debes iniciar sesión para acceder a las lecciones de este curso.
              </p>
              <Button
                variant="primary"
                className="d-flex align-items-center mx-auto"
                style={{ width: 'fit-content' }}
                onClick={() => navigate('/login')}
              >
                <FaSignInAlt className="me-2" />
                Iniciar sesión
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  }

  return (
      <Card className="shadow border-0">
        <Card.Header className="border-bottom">
          <div className="d-flex justify-content-between align-items-center py-2">
            <h3 className="mb-0 lesson-text">Lecciones del Curso</h3>
            {isInstructor && (
              <Button
                variant="primary"
                onClick={() => handleShowModal()}
                className="d-flex align-items-center shadow-sm"
              >
                <FaPlus className="me-2" />
                Nueva Lección
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

        {lessons.length > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0 lesson-text">Progreso del curso</h5>
              <span className="badge bg-primary">
                {lessons.filter(l => l.isCompleted).length}/{lessons.length} lecciones
              </span>
            </div>
            <ProgressBar 
              variant="success" 
              now={Math.round((lessons.filter(l => l.isCompleted).length / lessons.length) * 100)} 
              className="lesson-progress" 
            />
            
            {/* Botón para continuar desde donde se quedó */}
            <div className="mt-3 d-flex justify-content-center">
              {(() => {
                // Encontrar la primera lección no completada
                const nextLessonIndex = lessons.findIndex(l => !l.isCompleted);
                const hasCompletedAll = nextLessonIndex === -1;
                
                if (hasCompletedAll) {
                  return (
                    <Badge bg="success" className="px-4 py-2 fs-6">
                      <FaCheck className="me-2" />
                      ¡Curso completado!
                    </Badge>
                  );
                } else {
                  return (
                    <Button
                      variant="primary"
                      className="px-4 py-2 fw-bold"
                      onClick={() => navigate(`/course/${courseId}/lesson/${nextLessonIndex + 1}`)}
                    >
                      <FaPlay className="me-2" />
                      {nextLessonIndex === 0 ? 'Comenzar curso' : 'Continuar curso'}
                    </Button>
                  );
                }
              })()}
            </div>
          </div>
        )}

        <ListGroup variant="flush">
          {lessons.map((lesson, index) => (
            <ListGroup.Item
              key={lesson._id}
              className={`mb-3 rounded-3 hover-shadow transition-all lesson-item`}
              action
              onClick={() => navigate(`/course/${courseId}/lesson/${index + 1}`)}
              style={{
                borderLeft: lesson.isCompleted ? '4px solid #198754' : 'none',
                backgroundColor: lesson.isCompleted ? '#f8fff9' : 'white',
                boxShadow: lesson.isCompleted ? '0 0 8px rgba(25, 135, 84, 0.2)' : 'none'
              }}
            >
              <Row className="align-items-center g-3">
                <Col>
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                    <h5 className="mb-0 lesson-text" style={{ 
                      color: lesson.isCompleted ? '#198754' : 'inherit'
                    }}>{lesson.title}</h5>
                    <Badge bg="primary" pill className="px-3">Lección {index + 1}</Badge>
                    {lesson.isCompleted ? (
                      <Badge bg="success" pill className="px-3">
                        <FaCheck className="me-1" /> Completada
                      </Badge>
                    ) : (
                      <Badge bg="secondary" pill className="px-3">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="mb-2 lesson-description">{lesson.description}</p>
                  )}
                  <div className="d-flex align-items-center gap-2">
                    {lesson.duration && lesson.duration > 0 ? (
                      <small className="lesson-meta d-flex align-items-center">
                        <FaClock className="me-1" />
                        {formatDuration(lesson.duration)}
                      </small>
                    ) : null}
                    {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                      <Badge 
                        bg={lesson.quizCompleted ? "success" : "info"} 
                        className="lesson-meta d-flex align-items-center"
                        style={{
                          color: lesson.quizCompleted ? '#fff' : '#fff',
                          backgroundColor: lesson.quizCompleted ? '#198754' : '#0dcaf0',
                          border: lesson.quizCompleted ? '1px solid #198754' : '1px solid #0dcaf0'
                        }}
                      >
                        <FaQuestionCircle className="me-1" />
                        Quiz {lesson.quizCompleted ? `completado (${lesson.quizScore}%)` : `(${lesson.quizQuestions.length} preguntas)`}
                      </Badge>
                    )}
                    {lesson.codeExercises && lesson.codeExercises.length > 0 && (
                      <Badge 
                        bg={lesson.codeExercisesCompleted ? "success" : "info"} 
                        className="lesson-meta d-flex align-items-center"
                        style={{
                          color: lesson.codeExercisesCompleted ? '#fff' : '#fff',
                          backgroundColor: lesson.codeExercisesCompleted ? '#198754' : '#0dcaf0',
                          border: lesson.codeExercisesCompleted ? '1px solid #198754' : '1px solid #0dcaf0'
                        }}
                      >
                        <FaCode className="me-1" />
                        Ejercicios {lesson.codeExercisesCompleted ? "completados" : `(${lesson.codeExercises.length})`}
                      </Badge>
                    )}
                  </div>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2">
                    {lesson.videoUrl && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(lesson.videoUrl, '_blank');
                        }}
                      >
                        <FaPlay className="me-1" /> Ver Video
                      </Button>
                    )}
                    {isInstructor && (
                      <>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="d-flex align-items-center shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowModal(lesson);
                          }}
                        >
                          <FaPencilAlt className="me-1" /> Editar
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="d-flex align-items-center shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(lesson);
                          }}
                        >
                          <FaTrash className="me-1" /> Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </ListGroup.Item>
          ))}
        </ListGroup>

        {lessons.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No hay lecciones disponibles para este curso.</p>
          </div>
          )}
        </Card.Body>

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingLesson ? 'Editar Lección' : 'Nueva Lección'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Tabs 
              activeKey={activeTabKey} 
              onSelect={(k) => k && setActiveTabKey(k)} 
              className="mb-4"
            >
              <Tab eventKey="basic" title="Información Básica">
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
              <Form.Control
                type="text"
                name="title"
                    value={formData.title || ''}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Row>
                  <Form.Group as={Col} className="mb-3">
                    <Form.Label>Duración (minutos)</Form.Label>
                    <Form.Control
                      type="number"
                      name="duration"
                      value={formData.duration || 0}
                onChange={handleInputChange}
                      min="0"
              />
            </Form.Group>

                  <Form.Group as={Col} className="mb-3">
                    <Form.Label>Orden</Form.Label>
                    <Form.Control
                      type="number"
                      name="order"
                      value={formData.order || 0}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </Form.Group>
                </Row>
              </Tab>

              <Tab eventKey="content" title="Contenido">
                <Form.Group className="mb-3">
                  <Form.Label>Contenido de la Lección</Form.Label>
              <Form.Control
                as="textarea"
                    rows={12}
                name="content"
                    value={formData.content || ''}
                onChange={handleInputChange}
                required
              />
                  <Form.Text className="text-muted">
                    Puedes usar Markdown para dar formato a tu contenido.
                  </Form.Text>
            </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>URL del Video (opcional)</Form.Label>
              <Form.Control
                type="url"
                name="videoUrl"
                    value={formData.videoUrl || ''}
                onChange={handleInputChange}
                    placeholder="https://example.com/video"
                  />
                </Form.Group>
              </Tab>

              <Tab eventKey="quiz" title="Preguntas">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Preguntas de Quiz</h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => {
                        // Añadir pregunta
                        setFormData(prev => ({
                          ...prev,
                          quizQuestions: [
                            ...(prev.quizQuestions || []),
                            { question: '', options: ['', '', '', ''], correctAnswerIndex: 0 }
                          ]
                        }));
                      }}
                    >
                      <FaPlus className="me-1" /> Añadir Pregunta
                    </Button>
                  </div>
                </div>

                {formData.quizQuestions && formData.quizQuestions.length > 0 ? (
                  <Accordion className="mb-3">
                    {formData.quizQuestions.map((question, qIndex) => (
                      <Accordion.Item key={qIndex} eventKey={qIndex.toString()}>
                        <Accordion.Header>
                          {question.question || `Pregunta ${qIndex + 1}`}
                        </Accordion.Header>
                        <Accordion.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>Pregunta</Form.Label>
                            <Form.Control
                              type="text"
                              value={question.question}
                              onChange={(e) => {
                                const updatedQuestions = [...formData.quizQuestions!];
                                updatedQuestions[qIndex].question = e.target.value;
                                setFormData({...formData, quizQuestions: updatedQuestions});
                              }}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Opciones</Form.Label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="d-flex mb-2 align-items-center">
                                <Form.Check
                                  type="radio"
                                  name={`correctOption-${qIndex}`}
                                  checked={question.correctAnswerIndex === oIndex}
                                  onChange={() => {
                                    const updatedQuestions = [...formData.quizQuestions!];
                                    updatedQuestions[qIndex].correctAnswerIndex = oIndex;
                                    setFormData({...formData, quizQuestions: updatedQuestions});
                                  }}
                                  className="me-2"
                                />
                                <Form.Control
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const updatedQuestions = [...formData.quizQuestions!];
                                    updatedQuestions[qIndex].options[oIndex] = e.target.value;
                                    setFormData({...formData, quizQuestions: updatedQuestions});
                                  }}
                                  placeholder={`Opción ${oIndex + 1}`}
                                  required
                                />
                              </div>
                            ))}
                          </Form.Group>

                          <div className="d-flex justify-content-end">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => {
                                const updatedQuestions = [...formData.quizQuestions!];
                                updatedQuestions.splice(qIndex, 1);
                                setFormData({...formData, quizQuestions: updatedQuestions});
                              }}
                            >
                              <FaTrash className="me-1" /> Eliminar
                            </Button>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted text-center py-3">
                    No hay preguntas añadidas aún. Añade preguntas con el botón arriba.
                  </p>
                )}
              </Tab>

              <Tab eventKey="code" title="Ejercicios de Código">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Ejercicios de Código</h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={handleAddCodeExercise}
                    >
                      <FaPlus className="me-1" /> Añadir Ejercicio
                    </Button>
                  </div>
                </div>

                {formData.codeExercises && formData.codeExercises.length > 0 ? (
                  <Accordion className="mb-3">
                    {formData.codeExercises.map((exercise, index) => (
                      <Accordion.Item key={index} eventKey={index.toString()}>
                        <Accordion.Header>
                          <div className="d-flex align-items-center">
                            <FaCode className="me-2 text-primary" />
                            {exercise.title || `Ejercicio ${index + 1}`}
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          <Form.Group className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                              type="text"
                              value={exercise.title}
                              onChange={(e) => handleCodeExerciseChange(index, 'title', e.target.value)}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={2}
                              value={exercise.description}
                              onChange={(e) => handleCodeExerciseChange(index, 'description', e.target.value)}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Lenguaje</Form.Label>
                            <Form.Select 
                              value={exercise.language}
                              onChange={(e) => handleCodeExerciseChange(index, 'language', e.target.value)}
                            >
                              <option value="javascript">JavaScript</option>
                              <option value="typescript">TypeScript</option>
                              <option value="python">Python</option>
                              <option value="rust">Rust</option>
                              <option value="java">Java</option>
                              <option value="cpp">C++</option>
                            </Form.Select>
                          </Form.Group>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Código Inicial</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={5}
                                  value={exercise.initialCode}
                                  onChange={(e) => handleCodeExerciseChange(index, 'initialCode', e.target.value)}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Solución</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={5}
                                  value={exercise.solution}
                                  onChange={(e) => handleCodeExerciseChange(index, 'solution', e.target.value)}
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Salida Esperada</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={exercise.expectedOutput}
                                  onChange={(e) => handleCodeExerciseChange(index, 'expectedOutput', e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Pista</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={exercise.hint}
                                  onChange={(e) => handleCodeExerciseChange(index, 'hint', e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-3">
                            <Form.Label>Casos de Prueba</Form.Label>
                            {exercise.testCases && exercise.testCases.length > 0 ? (
                              exercise.testCases.map((tc, tcIdx) => (
                                <div key={tcIdx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8, borderRadius: 4 }}>
                                  <Form.Control
                                    className="mb-2"
                                    type="text"
                                    placeholder="Input"
                                    value={tc.input}
                                    onChange={e => {
                                      const updated = [...(exercise.testCases || [])];
                                      updated[tcIdx].input = e.target.value;
                                      handleCodeExerciseChange(index, 'testCases', updated);
                                    }}
                                  />
                                  <Form.Control
                                    className="mb-2"
                                    type="text"
                                    placeholder="Expected Output"
                                    value={tc.expectedOutput}
                                    onChange={e => {
                                      const updated = [...(exercise.testCases || [])];
                                      updated[tcIdx].expectedOutput = e.target.value;
                                      handleCodeExerciseChange(index, 'testCases', updated);
                                    }}
                                  />
                                  <Form.Control
                                    className="mb-2"
                                    type="text"
                                    placeholder="Descripción"
                                    value={tc.description}
                                    onChange={e => {
                                      const updated = [...(exercise.testCases || [])];
                                      updated[tcIdx].description = e.target.value;
                                      handleCodeExerciseChange(index, 'testCases', updated);
                                    }}
                                  />
                                  <Button variant="outline-danger" size="sm" onClick={() => {
                                    const updated = [...(exercise.testCases || [])];
                                    updated.splice(tcIdx, 1);
                                    handleCodeExerciseChange(index, 'testCases', updated);
                                  }}>Eliminar</Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted mb-2">No hay casos de prueba añadidos.</div>
                            )}
                            <Button variant="outline-primary" size="sm" onClick={() => {
                              const updated = [...(exercise.testCases || [])];
                              updated.push({ input: '', expectedOutput: '', description: '' });
                              handleCodeExerciseChange(index, 'testCases', updated);
                            }}>Agregar caso de prueba</Button>
                          </Form.Group>

                          <div className="d-flex justify-content-end">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteCodeExercise(index)}
                            >
                              <FaTrash className="me-1" /> Eliminar
                            </Button>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted text-center py-3">
                    No hay ejercicios de código añadidos aún. Añade ejercicios con el botón arriba.
                  </p>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingLesson ? 'Actualizar' : 'Crear'} Lección
            </Button>
          </Modal.Footer>
        </Form>
        </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        show={showDeleteModal}
        onHide={cancelDelete}
        backdrop="static"
        keyboard={false}
        size="sm"
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center text-danger">
            <FaTrash className="me-2" />
            Confirmar eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div className="text-center mb-3">
            <div className="bg-danger-subtle rounded-circle d-inline-flex align-items-center justify-content-center" 
                 style={{ width: '64px', height: '64px' }}>
              <FaTrash size={24} className="text-danger" />
            </div>
          </div>
          <div className="text-center">
            <h5 className="mb-3">¿Eliminar esta lección?</h5>
            <p className="text-muted mb-3">
              Estás a punto de eliminar la lección:
            </p>
            <div className="bg-light rounded p-3 mb-3">
              <strong>"{lessonToDelete?.title}"</strong>
            </div>
            <p className="text-muted small">
              Esta acción no se puede deshacer. La lección se eliminará permanentemente.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={cancelDelete} className="me-2">
            <FaArrowLeft className="me-1" /> Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="px-4">
            <FaTrash className="me-1" /> Eliminar lección
          </Button>
        </Modal.Footer>
      </Modal>
      </Card>
  );
};

export default LessonList;