import React from 'react'; // Import React
import { Row, Col, Alert } from 'react-bootstrap';
import CourseCard from './CourseCard';
import { CourseListProps } from '../../types/course.types';

// usar React.FC con el tipo de props
const CourseList: React.FC<CourseListProps> = ({ courses }) => {

  if (!courses || courses.length === 0) {
    return (
      <Alert variant="info">
        No hay cursos disponibles en este momento.
      </Alert>
    );
  }

  // renderizar la lista de cursos
  return (
    <Row xs={1} md={2} lg={3} className="g-4">
      {courses.map((course) => (
        <Col key={course._id}>
          <CourseCard course={course} />
        </Col>
      ))}
    </Row>
  );
}

export default CourseList;