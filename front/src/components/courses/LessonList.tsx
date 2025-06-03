import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Modal, Form, Alert, Badge, ListGroup, Row, Col, ProgressBar, Accordion, Tab, Tabs, Spinner } from 'react-bootstrap';
import { FaPlay, FaPencilAlt, FaTrash, FaPlus, FaClock, FaCheck, FaLock, FaSignInAlt, FaEye, FaCode, FaQuestionCircle, FaArrowLeft, FaArrowRight, FaCog } from 'react-icons/fa';
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
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentType, setContentType] = useState<'all' | 'quiz' | 'code' | 'content'>('all');
  const [contentText, setContentText] = useState('');
  const [generationSource, setGenerationSource] = useState<'youtube' | 'text'>('youtube');
  const [generateMultipleLessons, setGenerateMultipleLessons] = useState(false);
  const [numberOfLessons, setNumberOfLessons] = useState(1);
  
  // Nuevos estados para la funcionalidad de revisión
  const [generatedLessons, setGeneratedLessons] = useState<Partial<Lesson>[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [creatingLessons, setCreatingLessons] = useState(false);
  
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

  // Función para mostrar el modal de generación
  const handleYoutubeGeneration = () => {
    setYoutubeUrl('');
    setContentText('');
    setContentType('all');
    setGenerationSource('youtube');
    setShowYoutubeModal(true);
  };

  // Nueva función para procesar el video de YouTube o texto
  const handleProcessYoutubeVideo = async () => {
    try {
      if (!courseId || !user?.walletAddress) {
        setError('No hay información de curso o usuario');
        return;
      }
      
      if (numberOfLessons < 1 || numberOfLessons > 10) {
        setError('Debes especificar entre 1 y 10 lecciones para generar del video');
        return;
      }
      
      if (generationSource === 'text' && !contentText) {
        setError('Ingresa el texto para generar contenido');
        return;
      }
      
      setGeneratingContent(true);
      setError(null); // Limpiar errores previos
      setGenerationProgress(0); // Inicializar progreso
      
      try {
        // Preparar los datos según la fuente
        const requestData = {
          contentType,
          lessonTitle: formData.title || 'Nueva Lección',
          generateMultipleLessons: generationSource === 'youtube' ? true : generateMultipleLessons,
          numberOfLessons: generationSource === 'youtube' ? numberOfLessons : (generateMultipleLessons ? numberOfLessons : 1)
        };
        
        // Añadir la fuente correspondiente
        if (generationSource === 'youtube') {
          Object.assign(requestData, { youtubeUrl });
        } else {
          Object.assign(requestData, { text: contentText });
        }
        
        // Obtener wallet address del usuario
        const walletAddress = user?.walletAddress;
        
        if (!walletAddress) {
          throw new Error('No se ha encontrado la dirección de wallet. Inicia sesión nuevamente.');
        }
        
        // Mostrar progreso simulado mientras se genera el contenido
        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            // Limitar el progreso simulado al 90% para reservar el 100% para cuando
            // realmente recibamos la respuesta
            const newProgress = Math.min(prev + Math.random() * 5, 90);
            return newProgress;
          });
        }, 500);
        
        // Llamada a la API para procesar el contenido
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/generate-lesson-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-address': walletAddress, // Añadimos el encabezado de autenticación
          },
          body: JSON.stringify(requestData)
        });
        
        // Detener el intervalo de progreso simulado
        clearInterval(progressInterval);
        setGenerationProgress(100); // Marcar como completado
        
        // Obtener la respuesta completa
        const responseText = await response.text();
        
        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error(`Error del servidor: ${responseText}`);
        }
        
        // Intentar parsear como JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Error al parsear la respuesta JSON:", e);
          throw new Error(`Error en la respuesta del servidor: ${responseText}`);
        }
        
        if (requestData.generateMultipleLessons) {
          // Si se generaron múltiples lecciones, preparar para revisión
          if (data.lessons && Array.isArray(data.lessons)) {
            // Verificar que cada lección tenga contenido válido
            const validLessons = data.lessons.filter((lessonData: Partial<Lesson>) => 
              lessonData.content && lessonData.content.trim() !== ''
            );
            
            if (validLessons.length === 0) {
              throw new Error('No se pudo generar contenido válido para ninguna lección. Intenta con otro video o texto.');
            }
            
            if (validLessons.length < data.lessons.length) {
              alert(`Atención: Solo se pudieron generar ${validLessons.length} de ${data.lessons.length} lecciones con contenido válido.`);
            }
            
            // Procesar y preparar las lecciones para revisión
            const processedLessons = validLessons.map((lessonData: Partial<Lesson>, index: number) => {
              // Verificar y establecer valores por defecto
              if (!lessonData.title) {
                lessonData.title = `Lección ${index + 1}`;
              }
              
              if (!lessonData.description) {
                lessonData.description = `Lección generada automáticamente: "${lessonData.title}"`;
              }
              
              // Verificar que tenga contenido y añadir contenido por defecto si es necesario
              if (!lessonData.content || lessonData.content.trim() === '') {
                lessonData.content = `<h2>${lessonData.title}</h2><p>Esta lección está en proceso de generación. El contenido estará disponible pronto.</p>`;
              }
              
              // Asegurar que haya al menos algún contenido HTML en el contenido
              if (!lessonData.content.includes('<')) {
                lessonData.content = `<p>${lessonData.content}</p>`;
              }
              
              // Verificar que tenga preguntas o añadir un array vacío
              if (!lessonData.quizQuestions || !Array.isArray(lessonData.quizQuestions)) {
                lessonData.quizQuestions = [];
                
                // Si debía tener preguntas según el contentType, añadir una pregunta por defecto
                if (contentType === 'all' || contentType === 'quiz') {
                  lessonData.quizQuestions = [{
                    question: `¿De qué trata la lección "${lessonData.title}"?`,
                    options: [
                      `Sobre ${lessonData.title}`,
                      'Sobre otro tema',
                      'No se puede determinar',
                      'Ninguna de las anteriores'
                    ],
                    correctAnswerIndex: 0
                  }];
                }
              }
              
              // Verificar que tenga ejercicios o añadir un array vacío
              if (!lessonData.codeExercises || !Array.isArray(lessonData.codeExercises)) {
                lessonData.codeExercises = [];
                
                // Si debía tener ejercicios según el contentType, añadir uno por defecto
                if (contentType === 'all' || contentType === 'code') {
                  lessonData.codeExercises = [{
                    id: `exercise-default-${index}`,
                    title: `Ejercicio práctico para ${lessonData.title}`,
                    description: 'Completa el código siguiente:',
                    language: 'javascript',
                    initialCode: '// Completa el código\nconsole.log("Hola mundo");',
                    solution: 'console.log("Hola mundo");',
                    hint: 'Solo necesitas escribir el código para mostrar un mensaje',
                    expectedOutput: 'Hola mundo'
                  }];
                }
              }
              
              // Asignar orden secuencial
              lessonData.order = index + 1;
              
              return lessonData;
            });
            
            // Guardar las lecciones procesadas en el estado
            setGeneratedLessons(processedLessons);
            setCurrentLessonIndex(0);
            
            // Cerrar el modal de generación y abrir el modal de revisión
            setShowYoutubeModal(false);
            setShowReviewModal(true);
            
          } else {
            throw new Error('No se recibieron lecciones generadas correctamente');
          }
        } else {
          // Si estamos generando solo una lección, verificar que tenga contenido
          if (!data.content || data.content.trim() === '') {
            throw new Error('No se pudo generar contenido para la lección. Intenta con otro video o texto.');
          }
          
          // Si estamos creando una nueva lección (no editando una existente)
          if (!editingLesson) {
            // Determinar el orden para la nueva lección
            let newOrder = formData.order || 0;
            
            if (newOrder === 0) {
              // Obtener el orden máximo actual y añadir 1
              newOrder = lessons.length + 1;
            }
            
            // Actualizar el formulario con el nuevo orden
            setFormData(prev => ({
              ...prev,
              order: newOrder,
              content: data.content || prev.content,
              quizQuestions: contentType === 'all' || contentType === 'quiz' 
                ? data.quizQuestions || prev.quizQuestions 
                : prev.quizQuestions,
              codeExercises: contentType === 'all' || contentType === 'code'
                ? data.codeExercises || prev.codeExercises
                : prev.codeExercises
            }));
          } else {
            // Si estamos editando, mantener el orden existente
            setFormData(prev => ({
              ...prev,
              content: data.content || prev.content,
              quizQuestions: contentType === 'all' || contentType === 'quiz' 
                ? data.quizQuestions || prev.quizQuestions 
                : prev.quizQuestions,
              codeExercises: contentType === 'all' || contentType === 'code'
                ? data.codeExercises || prev.codeExercises
                : prev.codeExercises
            }));
          }
          
          setShowYoutubeModal(false);
        }
        
      } catch (error) {
        console.error('Error al procesar el contenido:', error);
        setError((error as Error).message || 'Error al procesar el contenido');
      } finally {
        setGeneratingContent(false);
      }
    } catch (error) {
      console.error('Error en parámetros de entrada:', error);
      setError((error as Error).message || 'Error en los parámetros de entrada');
      setGeneratingContent(false);
    }
  };

  // Función para guardar todas las lecciones generadas después de revisarlas
  const handleSaveGeneratedLessons = async () => {
    setCreatingLessons(true);
    
    try {
      // Verificar que todas las lecciones tienen contenido completo
      const incompleteLesson = generatedLessons.findIndex(lesson => 
        !lesson.title || 
        !lesson.content || 
        lesson.content.trim() === '' ||
        (lesson.content && !lesson.content.includes('<')) // Asegurarse que es HTML
      );
      
      if (incompleteLesson >= 0) {
        setCurrentLessonIndex(incompleteLesson);
        throw new Error(`La lección ${incompleteLesson + 1} ("${generatedLessons[incompleteLesson].title}") no tiene contenido válido. Por favor, edita la lección antes de guardar.`);
      }
      
      // Asegurarse de que hay al menos una lección generada
      if (generatedLessons.length === 0) {
        throw new Error('No hay lecciones para guardar. Genera contenido primero.');
      }
      
      // Verificar que el usuario está autenticado
      if (!user || !user.walletAddress) {
        throw new Error('No hay una wallet conectada. Por favor, inicia sesión primero.');
      }
      
      // Almacenamos todas las lecciones creadas para verificar después
      const createdLessonIds: string[] = [];
      
      for (let i = 0; i < generatedLessons.length; i++) {
        const lessonData = generatedLessons[i];
        
        // Verificar que esta lección tenga contenido antes de guardarla
        if (!lessonData.content || lessonData.content.trim() === '') {
          continue; // Saltar lecciones sin contenido
        }
        
        // Asegurarse de que la lección tiene contenido HTML adecuado
        let processedContent = lessonData.content || '';
        if (!processedContent.includes('<')) {
          processedContent = `<p>${processedContent}</p>`;
        }
        
        // Asegurarse de que hay preguntas si el tipo es 'all' o 'quiz'
        let processedQuizQuestions = [...(lessonData.quizQuestions || [])];
        if (processedQuizQuestions.length === 0 && (contentType === 'all' || contentType === 'quiz')) {
          processedQuizQuestions = [{
            question: `¿Cuál es el tema principal de la lección "${lessonData.title}"?`,
            options: [
              `${lessonData.title}`,
              'No se especifica',
              'Otro tema no relacionado',
              'Ninguna de las anteriores'
            ],
            correctAnswerIndex: 0
          }];
        }
        
        // Asegurarse de que hay ejercicios si el tipo es 'all' o 'code'
        let processedCodeExercises = [...(lessonData.codeExercises || [])];
        if (processedCodeExercises.length === 0 && (contentType === 'all' || contentType === 'code')) {
          processedCodeExercises = [{
            id: `exercise-default-${i}`,
            title: `Ejercicio práctico para ${lessonData.title}`,
            description: 'Completa el código siguiente:',
            language: 'javascript',
            initialCode: '// Completa el código\nconsole.log("Hola mundo");',
            solution: 'console.log("Hola mundo");',
            hint: 'Solo necesitas escribir el código para mostrar un mensaje',
            expectedOutput: 'Hola mundo'
          }];
        }
        
        // Nos aseguramos de que no hay ningún campo isCompleted en los datos enviados
        const cleanLessonData = { 
          ...lessonData,
          content: processedContent,
          quizQuestions: processedQuizQuestions,
          codeExercises: processedCodeExercises
        };
        
        // @ts-ignore - Eliminar explícitamente isCompleted
        delete cleanLessonData.isCompleted;
        
        // Crear la lección con datos limpios y completos
        const createdLesson = await lessonService.createLesson(courseId!, cleanLessonData as any, user.walletAddress);
        console.log(`Lección creada con ID: ${createdLesson._id}`);
        createdLessonIds.push(createdLesson._id);
      }
      
      // Recargar las lecciones después de crearlas
      await refreshLessons();
      
      // Verificar el estado de las lecciones recién creadas
      console.log('Verificando el estado de las lecciones creadas...');
      
      if (user && user.walletAddress) {
        const refreshedLessons = await lessonService.getCourseLessons(courseId!, user.walletAddress);
        
        createdLessonIds.forEach(id => {
          const lesson = refreshedLessons.find((l: any) => l._id === id);
          if (lesson) {
            console.log(`Estado de lección "${lesson.title}": completada=${lesson.isCompleted}`);
            if (lesson.isCompleted) {
              console.warn(`ALERTA: La lección ${lesson.title} (${id}) fue marcada como completada automáticamente`);
            }
          }
        });
      }
      
      // Cerrar el modal de revisión
      setShowReviewModal(false);
      setGeneratedLessons([]);
      
      // Mostrar mensaje de éxito
      setError(null);
      
    } catch (error) {
      console.error('Error al crear las lecciones:', error);
      setError((error as Error).message || 'Error al crear las lecciones');
    } finally {
      setCreatingLessons(false);
    }
  };
  
  // Función para actualizar una lección durante la revisión
  const handleUpdateGeneratedLesson = (updatedData: Partial<Lesson>) => {
    const updatedLessons = [...generatedLessons];
    updatedLessons[currentLessonIndex] = {
      ...updatedLessons[currentLessonIndex],
      ...updatedData
    };
    setGeneratedLessons(updatedLessons);
  };
  
  // Función para navegar entre las lecciones durante la revisión
  const handleNavigateReview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (direction === 'next' && currentLessonIndex < generatedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };
  
  // Función para cancelar la revisión y descartar las lecciones
  const handleCancelReview = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Todas las lecciones generadas se perderán.')) {
      setShowReviewModal(false);
      setGeneratedLessons([]);
    }
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

                <div className="d-flex justify-content-end">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={handleYoutubeGeneration}
                    className="d-flex align-items-center"
                  >
                    <FaPlay className="me-1" /> Generar contenido con IA
                  </Button>
                </div>
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
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => {
                        setContentType('quiz');
                        handleYoutubeGeneration();
                      }}
                      className="d-flex align-items-center"
                    >
                      <FaPlus className="me-1" /> Generar con IA
                    </Button>
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
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => {
                        setContentType('code');
                        handleYoutubeGeneration();
                      }}
                      className="d-flex align-items-center"
                    >
                      <FaPlus className="me-1" /> Generar con IA
                    </Button>
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

      {/* Modal de generación de contenido desde YouTube o texto */}
      <Modal
        show={showYoutubeModal}
        onHide={() => setShowYoutubeModal(false)}
        backdrop="static"
        keyboard={false}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Generar contenido de lecciones con IA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Fuente del contenido</Form.Label>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  name="generationSource"
                  id="sourceYoutube"
                  label="Video de YouTube"
                  checked={generationSource === 'youtube'}
                  onChange={() => {
                    setGenerationSource('youtube');
                    // Activar automáticamente generación múltiple al seleccionar YouTube
                    setGenerateMultipleLessons(true);
                    // Establecer valor predeterminado de 3 lecciones
                    setNumberOfLessons(3);
                  }}
                  inline
                />
                <Form.Check
                  type="radio"
                  name="generationSource"
                  id="sourceText"
                  label="Texto directo"
                  checked={generationSource === 'text'}
                  onChange={() => setGenerationSource('text')}
                  inline
                />
              </div>
            </Form.Group>

            {generationSource === 'youtube' ? (
              <>
              <Form.Group className="mb-3">
                <Form.Label>URL de YouTube</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={generatingContent}
                />
                <Form.Text className="text-muted">
                  Introduce la URL de un video de YouTube para generar contenido automáticamente.
                </Form.Text>
              </Form.Group>
                
                {/* Campo de número de lecciones siempre visible para YouTube */}
                <Form.Group className="mb-3">
                  <Form.Label>Número de lecciones a generar <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfLessons}
                    onChange={(e) => setNumberOfLessons(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={generatingContent}
                    required
                  />
                  <Form.Text className="text-muted">
                    Seleccione cuántas lecciones desea generar del video (entre 1 y 10).
                  </Form.Text>
                </Form.Group>
                
                <Alert variant="info" className="mb-3">
                  <Alert.Heading>Nuevo proceso de creación</Alert.Heading>
                  <p>
                    Primero se generará el contenido a partir del video. Solo las lecciones con contenido válido 
                    podrán ser creadas en el sistema.
                  </p>
                  <p className="mb-0">
                    Después de generar el contenido, podrás revisar y editar cada lección antes de guardarla.
                  </p>
                </Alert>
              </>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Texto para generar contenido</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Introduce aquí el texto base para generar la lección..."
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  disabled={generatingContent}
                />
                <Form.Text className="text-muted">
                  Escribe el texto del que se generará automáticamente el contenido de la lección.
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Tipo de contenido a generar</Form.Label>
              <Form.Select 
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'all' | 'quiz' | 'code' | 'content')}
                disabled={generatingContent}
              >
                <option value="all">Todo (contenido completo, preguntas y ejercicios)</option>
                <option value="content">Solo contenido textual educativo</option>
                <option value="quiz">Solo preguntas de evaluación</option>
                <option value="code">Solo ejercicios de código</option>
                <option value="content">Solo contenido educativo</option>
              </Form.Select>
              <Form.Text className="text-muted">
                <strong>Recomendado:</strong> Selecciona "Todo" para generar lecciones completas con contenido educativo, preguntas de quiz y ejercicios prácticos.
              </Form.Text>
            </Form.Group>

            {/* Nuevas opciones específicas para tipo de contenido */}
            <div className="border rounded p-3 mb-3" style={{backgroundColor: '#f8f9fa'}}>
              <h6 className="text-primary mb-3">
                <FaCog className="me-2" />
                Opciones avanzadas de generación
              </h6>
              
              {(contentType === 'all' || contentType === 'quiz') && (
                <Form.Group className="mb-3">
                  <Form.Label>Configuración de preguntas de quiz</Form.Label>
                  <Form.Check
                    type="checkbox"
                    id="includeMultipleChoice"
                    label="Incluir preguntas de opción múltiple"
                    checked={true}
                    disabled
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeTrueFalse"
                    label="Incluir preguntas verdadero/falso"
                    checked={false}
                    disabled
                    className="mb-2"
                  />
                  <Form.Select 
                    value="medium"
                    disabled={generatingContent}
                    size="sm"
                    className="mt-2"
                  >
                    <option value="easy">Dificultad: Básica</option>
                    <option value="medium">Dificultad: Intermedia</option>
                    <option value="hard">Dificultad: Avanzada</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Se generarán 3-5 preguntas por lección con explicaciones detalladas.
                  </Form.Text>
                </Form.Group>
              )}

              {(contentType === 'all' || contentType === 'code') && (
                <Form.Group className="mb-3">
                  <Form.Label>Configuración de ejercicios de código</Form.Label>
                  <Form.Select 
                    value="javascript"
                    disabled={generatingContent}
                    size="sm"
                    className="mb-2"
                  >
                    <option value="javascript">Lenguaje: JavaScript</option>
                    <option value="python">Lenguaje: Python</option>
                    <option value="solana">Lenguaje: Solana/Rust</option>
                    <option value="html">Lenguaje: HTML/CSS</option>
                  </Form.Select>
                  <Form.Check
                    type="checkbox"
                    id="includeTestCases"
                    label="Incluir casos de prueba automáticos"
                    checked={true}
                    disabled
                    className="mb-2"
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeHints"
                    label="Incluir pistas y soluciones"
                    checked={true}
                    disabled
                    className="mb-2"
                  />
                  <Form.Text className="text-muted">
                    Se generarán ejercicios prácticos con código inicial, casos de prueba y soluciones.
                  </Form.Text>
                </Form.Group>
              )}

              {(contentType === 'all' || contentType === 'content') && (
                <Form.Group className="mb-3">
                  <Form.Label>Configuración del contenido educativo</Form.Label>
                  <Form.Check
                    type="checkbox"
                    id="includeExamples"
                    label="Incluir ejemplos prácticos y casos de uso"
                    checked={true}
                    disabled
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeImages"
                    label="Sugerir diagramas e imágenes explicativas"
                    checked={true}
                    disabled
                  />
                  <Form.Check
                    type="checkbox"
                    id="includeLinks"
                    label="Incluir recursos adicionales y enlaces"
                    checked={true}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    El contenido incluirá explicaciones detalladas, ejemplos prácticos y recursos adicionales.
                  </Form.Text>
                </Form.Group>
              )}
            </div>

            {generationSource !== 'youtube' && (
              <>
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                id="generateMultipleLessons"
                label="Generar múltiples lecciones"
                checked={generateMultipleLessons}
                onChange={(e) => setGenerateMultipleLessons(e.target.checked)}
                disabled={generatingContent}
              />
              <Form.Text className="text-muted">
                Si se selecciona, creará automáticamente varias lecciones en lugar de una sola.
              </Form.Text>
            </Form.Group>

            {generateMultipleLessons && (
              <Form.Group className="mb-3">
                <Form.Label>Número de lecciones a generar</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="10"
                  value={numberOfLessons}
                  onChange={(e) => setNumberOfLessons(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={generatingContent}
                />
                <Form.Text className="text-muted">
                  Seleccione cuántas lecciones desea generar (máximo 10).
                </Form.Text>
              </Form.Group>
                )}
              </>
            )}
          </Form>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          {generatingContent && (
            <div className="mt-4">
              <h5 className="text-center mb-3">Generando contenido...</h5>
              <ProgressBar 
                animated 
                now={generationProgress} 
                label={`${Math.round(generationProgress)}%`}
                variant="primary"
                className="mb-3"
              />
              <p className="text-center text-muted">
                {generationProgress < 20 && "Analizando contenido base..."}
                {generationProgress >= 20 && generationProgress < 40 && "Extrayendo conceptos clave..."}
                {generationProgress >= 40 && generationProgress < 60 && "Estructurando lecciones..."}
                {generationProgress >= 60 && generationProgress < 80 && "Generando contenido educativo..."}
                {generationProgress >= 80 && generationProgress < 100 && "Creando ejercicios y evaluaciones..."}
                {generationProgress >= 100 && "¡Contenido generado! Preparando para revisión..."}
              </p>
            </div>
          )}

          <Alert variant="info" className="mt-3">
            <Alert.Heading>¿Cómo funciona la generación automática?</Alert.Heading>
            <p>
              La plataforma utiliza inteligencia artificial para generar automáticamente:
            </p>
            <ul>
              <li><strong>Contenido textual</strong> - Explicaciones, conceptos y ejemplos para la lección</li>
              <li><strong>Preguntas de evaluación</strong> - Preguntas tipo quiz con múltiples opciones</li>
              <li><strong>Ejercicios de código</strong> - Retos prácticos con guías de solución</li>
            </ul>
            <p>
              Proceso:
            </p>
            <ol>
              <li><strong>Generación del contenido</strong> - La IA analiza el video o texto y genera contenido educativo</li>
              <li><strong>Revisión</strong> - Puedes revisar y editar cada lección antes de crearla</li>
              <li><strong>Creación</strong> - Solo se crearán lecciones con contenido válido</li>
            </ol>
            <hr />
            <p className="mb-0">
              La generación puede tomar hasta {generateMultipleLessons ? 'varios minutos' : 'un minuto'} dependiendo de la longitud del {generationSource === 'youtube' ? 'video' : 'texto'} {generateMultipleLessons ? 'y del número de lecciones' : ''}.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowYoutubeModal(false)}
            disabled={generatingContent}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleProcessYoutubeVideo}
            disabled={generatingContent || (generationSource === 'youtube' && !youtubeUrl) || (generationSource === 'text' && !contentText)}
          >
            {generatingContent ? (
              <>
                <Spinner as="span" animation="border"   size="sm" role="status" aria-hidden="true" className="me-2" />
                {generateMultipleLessons ? `Generando ${numberOfLessons} lecciones...` : 'Generando...'}
              </>
            ) : (
              generationSource === 'youtube' 
                ? `Generar contenido para ${numberOfLessons} lecciones` 
                : (generateMultipleLessons ? `Generar contenido para ${numberOfLessons} lecciones` : 'Generar contenido')
            )}
          </Button>
        </Modal.Footer>
        </Modal>

      {/* Modal de revisión de lecciones generadas */}
      <Modal
        show={showReviewModal}
        onHide={handleCancelReview}
        backdrop="static"
        keyboard={false}
        size="xl"
        dialogClassName="lesson-review-modal"
        centered
      >
          <Modal.Header>
          <Modal.Title>Revisar contenido generado antes de crear lecciones</Modal.Title>
          </Modal.Header>
        <Modal.Body>
          {generatedLessons.length > 0 && (
            <>
              <Alert variant="warning" className="mb-3">
                <Alert.Heading>Importante</Alert.Heading>
                <p>
                  El contenido se ha generado correctamente. Ahora puedes revisarlo y editarlo antes de crear las lecciones.
                </p>
                <p className="mb-0">
                  <strong>Solo se crearán las lecciones que tengan contenido válido.</strong> Una vez creadas, aparecerán en el listado de lecciones del curso.
                </p>
              </Alert>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  Lección {currentLessonIndex + 1} de {generatedLessons.length}
                </h5>
                <div className="d-flex">
            <Button
                    variant="outline-secondary" 
                  size="sm"
                    onClick={() => handleNavigateReview('prev')}
                    disabled={currentLessonIndex === 0}
                  className="me-2"
                  >
                    <FaArrowLeft /> Anterior
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleNavigateReview('next')}
                    disabled={currentLessonIndex === generatedLessons.length - 1}
                  >
                    Siguiente <FaArrowRight />
                  </Button>
                </div>
              </div>

              <Tabs className="mb-4" defaultActiveKey="content">
                <Tab eventKey="content" title="Contenido principal">
                  <Form.Group className="mb-3">
                    <Form.Label>Título</Form.Label>
                    <Form.Control 
                      type="text"
                      value={generatedLessons[currentLessonIndex].title || ''}
                      onChange={(e) => handleUpdateGeneratedLesson({ title: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control 
                      as="textarea"
                      rows={2}
                      value={generatedLessons[currentLessonIndex].description || ''}
                      onChange={(e) => handleUpdateGeneratedLesson({ description: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Orden</Form.Label>
                    <Form.Control 
                      type="number"
                      min="0"
                      value={generatedLessons[currentLessonIndex].order || 0}
                      onChange={(e) => handleUpdateGeneratedLesson({ order: parseInt(e.target.value) })}
                    />
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Contenido de la lección</Form.Label>
                    <Form.Control 
                      as="textarea"
                      rows={10}
                      value={generatedLessons[currentLessonIndex].content || ''}
                      onChange={(e) => handleUpdateGeneratedLesson({ content: e.target.value })}
                    />
                    <Form.Text className="text-muted">
                      Puedes usar formato HTML para enriquecer el contenido.
                    </Form.Text>
                  </Form.Group>
                </Tab>

                <Tab eventKey="quiz" title={`Preguntas (${generatedLessons[currentLessonIndex].quizQuestions?.length || 0})`}>
                  {(generatedLessons[currentLessonIndex].quizQuestions?.length || 0) > 0 ? (
                    <Accordion className="mb-3">
                      {generatedLessons[currentLessonIndex].quizQuestions?.map((question, qIndex) => (
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
                                  const updatedQuestions = [...(generatedLessons[currentLessonIndex].quizQuestions || [])];
                                  updatedQuestions[qIndex].question = e.target.value;
                                  handleUpdateGeneratedLesson({ quizQuestions: updatedQuestions });
                                }}
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
                                      const updatedQuestions = [...(generatedLessons[currentLessonIndex].quizQuestions || [])];
                                      updatedQuestions[qIndex].correctAnswerIndex = oIndex;
                                      handleUpdateGeneratedLesson({ quizQuestions: updatedQuestions });
                                    }}
                                    className="me-2"
                                  />
                                  <Form.Control
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const updatedQuestions = [...(generatedLessons[currentLessonIndex].quizQuestions || [])];
                                      updatedQuestions[qIndex].options[oIndex] = e.target.value;
                                      handleUpdateGeneratedLesson({ quizQuestions: updatedQuestions });
                                    }}
                                    placeholder={`Opción ${oIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                              <Button 
                                variant="outline-danger" 
                                size="sm"
              onClick={() => {
                                  const updatedQuestions = [...(generatedLessons[currentLessonIndex].quizQuestions || [])];
                                  updatedQuestions.splice(qIndex, 1);
                                  handleUpdateGeneratedLesson({ quizQuestions: updatedQuestions });
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
                      No hay preguntas para esta lección. Las preguntas se generarán automáticamente.
                    </p>
                  )}
                </Tab>

                <Tab eventKey="code" title={`Ejercicios (${generatedLessons[currentLessonIndex].codeExercises?.length || 0})`}>
                  {(generatedLessons[currentLessonIndex].codeExercises?.length || 0) > 0 ? (
                    <Accordion className="mb-3">
                      {generatedLessons[currentLessonIndex].codeExercises?.map((exercise, index) => (
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
                                onChange={(e) => {
                                  const updatedExercises = [...(generatedLessons[currentLessonIndex].codeExercises || [])];
                                  updatedExercises[index] = {
                                    ...updatedExercises[index],
                                    title: e.target.value
                                  };
                                  handleUpdateGeneratedLesson({ codeExercises: updatedExercises });
                                }}
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Descripción</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                value={exercise.description}
                                onChange={(e) => {
                                  const updatedExercises = [...(generatedLessons[currentLessonIndex].codeExercises || [])];
                                  updatedExercises[index] = {
                                    ...updatedExercises[index],
                                    description: e.target.value
                                  };
                                  handleUpdateGeneratedLesson({ codeExercises: updatedExercises });
                                }}
                              />
                            </Form.Group>

                            <div className="d-flex justify-content-end">
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => {
                                  const updatedExercises = [...(generatedLessons[currentLessonIndex].codeExercises || [])];
                                  updatedExercises.splice(index, 1);
                                  handleUpdateGeneratedLesson({ codeExercises: updatedExercises });
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
                      No hay ejercicios para esta lección. Los ejercicios se generarán automáticamente.
                    </p>
                  )}
                </Tab>
              </Tabs>
            </>
          )}
          </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCancelReview}
          >
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleSaveGeneratedLessons}
            disabled={creatingLessons}
          >
            {creatingLessons ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Guardando lecciones...
              </>
            ) : (
              `Guardar ${generatedLessons.length} lecciones`
            )}
          </Button>
        </Modal.Footer>
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