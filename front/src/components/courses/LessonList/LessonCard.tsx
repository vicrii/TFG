import React from 'react';
import { ListGroup, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaPlay, FaPencilAlt, FaTrash, FaCheck, FaClock } from 'react-icons/fa';
import { Lesson } from '../../../types/lesson';
import { formatDuration } from '../../../utils/formatDuration';

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  isInstructor: boolean;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onNavigate: (lessonIndex: number) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  index,
  isInstructor,
  onEdit,
  onDelete,
  onNavigate
}) => {
  return (
    <ListGroup.Item
      className={`mb-3 rounded-3 hover-shadow transition-all lesson-item ${lesson.isCompleted ? 'border-success' : ''}`}
      action
      onClick={() => onNavigate(index)}
      style={lesson.isCompleted ? { borderLeft: '4px solid #198754' } : {}}
    >
      <Row className="align-items-center g-3">
        <Col>
          <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
            <h5 className="mb-0 lesson-text">{lesson.title}</h5>
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
          <p className="mb-2 lesson-description">{lesson.description}</p>
          {lesson.duration && lesson.duration > 0 && (
            <small className="lesson-meta d-flex align-items-center">
              <FaClock className="me-1" />
              {formatDuration(lesson.duration)}
            </small>
          )}
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
                    onEdit(lesson);
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
                    onDelete(lesson._id);
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
  );
};

export default LessonCard; 