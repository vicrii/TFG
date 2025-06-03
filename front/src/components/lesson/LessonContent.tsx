import React, { useState, useCallback } from 'react';
import { Button, Modal, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheck, FaArrowRight, FaTrophy } from 'react-icons/fa';
import { Lesson } from '../../services/lesson/lesson.api';
import { lessonService } from '../../services/lesson/lessonService';
import { useAuth } from '../../hooks/useAuth';

interface LessonContentProps {
  lesson: Lesson;
  onCompleted?: () => void;
}

const LessonContent: React.FC<LessonContentProps> = ({ lesson, onCompleted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId, lessonNumber } = useParams<{ courseId: string, lessonNumber: string }>();
  
  const [completing, setCompleting] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{
    currentLessonIndex: number;
    totalLessons: number;
    isCourseCompleted: boolean;
  }>({
    currentLessonIndex: 0,
    totalLessons: 0,
    isCourseCompleted: false
  });

  // Determinar si la lección tiene solo contenido (sin quiz ni ejercicios)
  const isContentOnlyLesson = (!lesson.quizQuestions || lesson.quizQuestions.length === 0) && 
                               (!lesson.codeExercises || lesson.codeExercises.length === 0);

  const handleMarkAsCompleted = useCallback(async () => {
    if (!user?.walletAddress || !lesson._id) {
      setError('Debes estar autenticado para completar la lección.');
      return;
    }

    try {
      setCompleting(true);
      setError(null);

      console.log('Marking content-only lesson as completed...', { lessonId: lesson._id, walletAddress: user.walletAddress });
      
      const result = await lessonService.markLessonAsCompleted(lesson._id, user.walletAddress);
      console.log('Content lesson marked as completed result:', result);

      // Actualizar el callback padre si existe
      if (onCompleted) {
        await onCompleted();
        console.log('onCompleted callback finished for content lesson');
      }

      // Obtener información actualizada del curso para determinar progreso
      try {
        const lessons = await lessonService.getCourseLessons(courseId!, user.walletAddress);
        console.log('Lessons after content completion:', lessons.map(l => ({ title: l.title, isCompleted: l.isCompleted })));
        
        const completedLessons = lessons.filter(l => l.isCompleted).length;
        const currentLessonIdx = lessons.findIndex(l => l._id === lesson._id);
        
        setLessonProgress({
          currentLessonIndex: currentLessonIdx,
          totalLessons: lessons.length,
          isCourseCompleted: completedLessons === lessons.length
        });
        
        // Mostrar modal de completado
        setShowCompletionModal(true);
      } catch (error) {
        console.error('Error getting course progress after content completion:', error);
        // Aún mostrar el modal básico de completado
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error('Error marking content lesson as completed:', error);
      setError('Error al marcar la lección como completada. Inténtalo de nuevo.');
    } finally {
      setCompleting(false);
    }
  }, [user, lesson._id, onCompleted, courseId]);

  return (
    <>
      <div className="lesson-content">
        <div 
          dangerouslySetInnerHTML={{ __html: lesson.content }} 
          style={{ minHeight: '200px' }}
        />
        {lesson.videoUrl && (
          <div className="mt-4">
            <iframe
              width="100%"
              height="400"
              src={lesson.videoUrl}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Botón para completar lecciones que solo tienen contenido */}
        {isContentOnlyLesson && user?.walletAddress && (
          <div className="mt-4 pt-4 border-top">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            
            <div className="text-center">
              {lesson.isCompleted ? (
                <div className="mb-3">
                  <div className="d-inline-flex align-items-center px-4 py-2 bg-success text-white rounded-pill">
                    <FaCheck className="me-2" />
                    ¡Lección completada!
                  </div>
                  <p className="text-muted mt-2 mb-0">
                    Has completado esta lección exitosamente.
                  </p>
                </div>
              ) : (
                <div className="mb-3">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleMarkAsCompleted}
                    disabled={completing}
                    className="px-4 py-2 fw-bold"
                  >
                    {completing ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Marcando como completada...
                      </>
                    ) : (
                      <>
                        <FaCheck className="me-2" />
                        Marcar como completada
                      </>
                    )}
                  </Button>
                  <p className="text-muted mt-2 mb-0">
                    Una vez completada, podrás avanzar a la siguiente lección.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de completado de lección de contenido */}
      <Modal 
        show={showCompletionModal} 
        onHide={() => setShowCompletionModal(false)}
        centered
        size="lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            {lessonProgress.isCourseCompleted ? (
              <div className="text-success">
                <FaTrophy size={48} className="mb-3" />
                <h3>¡Enhorabuena!</h3>
              </div>
            ) : (
              <div className="text-success">
                <FaCheck size={48} className="mb-3" />
                <h4>¡Lección Completada!</h4>
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {lessonProgress.isCourseCompleted ? (
            <div>
              <h5 className="mb-3">¡Has completado todo el curso!</h5>
              <p className="text-muted mb-4">
                Felicidades por completar todas las lecciones. Has demostrado tu dedicación y conocimiento.
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <strong>Curso completado al 100%</strong>
                <br />
                <small className="text-muted">{lessonProgress.totalLessons} lecciones completadas</small>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-3">
                ¡Excelente trabajo! Has completado esta lección exitosamente.
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <strong>Progreso del curso:</strong> {lessonProgress.currentLessonIndex + 1} de {lessonProgress.totalLessons} lecciones
              </div>
              {lessonProgress.currentLessonIndex < lessonProgress.totalLessons - 1 && (
                <p className="mb-0">
                  ¿Quieres continuar con la siguiente lección?
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          {lessonProgress.isCourseCompleted ? (
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate(`/course/${courseId}`);
                }}
              >
                Ver Curso
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowCompletionModal(false);
                  navigate('/my-courses');
                }}
              >
                Mis Cursos
              </Button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowCompletionModal(false)}
              >
                Continuar aquí
              </Button>
              {lessonProgress.currentLessonIndex < lessonProgress.totalLessons - 1 && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate(`/course/${courseId}/lesson/${lessonProgress.currentLessonIndex + 2}`);
                  }}
                  className="d-flex align-items-center"
                >
                  Siguiente lección
                  <FaArrowRight className="ms-2" />
                </Button>
              )}
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LessonContent; 