import React from 'react';
import { Card, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PersonCircle, Calendar3 } from 'react-bootstrap-icons';
import { EnrolledCourseCardProps } from '../../types/course.types';

const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ 
  course, 
  progress = 0, 
  enrolledAt,
  isEnrolled = true 
}) => {
  return (
    <Card className="h-100 shadow-sm hover-shadow">
      {course.imageUrl && (
        <Card.Img
          variant="top"
          src={course.imageUrl}
          alt={course.title}
          style={{ height: '160px', objectFit: 'cover' }}
        />
      )}
      <Card.Body className="d-flex flex-column min-vh-25">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0 course-title-truncate">{course.title}</Card.Title>
          <Badge 
            bg={
              course.level === 'beginner' ? 'success' : 
              course.level === 'intermediate' ? 'warning' : 
              course.level === 'advanced' ? 'danger' : 'info'
            }
          >
            {course.level || 'All Levels'}
          </Badge>
        </div>
        
        <Card.Text className="small text-muted mb-2 d-flex align-items-center">
          <PersonCircle className="me-1" /> {typeof course.instructor === 'string' ? course.instructor : course.instructor.displayName}
        </Card.Text>
        
        <Card.Text className="text-truncate mb-3">{course.description}</Card.Text>
        
        {isEnrolled && (
          <>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Progress</small>
                <small className="text-muted">{progress}%</small>
              </div>
              <ProgressBar now={progress} />
            </div>
            
            {enrolledAt && (
              <Card.Text className="small text-muted mb-3 d-flex align-items-center">
                <Calendar3 className="me-1" /> Enrolled on {new Date(enrolledAt).toLocaleDateString()}
              </Card.Text>
            )}
          </>
        )}
        
        <div className="mt-auto">
          <Link to={`/course/${course._id}`} className="btn btn-primary w-100">
            {isEnrolled ? 'Continue Learning' : 'View Course'}
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EnrolledCourseCard; 