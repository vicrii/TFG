import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, ProgressBar, ListGroup, Modal } from 'react-bootstrap';
import { Card, Button, Alert, ProgressBar, ListGroup } from 'react-bootstrap';
import { FaPlus, FaLock, FaSignInAlt, FaEye } from 'react-icons/fa';
import { Lesson } from '../../../types/lesson';
import { lessonService } from '../../../services/lesson/lessonService';
import { useAuth } from '../../../hooks/useAuth';
import { courseService } from '../../../services/course/courseService';
import LessonCard from './LessonCard';
import LessonListModal from './LessonListModal';
import LessonListReviewModal from './LessonListReviewModal';

export const LessonList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLessons, setGeneratedLessons] = useState<Partial<Lesson>[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [creatingLessons, setCreatingLessons] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadLessons();
      if (user?.walletAddress) {
        checkInstructorStatus();
      }
    }
  }, [courseId, user]);

  const checkInstructorStatus = async () => {
    if (!courseId || !user?.walletAddress) return;
    try {
      const course = await courseService.getCourseById(courseId, user.walletAddress);
      if (course) {
        setIsInstructor(course.instructor === user.walletAddress || user.role === 'moderator');
      }
    } catch (error) {
      console.error('Error checking instructor status:', error);
      setError('Error al verificar permisos de instructor');
    }
  };

  const loadLessons = async () => {
    if (!courseId || !user?.walletAddress) {
      setError('No hay información de curso o usuario');
      return;
    }
    try {
      const data = await lessonService.getCourseLessons(courseId, user.walletAddress);
      setLessons(data);
      setError(null);
    } catch (error: any) {
      console.error('Error detallado al cargar lecciones:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar las lecciones. Comprueba tu conexión e intenta de nuevo.';
      setError(errorMessage);
    }
  };

  const handleShowModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
    } else {
      setEditingLesson(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setError(null);
  };

  const handleSubmit = async (formData: Partial<Lesson>) => {
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
      loadLessons();
      setError(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setError('Error al guardar la lección');
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      try {
        if (!user?.walletAddress) {
          setError('No hay una wallet conectada');
          return;
        }
        await lessonService.deleteLesson(lessonId, user.walletAddress);
        loadLessons();
        setError(null);
      } catch (error) {
        console.error('Error deleting lesson:', error);
        setError('Error al eliminar la lección');
      }
    }
  };

  const handleNavigate = (lessonIndex: number) => {
    navigate(`/course/${courseId}/lesson/${lessonIndex + 1}`);
  };

  const handleSaveGeneratedLessons = async () => {
    setCreatingLessons(true);
    try {
      if (!user?.walletAddress) {
        throw new Error('No hay una wallet conectada. Por favor, inicia sesión primero.');
      }
      const createdLessonIds: string[] = [];
      for (let i = 0; i < generatedLessons.length; i++) {
        const lessonData = generatedLessons[i];
        if (!lessonData.content || lessonData.content.trim() === '') {
          continue;
        }
        let processedContent = lessonData.content || '';
        if (!processedContent.includes('<')) {
          processedContent = `<p>${processedContent}</p>`;
        }
        const cleanLessonData = {
          ...lessonData,
          content: processedContent,
          quizQuestions: lessonData.quizQuestions || [],
          codeExercises: lessonData.codeExercises?.map(exercise => ({
            ...exercise,
            title: exercise.title || '',
            description: exercise.description || '',
            language: exercise.language || 'python',
            initialCode: exercise.initialCode || '',
            solution: exercise.solution || '',
            hint: exercise.hint || '',
            expectedOutput: exercise.expectedOutput || '',
            testCases: exercise.testCases?.map(testCase => ({
              input: testCase.input || '',
              expectedOutput: testCase.expectedOutput || '',
              description: testCase.description || `Caso de prueba ${i + 1}`
            })) || []
          })) || []
        };
        // @ts-ignore
        delete cleanLessonData.isCompleted;
        const createdLesson = await lessonService.createLesson(courseId!, cleanLessonData as any, user.walletAddress);
        createdLessonIds.push(createdLesson._id);
      }
      await loadLessons();
      setShowReviewModal(false);
      setGeneratedLessons([]);
      setError(null);
    } catch (error) {
      console.error('Error al crear las lecciones:', error);
      setError((error as Error).message || 'Error al crear las lecciones');
    } finally {
      setCreatingLessons(false);
    }
  };

  const handleUpdateGeneratedLesson = (updatedData: Partial<Lesson>) => {
    const updatedLessons = [...generatedLessons];
    updatedLessons[currentLessonIndex] = {
      ...updatedLessons[currentLessonIndex],
      ...updatedData
    };
    setGeneratedLessons(updatedLessons);
  };

  const handleNavigateReview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (direction === 'next' && currentLessonIndex < generatedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handleCancelReview = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar? Todas las lecciones generadas se perderán.')) {
      setShowReviewModal(false);
      setGeneratedLessons([]);
    }
  };

  const renderAuthenticatedContent = () => {
    return (
      <>
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
          </div>
        )}

        <ListGroup variant="flush">
          {lessons.map((lesson, index) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              index={index}
              isInstructor={isInstructor}
              onEdit={handleShowModal}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
            />
          ))}
        </ListGroup>

        {lessons.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No hay lecciones disponibles para este curso.</p>
          </div>
        )}
      </>
    );
  };

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

        {renderAuthenticatedContent()}
      </Card.Body>

      <LessonListModal
        show={showModal}
        onHide={handleCloseModal}
        onSubmit={handleSubmit}
        editingLesson={editingLesson}
      />

      <LessonListReviewModal
        show={showReviewModal}
        onHide={() => setShowReviewModal(false)}
        onSave={handleSaveGeneratedLessons}
        onCancel={handleCancelReview}
        generatedLessons={generatedLessons}
        currentLessonIndex={currentLessonIndex}
        onNavigate={handleNavigateReview}
        onUpdateLesson={handleUpdateGeneratedLesson}
        creatingLessons={creatingLessons}
      />
    </Card>
  );
};

export default LessonList; 