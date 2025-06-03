import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Form, Alert, Tabs, Tab, Modal } from 'react-bootstrap';
import { lessonService } from '../../services/lesson/lessonService';
import { QuizQuestion, CodeExercise } from '../../services/lesson/lesson.api';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './LessonQuiz.module.css';
import CodeTest from '../interactive/CodeTest';
import { FaCheck, FaArrowRight, FaTrophy } from 'react-icons/fa';

interface LessonQuizProps {
  lessonId: string;
  courseId: string;
  onCompleted?: () => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({ lessonId, courseId, onCompleted }) => {
  // Debug what props this component is receiving
  console.log('🎯 LessonQuiz component props:', {
    lessonId,
    courseId,
    hasOnCompleted: !!onCompleted
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [codeExercises, setCodeExercises] = useState<CodeExercise[]>([]);
  
  // Estados para los modals de completado
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showQuizCompletedModal, setShowQuizCompletedModal] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quiz');

  useEffect(() => {
    const fetchQuizAndCode = async () => {
      try {
        const lesson = await lessonService.getLessonById(lessonId);
        console.log('🎯 LECCION RECIBIDA DETALLADA:', {
          id: lesson._id,
          title: lesson.title,
          quizCompleted: lesson.quizCompleted,
          quizScore: lesson.quizScore,
          codeExercisesCompleted: lesson.codeExercisesCompleted,
          isCompleted: lesson.isCompleted,
          quizQuestions: lesson.quizQuestions?.length || 0,
          codeExercises: lesson.codeExercises?.length || 0
        });
        
        if (lesson.quizQuestions) {
          setQuestions(lesson.quizQuestions);
          if (lesson.quizCompleted) {
            // Si el quiz ya está completado, mostrar las respuestas correctas
            setAnswers(lesson.quizQuestions.map(q => q.correctAnswerIndex));
            setScore(lesson.quizScore || 100);
            setSubmitted(true);
            setAlreadyCompleted(true);
            console.log('✅ Quiz ya completado previamente con score:', lesson.quizScore);
          } else {
            setAnswers(new Array(lesson.quizQuestions.length).fill(-1));
            setScore(null);
            setSubmitted(false);
            setAlreadyCompleted(false);
            console.log('🎯 Quiz pendiente de completar');
          }
        }
        if (lesson.codeExercises) {
          setCodeExercises(lesson.codeExercises);
          console.log('💻 Ejercicios de código encontrados:', lesson.codeExercises.length);
          console.log('💻 Estructura de ejercicios:', lesson.codeExercises.map(ex => ({
            id: ex.id,
            _id: (ex as any)._id,
            title: ex.title,
            hasTestCases: Array.isArray((ex as any).testCases) && (ex as any).testCases.length > 0
          })));
        } else {
          setCodeExercises([]);
          console.log('💻 No hay ejercicios de código');
        }
      } catch (error) {
        console.error('❌ Error fetching quiz or code exercises:', error);
      }
    };
    fetchQuizAndCode();
  }, [lessonId]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (!user?.walletAddress) {
      alert('Debes conectar tu wallet para completar el test.');
      return;
    }
    const correctAnswers = questions.filter((q, i) => q.correctAnswerIndex === answers[i]).length;
    const finalScore = (correctAnswers / questions.length) * 100;
    setScore(finalScore);
    setSubmitted(true);

    console.log('Quiz completed with score:', finalScore);

    // Solo marcar como completado si la puntuación es suficiente
    if (finalScore >= 70) {
      try {
        console.log('Marking quiz as completed...', { lessonId, score: finalScore, walletAddress: user.walletAddress });
        const result = await lessonService.markQuizCompleted(lessonId, finalScore, user.walletAddress);
        console.log('Quiz marked as completed result:', result);
        
        setAlreadyCompleted(true);
        
        console.log('Calling onCompleted callback...');
        if (onCompleted) {
          await onCompleted();
          console.log('onCompleted callback finished');
        }

        // Obtener información actualizada del curso para determinar progreso
        try {
          const lessons = await lessonService.getCourseLessons(courseId, user.walletAddress);
          console.log('📊 Lessons after quiz completion:', lessons.map(l => ({ 
            id: l._id,
            title: l.title, 
            isCompleted: l.isCompleted,
            quizCompleted: l.quizCompleted,
            codeExercisesCompleted: l.codeExercisesCompleted,
            hasQuiz: (l.quizQuestions?.length || 0) > 0,
            hasCode: (l.codeExercises?.length || 0) > 0
          })));
          
          const completedLessons = lessons.filter(l => l.isCompleted).length;
          const currentLessonIdx = lessons.findIndex(l => l._id === lessonId);
          
          setCurrentLessonIndex(currentLessonIdx);
          setTotalLessons(lessons.length);
          setIsCourseCompleted(completedLessons === lessons.length);
          
          // Verificar si la lección actual está totalmente completada
          const currentLesson = lessons[currentLessonIdx];
          const hasCodeExercises = codeExercises && codeExercises.length > 0;
          const isLessonFullyCompleted = currentLesson?.isCompleted;
          
          console.log('🔍 Lección actual después de completar quiz:', {
            currentLessonTitle: currentLesson?.title,
            isCompleted: currentLesson?.isCompleted,
            quizCompleted: currentLesson?.quizCompleted,
            codeExercisesCompleted: currentLesson?.codeExercisesCompleted,
            hasCodeExercises,
            isLessonFullyCompleted,
            shouldShowModal: isLessonFullyCompleted
          });
          
          if (isLessonFullyCompleted) {
            // Solo mostrar modal si la lección está totalmente completada
            console.log('🎉 Mostrando modal de lección completada');
            setShowCompletionModal(true);
          } else if (hasCodeExercises) {
            // Si hay ejercicios de código pendientes, mostrar una notificación diferente
            console.log('⏳ Quiz completado, pero faltan ejercicios de código');
            setShowQuizCompletedModal(true);
          } else {
            // Si no hay ejercicios de código, mostrar el modal de completado
            console.log('🎉 No hay ejercicios de código, mostrando modal de completado');
            setShowCompletionModal(true);
          }
        } catch (error) {
          console.error('❌ Error getting course progress:', error);
          // En caso de error, no mostrar modal para evitar confusión
        }
      } catch (e) {
        console.error('Error marcando quiz como completado:', e);
      }
    } else {
      console.log('Score too low to complete quiz:', finalScore);
    }
  }, [user, questions, answers, lessonId, onCompleted, courseId, codeExercises]);

  // Función para manejar cuando se completa un ejercicio de código
  const handleCodeExerciseCompleted = async (exerciseId: string) => {
    console.log('🚀 handleCodeExerciseCompleted llamado con exerciseId:', exerciseId);
    
    if (!user?.walletAddress) {
      console.log('❌ No hay wallet address');
      return;
    }
    
    try {
      console.log('🔄 Marcando ejercicio como completado...', { lessonId, exerciseId, walletAddress: user.walletAddress });
      const result = await lessonService.markCodeExerciseCompleted(lessonId, exerciseId, user.walletAddress);
      console.log('✅ Ejercicio marcado como completado, resultado:', {
        isCompleted: result.isCompleted,
        quizCompleted: result.quizCompleted,
        codeExercisesCompleted: result.codeExercisesCompleted
      });
      
      if (onCompleted) {
        console.log('🔄 Llamando callback onCompleted...');
        await onCompleted();
      }

      // Verificar si ahora la lección está completamente terminada
      const lessons = await lessonService.getCourseLessons(courseId, user.walletAddress);
      const currentLessonIdx = lessons.findIndex(l => l._id === lessonId);
      const currentLesson = lessons[currentLessonIdx];
      
      console.log('🔍 Estado de la lección después de completar ejercicio:', {
        currentLessonTitle: currentLesson?.title,
        isCompleted: currentLesson?.isCompleted,
        quizCompleted: currentLesson?.quizCompleted,
        codeExercisesCompleted: currentLesson?.codeExercisesCompleted
      });
      
      if (currentLesson?.isCompleted) {
        const completedLessons = lessons.filter(l => l.isCompleted).length;
        setCurrentLessonIndex(currentLessonIdx);
        setTotalLessons(lessons.length);
        setIsCourseCompleted(completedLessons === lessons.length);
        console.log('🎉 Lección completamente terminada, mostrando modal');
        setShowCompletionModal(true);
      } else {
        console.log('⏳ Lección aún no completamente terminada');
      }
    } catch (error) {
      console.error('❌ Error marking code exercise as completed:', error);
    }
  };

  console.log({ alreadyCompleted, answers, questions });

  if (questions.length === 0 && codeExercises.length === 0) {
    return <Alert variant="info">No hay quiz ni ejercicios de código para esta lección.</Alert>;
  }

  return (
    <>
      <Tabs
        id="lesson-quiz-tabs"
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="quiz" title="Quiz" disabled={questions.length === 0}>
          <div className={styles["quiz-container"]}>
            {alreadyCompleted && (
              <div className={styles["quiz-already-completed"]}>
                ¡Ya has completado correctamente este test!
              </div>
            )}
            {questions.map((question, qIndex) => (
              <div key={qIndex} className={styles["quiz-card"]}>
                <div className="p-4">
                  <div className={styles["quiz-title"]}>Pregunta {qIndex + 1}</div>
                  <div className={styles["quiz-question"]}>{question.question}</div>
                  <div className={styles["quiz-options"]}>
                    {question.options.map((option, oIndex) => {
                      let optionClass = styles["quiz-radio"];
                      if (submitted || alreadyCompleted) {
                        if (question.correctAnswerIndex === oIndex) optionClass += ' ' + styles["correct"];
                        else if (answers[qIndex] === oIndex) optionClass += ' ' + styles["incorrect"];
                      } else if (answers[qIndex] === oIndex) {
                        optionClass += ' ' + styles["selected"];
                      }
                      return (
                        <label key={oIndex} className={optionClass}>
                          <input
                            type="radio"
                            name={`q${qIndex}`}
                            checked={answers[qIndex] === oIndex}
                            onChange={() => handleAnswerSelect(qIndex, oIndex)}
                            disabled={submitted || alreadyCompleted}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {!submitted ? (
              <Button 
                className={styles["quiz-submit-btn"]}
                onClick={handleSubmit}
                disabled={answers.includes(-1)}
              >
                Enviar Quiz
              </Button>
            ) : (
              <div>
                <div className={score && score >= 70 ? styles["quiz-score"] : `${styles["quiz-score"]} ${styles["fail"]}`}>
                  Tu puntuación: {score?.toFixed(1)}%
                </div>
                {score !== null && score < 70 && (
                  <Button
                    className={styles["quiz-submit-btn"]}
                    onClick={() => {
                      setSubmitted(false);
                      setScore(null);
                      setAnswers(new Array(questions.length).fill(-1));
                    }}
                  >
                    Reintentar Quiz
                  </Button>
                )}
                {score !== null && score >= 70 && alreadyCompleted && (
                  <div className={styles["quiz-already-completed"]}>
                    ¡Ya has completado correctamente este test!
                  </div>
                )}
              </div>
            )}
          </div>
        </Tab>
        {codeExercises.length > 0 && (
          <Tab eventKey="code" title="Ejercicios de Código">
            <div className="mt-3">
              {codeExercises.map((exercise, idx) => {
                // Usar _id si id no está disponible, con fallback más robusto
                const exerciseId = exercise.id || (exercise as any)._id || `exercise-${lessonId}-${idx}`;
                console.log('💻 Renderizando ejercicio:', {
                  originalId: exercise.id,
                  _id: (exercise as any)._id,
                  finalExerciseId: exerciseId,
                  index: idx
                });

                // DEBUGGING: Verificar todas las props antes de pasarlas
                console.log('🔍 DEBUGGING - Props que se van a pasar a CodeTest:', {
                  title: exercise.title,
                  lessonId: lessonId,
                  exerciseId: exerciseId,
                  hasOnCompleted: !!handleCodeExerciseCompleted,
                  exercise: exercise,
                  isCompleted: exercise.isCompleted
                });
                
                return (
                  <CodeTest
                    key={`${exerciseId}-${idx}`}
                    title={exercise.title}
                    description={exercise.description}
                    initialCode={exercise.initialCode}
                    height={220}
                    testCases={Array.isArray((exercise as any).testCases) ? (exercise as any).testCases : []}
                    lessonId={lessonId}
                    exerciseId={exerciseId}
                    isCompleted={exercise.isCompleted}
                    onCompleted={handleCodeExerciseCompleted}
                  />
                );
              })}
            </div>
          </Tab>
        )}
      </Tabs>

      {/* Modal de completado de lección */}
      <Modal 
        show={showCompletionModal} 
        onHide={() => setShowCompletionModal(false)}
        centered
        size="lg"
      >
        <Modal.Header className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            {isCourseCompleted ? (
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
          {isCourseCompleted ? (
            <div>
              <h5 className="mb-3">¡Has completado todo el curso!</h5>
              <p className="text-muted mb-4">
                Felicidades por completar todas las lecciones. Has demostrado tu dedicación y conocimiento.
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <strong>Curso completado al 100%</strong>
                <br />
                <small className="text-muted">{totalLessons} lecciones completadas</small>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted mb-3">
                ¡Excelente trabajo! Has completado esta lección exitosamente.
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <strong>Progreso del curso:</strong> {currentLessonIndex + 1} de {totalLessons} lecciones
              </div>
              {currentLessonIndex < totalLessons - 1 && (
                <p className="mb-0">
                  ¿Quieres continuar con la siguiente lección?
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          {isCourseCompleted ? (
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
              {currentLessonIndex < totalLessons - 1 && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate(`/course/${courseId}/lesson/${currentLessonIndex + 2}`);
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

      {/* Modal para cuando se completa el quiz pero faltan ejercicios de código */}
      <Modal 
        show={showQuizCompletedModal} 
        onHide={() => setShowQuizCompletedModal(false)}
        centered
      >
        <Modal.Header className="border-0 pb-0 bg-primary text-white">
          <Modal.Title className="w-100 text-center">
            <div className="text-white">
              <FaCheck size={32} className="mb-3" />
              <h4>¡Quiz Completado!</h4>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div>
            <h5 className="mb-3 text-success">¡Excelente trabajo en el quiz!</h5>
            <p className="text-muted mb-4">
              Has completado correctamente el quiz de esta lección. 
            </p>
            <div className="bg-light rounded p-3 mb-4">
              <strong>Puntuación obtenida:</strong> {score?.toFixed(1)}%
              <br />
              <small className="text-muted">Quiz aprobado con éxito</small>
            </div>
            <div className="alert alert-info mb-0">
              <strong>Siguiente paso:</strong> Completa los ejercicios de código para terminar completamente esta lección.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center">
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowQuizCompletedModal(false)}
            >
              Continuar más tarde
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setShowQuizCompletedModal(false);
                setActiveTab('code'); // Cambiar automáticamente a la pestaña de ejercicios
              }}
              className="d-flex align-items-center"
            >
              Ir a Ejercicios de Código
              <FaArrowRight className="ms-2" />
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LessonQuiz; 