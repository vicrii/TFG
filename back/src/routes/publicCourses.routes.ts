import { Router, RequestHandler } from 'express';
import { Course } from '../../models/Course';
import { Lesson } from '../../models/Lesson';

const router = Router();

interface CourseParams {
  courseId: string;
}

// obtener todos los cursos publicados
const getAllPublishedCourses: RequestHandler = async (req, res, next) => {
  try {
    const filter: any = { published: true };
    
    //  filtrado por instructor
    if (req.query.instructor) {
      filter.instructor = req.query.instructor;
    }
    
    // filtrado por tag
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    // manejo de ordenación
    let sortOptions: any = { createdAt: -1 }; // ordenación por defecto
    if (req.query.sortBy) {
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortOptions = { [req.query.sortBy as string]: sortOrder };
    }
    
    const courses = await Course.find(filter).sort(sortOptions);
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

// get by id 
const getPublishedCourseById: RequestHandler<CourseParams> = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      res.status(404).json({ 
        message: 'Curso no encontrado' 
      });
      return;
    }
    
    // solo devolver el curso si está publicado
    if (!course.published) {
      res.status(404).json({ 
        message: 'Curso no disponible' 
      });
      return;
    }
    
    res.json(course);
  } catch (error) {
    next(error);
  }
};

// get lesson previews
const getLessonPreviewsForCourse: RequestHandler<CourseParams> = async (req, res, next) => {
  try {
    // primero comprobar si el curso existe y está publicado
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      res.status(404).json({ 
        message: 'Curso no encontrado' 
      });
      return;
    }
    
    // solo devolver vista previa de lección si el curso está publicado
    if (!course.published) {
      res.status(404).json({ 
        message: 'Curso no disponible' 
      });
      return;
    }
    
    // encontrar lecciones para este curso pero solo devolver campos limitados
    const lessonPreviews = await Lesson.find({ course: req.params.courseId })
      .select('title description duration order')
      .sort({ order: 1 });
    
    // transformar previas para exponer solo lo que queremos mostrar a usuarios no autenticados
    const previewsToSend = lessonPreviews.map((lesson, index) => ({
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      order: lesson.order || index,
      isPreview: true // marcar como vista previa para que la frontend sepa que es datos limitados
    }));
    
    res.json(previewsToSend);
  } catch (error) {
    next(error);
  }
};

// Routes
router.get('/', getAllPublishedCourses);
router.get('/:courseId', getPublishedCourseById);
router.get('/:courseId/lesson-previews', getLessonPreviewsForCourse);

export default router; 