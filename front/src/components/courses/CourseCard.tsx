import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PersonCircle, TagFill, ArrowRight } from 'react-bootstrap-icons';
import { CourseCardProps, Course, Instructor } from '../../types/course.types';
import { ICourseData } from '../../services/course/course.api';

// Accept either individual props or a course object
type Props = CourseCardProps | { course: Course | ICourseData };

const CourseCard = (props: Props) => {
  // Determine if we're using a course object or individual props
  const isCourseObject = 'course' in props;
  const courseData = isCourseObject ? props.course : props;

  // Extract instructor name
  let instructorName = '';
  if (typeof courseData.instructor === 'string') {
    instructorName = courseData.instructor;
  } else if (courseData.instructor) {
    instructorName = courseData.instructor.displayName || 'Instructor';
  }

  return (
    <Card className="h-100 shadow-sm hover-shadow">
      {courseData.imageUrl && (
        <Card.Img
          variant="top"
          src={courseData.imageUrl}
          alt={courseData.title}
          style={{ height: '160px', objectFit: 'cover' }}
        />
      )}
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="mb-0">{courseData.title}</Card.Title>
          <Badge 
            bg={
              courseData.level === 'beginner' ? 'success' : 
              courseData.level === 'intermediate' ? 'warning' : 
              courseData.level === 'advanced' ? 'danger' : 'info'
            }
          >
            {courseData.level || 'All Levels'}
          </Badge>
        </div>
        
        <Card.Text className="small text-muted mb-2 d-flex align-items-center">
          <PersonCircle className="me-1" /> {instructorName}
        </Card.Text>
        
        <Card.Text className="text-truncate mb-3">{courseData.description}</Card.Text>
        
        {courseData.tags && courseData.tags.length > 0 && (
          <div className="mb-3">
            {courseData.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                <TagFill className="me-1" size={12} />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <Card.Text className="mb-0 fw-bold">
            {courseData.price === 0 ? 'Free' : `${courseData.price} MATIC`}
          </Card.Text>
          <Link to={`/course/${courseData._id}`} className="btn btn-sm btn-outline-primary">
            View Details <ArrowRight />
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CourseCard;
