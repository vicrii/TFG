import React from 'react';
import { Row, Col, ProgressBar, Badge } from 'react-bootstrap';

interface UserProgressSummaryProps {
  progress: any;
}

const UserProgressSummary: React.FC<UserProgressSummaryProps> = ({ progress }) => {
  return (
    <div className="user-progress-summary">
      <Row className="mb-4">
        <Col md={4}>
          <div className="text-center mb-3">
            <h4>{progress.completedLessons?.length || 0}</h4>
            <p className="text-muted mb-0">Lecciones Completadas</p>
          </div>
        </Col>
        <Col md={4}>
          <div className="text-center mb-3">
            <h4>{Math.round(progress.totalStudyTime / 60) || 0}</h4>
            <p className="text-muted mb-0">Minutos de Estudio</p>
          </div>
        </Col>
        <Col md={4}>
          <div className="text-center mb-3">
            <h4>{progress.examStats?.passed || 0}/{progress.examStats?.total || 0}</h4>
            <p className="text-muted mb-0">Exámenes Aprobados</p>
          </div>
        </Col>
      </Row>
      
      {progress.recentActivity && progress.recentActivity.length > 0 && (
        <div className="recent-activity mb-3">
          <h5 className="mb-3">Actividad Reciente</h5>
          {progress.recentActivity.slice(0, 3).map((activity: any, index: number) => (
            <div key={index} className="d-flex align-items-center mb-2">
              <Badge bg="info" className="me-2">
                {activity.activityType === 'lesson_viewed' && 'Vista'}
                {activity.activityType === 'lesson_completed' && 'Completada'}
                {activity.activityType === 'exam_started' && 'Examen Iniciado'}
                {activity.activityType === 'exam_completed' && 'Examen Completado'}
              </Badge>
              <span>
                {activity.lesson?.title || 'Lección'} - {activity.course?.title || 'Curso'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProgressSummary; 