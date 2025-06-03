import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Form, Button, Modal, ProgressBar, Tab, Tabs, Badge, Alert } from 'react-bootstrap';
import '../styles/YoutubeTranscriber.css';
import { FaFileAlt, FaSpinner, FaCheckCircle, FaTimesCircle, FaEdit, FaGraduationCap, FaTrash, FaPlus, FaQuestionCircle, FaCog, FaCode } from 'react-icons/fa';
import { courseService } from '../services/course/courseService';
import { apiClient } from '../services/api/api.client';
import { TranscriptionResult, Lesson, CourseFormData, EnhancedLesson } from '../types/youtubeTranscriber.types';

// Configuración base de axios usando la misma lógica que apiClient
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }
  return '';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

const TextTranscriber: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados principales
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ingresa un texto de al menos 30 palabras para comenzar');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState('');
  
  // Estados para la edición del resumen
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  
  // Estados para el modal de creación de curso
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    content: '',
    level: 'beginner',
    price: 0,
    tags: [],
    imageUrl: '',
    lessons: []
  });
  const [tagsInput, setTagsInput] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('content');

  // Estados para opciones avanzadas de generación
  const [contentType, setContentType] = useState<'all' | 'content' | 'quiz' | 'code'>('all');
  const [generateAdvancedContent, setGenerateAdvancedContent] = useState(false);
  const [numberOfLessons, setNumberOfLessons] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeTestCases, setIncludeTestCases] = useState(true);
  const [includeHints, setIncludeHints] = useState(true);

  // Función para contar palabras
  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Simular progreso suave mientras loading
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    if (loading) {
      setProcessingProgress(5);
      progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev < 95) {
            return prev + Math.random() * 2 + 0.5;
          } else {
            return 95;
          }
        });
      }, 500);
    } else {
      if (error) {
        setProcessingProgress(0);
      } else if (result && result.status !== 'error') {
        setProcessingProgress(100);
      }
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading, error, result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    setStatusMessage('Procesando texto...');
    setProcessingProgress(0);

    const wordCount = countWords(textInput);
    if (wordCount < 30) {
      setError(`El texto debe tener al menos 30 palabras. Actualmente tiene ${wordCount} palabras.`);
      setLoading(false);
      setStatusMessage('Error: Texto demasiado corto.');
      return;
    }

    try {
      console.log('Enviando texto a procesar:', textInput.substring(0, 100) + '...');
      setStatusMessage('Analizando contenido y generando curso...');
      setProcessingProgress(5);

      // Preparar datos para envío
      const requestData = {
        text: textInput, // Enviamos texto en lugar de URL
        generateAdvancedContent,
        contentType,
        numberOfLessons,
        selectedLanguage,
        difficultyLevel,
        includeExamples,
        includeTestCases,
        includeHints
      };

      if (generateAdvancedContent) {
        console.log('Generando contenido avanzado con opciones:', {
          contentType,
          numberOfLessons,
          selectedLanguage,
          difficultyLevel
        });
        setStatusMessage(`Generando ${numberOfLessons} lecciones con contenido ${contentType === 'all' ? 'completo' : contentType}...`);
      }

      // Llamada a la API de generación de contenido
      const response = await api.post<TranscriptionResult>('/api/generate-from-text', requestData);

      console.log('Respuesta recibida:', response.data);
      setResult(response.data);
      setEditedSummary(response.data.summary);

      if(response.data.status === 'error') {
        setError(response.data.transcription);
        setStatusMessage('Error durante el proceso.');
      } else {
        setStatusMessage('¡Proceso completado con éxito!');
        if (generateAdvancedContent) {
          setStatusMessage(`¡${numberOfLessons} lecciones generadas con contenido ${contentType} exitosamente!`);
        }
        setProcessingProgress(100);
      }
    } catch (err: any) {
      console.error('Error en la llamada API:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error desconocido de red o servidor.';
      setError(errorMsg);
      setStatusMessage('Error en la conexión con el servidor.');
      setProcessingProgress(0);
    }
    setLoading(false);
  };

  // Las funciones de edición y manejo de curso se mantienen igual...
  const handleEditSummary = () => {
    setIsEditingSummary(true);
  };

  const handleSaveSummary = () => {
    if (result) {
      setResult({
        ...result,
        summary: editedSummary
      });
    }
    setIsEditingSummary(false);
  };

  const handleCreateCourse = () => {
    if (!result) return;
    
    const initialLessons: Lesson[] = Array.isArray(result.lessons) && result.lessons.length > 0 
      ? result.lessons.map((lesson) => {
          if (typeof lesson === 'string') {
            const content = generateAdvancedContent 
              ? `<h2>${lesson}</h2><p>Contenido educativo generado automáticamente para la lección: ${lesson}</p>`
              : `## ${lesson}\n\nContenido de la lección por definir.`;
            
            return {
              title: lesson,
              content: content,
              quizQuestions: []
            };
          } else {
            return {
              title: lesson.title,
              content: lesson.content || `<h2>${lesson.title}</h2><p>Contenido educativo generado automáticamente.</p>`,
              quizQuestions: lesson.quizQuestions || [],
              codeExercises: lesson.codeExercises || []
            };
          }
        })
      : [];
      
    const courseTitle = result.title || `Curso de Texto - ${new Date().toLocaleDateString()}`;
    const courseDescription = result.summary 
      ? result.summary.substring(0, 200) + (result.summary.length > 200 ? '...' : '')
      : 'Curso generado automáticamente desde contenido de texto.';
    const courseContent = editedSummary || result.summary || 'Contenido del curso generado automáticamente.';

    setCourseFormData({
      title: courseTitle,
      description: courseDescription,
      content: courseContent,
      level: 'beginner',
      price: 0,
      tags: [],
      imageUrl: '',
      lessons: initialLessons
    });
    
    const allText = [courseTitle, courseDescription, ...initialLessons.map(l => l.content)].join(' ');
    const suggestedTags = generateSuggestedTagsFromText(allText);
    setTagsInput(suggestedTags.join(', '));
    setCourseFormData(prev => ({...prev, tags: suggestedTags}));
    setShowCourseModal(true);
  };

  const generateSuggestedTagsFromText = (text: string): string[] => {
    const excludeWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'en', 'por', 'para', 'con', 'a', 'que', 'como', 'sobre', 'este', 'esta', 'ese', 'esa', 'son', 'más', 'muy', 'pero', 'también', 'se', 'al', 'lo', 'su', 'sus', 'es', 'fue', 'ha', 'han', 'ser', 'o', 'u', 'si', 'no', 'ya', 'le', 'les', 'ni', 'porque', 'entre', 'donde', 'cuando', 'qué', 'cuál', 'cuáles', 'quién', 'quienes', 'cual', 'cuales', 'quien', 'quienes', 'etc'];
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(' ').filter(word => word.length > 3 && !excludeWords.includes(word));
    const wordCount: {[key: string]: number} = {};
    words.forEach(word => { wordCount[word] = (wordCount[word] || 0) + 1; });
    return Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    setCourseFormData(prev => ({
      ...prev,
      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  const handlePublishCourse = async () => {
    if (!user?.walletAddress) {
      setError('Debes estar conectado con tu wallet para crear un curso');
      return;
    }
    
    setCreatingCourse(true);
    
    try {
      const courseData = {
        ...courseFormData,
        updatedAt: new Date().toISOString()
      };
      
      const newCourse = await courseService.createCourse(courseData, user.walletAddress);
      
      if (courseFormData.lessons && courseFormData.lessons.length > 0) {
        console.log(`Creando ${courseFormData.lessons.length} lecciones para el curso ${newCourse._id}`);
        
        for (let i = 0; i < courseFormData.lessons.length; i++) {
          const lesson = courseFormData.lessons[i];
          try {
            const quizQuestions = lesson.quizQuestions && lesson.quizQuestions.length > 0 
              ? lesson.quizQuestions.map(q => ({
                  question: q.question,
                  options: q.options,
                  correctAnswerIndex: Number(q.correctAnswerIndex)
                }))
              : [];
              
            const codeExercises = lesson.codeExercises && lesson.codeExercises.length > 0 
              ? lesson.codeExercises.map(ex => ({
                  id: ex.id,
                  title: ex.title,
                  description: ex.description,
                  language: ex.language,
                  initialCode: ex.initialCode,
                  solution: ex.solution,
                  hint: ex.hint,
                  expectedOutput: ex.expectedOutput,
                  testCases: ex.testCases
                }))
              : [];
            
            const response = await apiClient.post(`/lessons/by-course/${newCourse._id}`, {
              title: lesson.title,
              description: lesson.title,
              content: lesson.content,
              quizQuestions: quizQuestions,
              codeExercises: codeExercises,
              requiredToProgress: quizQuestions.length > 0,
              minQuizScore: 70,
              order: i
            }, {
              headers: {
                'x-wallet-address': user.walletAddress,
              }
            });
            
            console.log(`Lección ${i+1} creada con éxito:`, response._id);
          } catch (lessonError) {
            console.error(`Error al crear la lección ${i+1}:`, lessonError);
          }
        }
      }
      
      setShowCourseModal(false);
      setCreatingCourse(false);
      setStatusMessage(`¡Curso "${newCourse.title}" creado con éxito!`);
      
      setTimeout(() => {
        navigate(`/courses/${newCourse._id}`, { state: { showAddLessonMsg: true } });
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message || 'Error al crear el curso');
      setCreatingCourse(false);
    }
  };

  const handleAddLesson = () => {
    setCourseFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, { 
        title: 'Nueva Lección', 
        content: 'Contenido de la lección',
        quizQuestions: [],
        codeExercises: []
      }]
    }));
  };

  const handleDeleteLesson = (index: number) => {
    setCourseFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter((_, i) => i !== index)
    }));
  };

  const handleEditLesson = (index: number) => {
    setEditingLessonIndex(index);
  };

  const handleSaveLesson = () => {
    setEditingLessonIndex(null);
  };

  const handleLessonInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const { name, value } = e.target;
    if (!courseFormData.lessons[index]) return;
    
    setCourseFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => 
        i === index ? { ...lesson, [name]: value } : lesson
      )
    }));
  };

  const handleGenerateQuiz = async (lessonIndex: number) => {
    setGeneratingQuiz(true);
    try {
      const lesson = courseFormData.lessons[lessonIndex];
      if (!lesson.content) {
        setError('No hay contenido en la lección para generar preguntas');
        return;
      }

      const response = await api.post('/api/generate-quiz', {
        content: lesson.content,
        difficulty: difficultyLevel,
        numberOfQuestions: 3
      });

      if (response.data.questions) {
        setCourseFormData(prev => ({
          ...prev,
          lessons: prev.lessons.map((l, i) => 
            i === lessonIndex 
              ? { ...l, quizQuestions: response.data.questions }
              : l
          )
        }));
      }
    } catch (err: any) {
      console.error('Error generando quiz:', err);
      setError('Error al generar preguntas de evaluación');
    }
    setGeneratingQuiz(false);
  };

  return (
    <div className="transcriber-page">
      <div className="transcriber-container">
        <h1 className="text-center mb-4">Generador de Curso desde Texto</h1>
        <p className="text-center text-muted mb-4">
          Escribe o pega un texto de al menos 30 palabras y generaremos un resumen y una propuesta de lecciones.
        </p>

        <form onSubmit={handleSubmit} className="url-form-card shadow-sm mb-4">
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <FaFileAlt className="me-2 text-primary" />
              <label className="form-label mb-0">
                <strong>Contenido de texto ({countWords(textInput)} palabras)</strong>
              </label>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribe o pega aquí el texto del cual quieres generar un curso. Debe tener al menos 30 palabras..."
              className="form-control"
              rows={8}
              disabled={loading}
              style={{fontSize: '14px', lineHeight: '1.5'}}
            />
            <div className="form-text d-flex justify-content-between">
              <span className={countWords(textInput) < 30 ? 'text-danger' : 'text-success'}>
                Mínimo 30 palabras requeridas
              </span>
              {countWords(textInput) >= 30 && (
                <span className="text-success">✓ Texto válido</span>
              )}
            </div>
          </div>

          <div className="d-grid">
            <button 
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || countWords(textInput) < 30}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner-icon me-2" /> Procesando...
                </>
              ) : 'Generar Curso'}
            </button>
          </div>

          {/* Opciones avanzadas */}
          <div className="mt-4">
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="generateAdvancedContent"
                checked={generateAdvancedContent}
                onChange={(e) => setGenerateAdvancedContent(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label fw-bold" htmlFor="generateAdvancedContent">
                <FaCog className="me-2 text-primary" />
                Opciones avanzadas de generación
              </label>
            </div>

            {generateAdvancedContent && (
              <div className="border rounded p-4 mb-3" style={{backgroundColor: '#f8f9fa'}}>
                <h6 className="text-primary mb-3">
                  <FaCog className="me-2" />
                  Configuración de contenido
                </h6>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label>Tipo de contenido a generar</Form.Label>
                      <Form.Select 
                        value={contentType}
                        onChange={(e) => setContentType(e.target.value as 'all' | 'content' | 'quiz' | 'code')}
                        disabled={loading}
                      >
                        <option value="all">Todo (contenido completo, preguntas y ejercicios)</option>
                        <option value="content">Solo contenido textual educativo</option>
                        <option value="quiz">Solo preguntas de evaluación</option>
                        <option value="code">Solo ejercicios de código</option>
                      </Form.Select>
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label>Número de lecciones</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={numberOfLessons}
                        onChange={(e) => setNumberOfLessons(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        disabled={loading}
                      />
                      <Form.Text className="text-muted">
                        Entre 1 y 10 lecciones
                      </Form.Text>
                    </Form.Group>
                  </div>
                </div>

                {(contentType === 'all' || contentType === 'quiz') && (
                  <div className="mb-3">
                    <h6 className="text-success mb-2">
                      <FaQuestionCircle className="me-2" />
                      Configuración de preguntas de quiz
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Dificultad</Form.Label>
                          <Form.Select 
                            value={difficultyLevel}
                            onChange={(e) => setDifficultyLevel(e.target.value)}
                            disabled={loading}
                          >
                            <option value="easy">Básica</option>
                            <option value="medium">Intermedia</option>
                            <option value="hard">Avanzada</option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <div className="pt-4">
                          <Form.Check
                            type="checkbox"
                            id="includeExamples"
                            label="Incluir ejemplos en las preguntas"
                            checked={includeExamples}
                            onChange={(e) => setIncludeExamples(e.target.checked)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Alert variant="info" className="mt-3">
                  <Alert.Heading>¿Cómo funciona la generación avanzada?</Alert.Heading>
                  <p className="mb-0">
                    La plataforma utilizará IA para generar contenido educativo enriquecido basado en tu texto:
                    <strong> contenido textual</strong> con explicaciones detalladas,
                    <strong> preguntas de evaluación</strong> con dificultad {difficultyLevel}
                    {contentType === 'all' || contentType === 'code' ? (
                      <> y <strong>ejercicios de código en {selectedLanguage}</strong> con casos de prueba.</>
                    ) : '.'}
                  </p>
                </Alert>
              </div>
            )}
          </div>
        </form>

        {loading && (
          <div className="progress-container mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>{statusMessage}</div>
              {estimatedTimeRemaining && (
                <div className="estimated-time">Tiempo restante estimado: {estimatedTimeRemaining}</div>
              )}
            </div>
            <ProgressBar 
              now={processingProgress} 
              animated={loading}
              variant={loading ? "info" : error ? "danger" : "success"}
              label={`${Math.round(processingProgress)}%`}
              className="progress-custom" 
            />
          </div>
        )}

        <div className="status-feedback text-center mb-4">
          {!loading && error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <FaTimesCircle className="me-2" />
              <div><b>Error:</b> {error}</div>
            </div>
          )}
          {!loading && !error && result && result.status === 'success' && (
            <div className="alert alert-success d-flex align-items-center" role="alert">
              <FaCheckCircle className="me-2" />
              <div>{statusMessage}</div>
            </div>
          )}
          {!loading && !result && !error && <p className="text-muted">{statusMessage}</p>}
        </div>

        {/* Resultados */}
        {!loading && result && result.status !== 'error' && (
          <div className="results-area mt-4">
            <h2 className="mb-3 text-center">{result.title}</h2>
            
            <div className="summary-card card shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="card-title mb-0">Resumen Generado</h3>
                  <div>
                    {isEditingSummary ? (
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={handleSaveSummary}
                      >
                        Guardar
                      </Button>
                    ) : (
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={handleEditSummary}
                      >
                        <FaEdit className="me-1" /> Editar
                      </Button>
                    )}
                  </div>
                </div>
                
                {isEditingSummary ? (
                  <textarea
                    className="form-control"
                    rows={6}
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                  />
                ) : (
                  <div className="summary-content">
                    <div dangerouslySetInnerHTML={{ __html: editedSummary.replace(/\n/g, '<br>') }} />
                  </div>
                )}
              </div>
            </div>

            {/* Lecciones generadas */}
            {result.lessons && result.lessons.length > 0 && (
              <div className="lessons-preview card shadow-sm mb-4">
                <div className="card-body">
                  <h3 className="card-title mb-3">Lecciones Propuestas</h3>
                  <div className="lessons-list">
                    {Array.isArray(result.lessons) && result.lessons.map((lesson, index) => (
                      <div key={index} className="lesson-preview mb-3 p-3 border rounded">
                        <h5 className="mb-2">
                          {typeof lesson === 'string' ? lesson : lesson.title}
                          {typeof lesson !== 'string' && (
                            <div className="ms-2 d-inline">
                              {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                                <Badge bg="info" className="me-2" pill>
                                  {lesson.quizQuestions.length} preguntas
                                </Badge>
                              )}
                              {lesson.codeExercises && lesson.codeExercises.length > 0 && (
                                <Badge bg="success" pill>
                                  {lesson.codeExercises.length} ejercicios
                                </Badge>
                              )}
                            </div>
                          )}
                        </h5>
                        {typeof lesson !== 'string' && lesson.content && (
                          <p className="text-muted mb-0">{lesson.content.substring(0, 150)}...</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botón para crear curso */}
            <div className="text-center">
              <Button 
                variant="success" 
                size="lg" 
                onClick={handleCreateCourse}
                disabled={!user?.walletAddress}
              >
                <FaGraduationCap className="me-2" />
                {user?.walletAddress ? 'Crear Curso Completo' : 'Conecta tu Wallet para Crear Curso'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación de curso */}
      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Crear Curso Completo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Título del Curso</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={courseFormData.title}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={courseFormData.description}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nivel</Form.Label>
                  <Form.Select
                    name="level"
                    value={courseFormData.level}
                    onChange={handleInputChange}
                  >
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Precio (SOL)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={courseFormData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Etiquetas (separadas por comas)</Form.Label>
              <Form.Control
                type="text"
                value={tagsInput}
                onChange={handleTagsChange}
                placeholder="javascript, programación, curso"
              />
            </Form.Group>

            {/* Lecciones del curso */}
            <hr className="my-4" />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Lecciones del Curso</h4>
              <Button 
                variant="outline-success" 
                size="sm" 
                onClick={handleAddLesson}
              >
                <FaPlus className="me-1" /> Añadir Lección
              </Button>
            </div>

            {courseFormData.lessons.length > 0 ? (
              <div className="lessons-editor">
                {courseFormData.lessons.map((lesson, index) => (
                  <div key={index} className="lesson-editor card mb-3">
                    <div className="card-body">
                      {editingLessonIndex === index ? (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Título de la lección</Form.Label>
                            <Form.Control
                              type="text"
                              name="title"
                              value={lesson.title}
                              onChange={(e) => handleLessonInputChange(e, index)}
                            />
                          </Form.Group>
                          
                          <Tabs
                            activeKey={activeTabKey}
                            onSelect={(k) => setActiveTabKey(k || 'content')}
                            className="mb-3"
                          >
                            <Tab eventKey="content" title="Contenido">
                              <Form.Group className="mb-3">
                                <Form.Label>Contenido de la lección</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={6}
                                  name="content"
                                  value={lesson.content}
                                  onChange={(e) => handleLessonInputChange(e, index)}
                                />
                              </Form.Group>
                            </Tab>
                            
                            <Tab 
                              eventKey="quiz" 
                              title={
                                <div className="d-flex align-items-center">
                                  <FaQuestionCircle className="me-1" />
                                  Evaluación
                                  {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                                    <Badge bg="info" className="ms-2" pill>{lesson.quizQuestions.length}</Badge>
                                  )}
                                </div>
                              }
                            >
                              <div className="quiz-editor">
                                <div className="d-flex justify-content-between mb-3">
                                  <h5>Preguntas de evaluación</h5>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    onClick={() => handleGenerateQuiz(index)}
                                    disabled={generatingQuiz}
                                  >
                                    {generatingQuiz ? (
                                      <>
                                        <FaSpinner className="spinner-icon me-1" /> Generando...
                                      </>
                                    ) : (
                                      <>
                                        <FaQuestionCircle className="me-1" /> Generar con IA
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                {lesson.quizQuestions && lesson.quizQuestions.length > 0 ? (
                                  <div className="quiz-questions-list">
                                    {lesson.quizQuestions.map((question, qIndex) => (
                                      <div key={qIndex} className="quiz-question-item border p-3 mb-3 rounded">
                                        <Form.Group className="mb-3">
                                          <Form.Label>Pregunta #{qIndex + 1}</Form.Label>
                                          <div className="d-flex">
                                            <Form.Control
                                              type="text"
                                              value={question.question}
                                              readOnly
                                              placeholder="Pregunta generada automáticamente"
                                            />
                                          </div>
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-3">
                                          <Form.Label>Opciones</Form.Label>
                                          {question.options.map((option, oIndex) => (
                                            <div key={oIndex} className="d-flex align-items-center mb-2">
                                              <Form.Check
                                                type="radio"
                                                id={`option-${index}-${qIndex}-${oIndex}`}
                                                checked={question.correctAnswerIndex === oIndex}
                                                readOnly
                                                label=""
                                                className="me-2"
                                              />
                                              <Form.Control
                                                type="text"
                                                value={option}
                                                readOnly
                                                placeholder={`Opción ${oIndex + 1}`}
                                              />
                                            </div>
                                          ))}
                                          <small className="text-muted">✓ Respuesta correcta marcada automáticamente</small>
                                        </Form.Group>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted text-center py-3">
                                    No hay preguntas de evaluación. Haz clic en "Generar con IA" para crear preguntas automáticamente.
                                  </p>
                                )}
                              </div>
                            </Tab>
                          </Tabs>
                          
                          <div className="d-flex justify-content-end">
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={handleSaveLesson}
                            >
                              Guardar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h5 className="card-title d-flex justify-content-between">
                            {lesson.title}
                            <div>
                              {lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
                                <Badge bg="info" className="me-2" pill>
                                  {lesson.quizQuestions.length} preguntas
                                </Badge>
                              )}
                              {lesson.codeExercises && lesson.codeExercises.length > 0 && (
                                <Badge bg="success" pill>
                                  {lesson.codeExercises.length} ejercicios
                                </Badge>
                              )}
                            </div>
                          </h5>
                          <p className="card-text">
                            {lesson.content ? lesson.content.substring(0, 100) + '...' : 'Sin contenido'}
                          </p>
                          <div className="d-flex justify-content-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleEditLesson(index)}
                              className="me-2"
                            >
                              <FaEdit /> Editar
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteLesson(index)}
                            >
                              <FaTrash /> Eliminar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-3">
                No hay lecciones añadidas. Las lecciones se han generado automáticamente desde tu texto.
              </p>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePublishCourse}
            disabled={creatingCourse || !user?.walletAddress}
          >
            {creatingCourse ? (
              <>
                <FaSpinner className="spinner-icon me-2" /> Creando Curso...
              </>
            ) : !user?.walletAddress ? 'Conecta tu Wallet' : 'Publicar Curso'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TextTranscriber; 