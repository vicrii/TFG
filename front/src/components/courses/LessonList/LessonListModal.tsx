import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Tab, Tabs } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Lesson, CodeExercise } from '../../../types/lesson';
import CodeExerciseEditor from './CodeExerciseEditor';

interface LessonListModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (formData: Partial<Lesson>) => Promise<void>;
  editingLesson: Lesson | null;
}

const LessonListModal: React.FC<LessonListModalProps> = ({ show, onHide, onSubmit, editingLesson }) => {
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
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingLesson) {
      setFormData(editingLesson);
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        videoUrl: '',
        duration: 0,
        order: 0,
        quizQuestions: [],
        codeExercises: []
      });
    }
  }, [editingLesson]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCodeExercise = () => {
    setFormData(prev => {
      const newCodeExercise: CodeExercise = {
        id: Date.now().toString(),
        title: 'Nuevo Ejercicio',
        description: 'Descripción del ejercicio',
        language: 'javascript',
        initialCode: '// Escribe tu código aquí\n\n',
        solution: '// Solución\n\n',
        hint: 'Pista para resolver el ejercicio',
        expectedOutput: 'Salida esperada',
        testCases: [
          {
            input: '',
            expectedOutput: '',
            description: 'Caso de prueba 1'
          }
        ]
      };
      return {
        ...prev,
        codeExercises: [...(prev.codeExercises || []), newCodeExercise]
      };
    });
  };

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

  const handleCodeExerciseChange = (
    index: number,
    field: keyof CodeExercise,
    value: string | any[]
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataWithTestCases = {
        ...formData,
        codeExercises: formData.codeExercises?.map(exercise => ({
          ...exercise,
          testCases: exercise.testCases || []
        }))
      };
      await onSubmit(formDataWithTestCases);
      onHide();
    } catch (error) {
      setError('Error al guardar la lección');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
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

              <Form.Group className="mb-3">
                <Form.Label>Duración (minutos)</Form.Label>
                <Form.Control
                  type="number"
                  name="duration"
                  value={formData.duration || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Orden</Form.Label>
                <Form.Control
                  type="number"
                  name="order"
                  value={formData.order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </Form.Group>
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

            <Tab eventKey="code" title="Ejercicios de Código">
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Ejercicios de Código</h5>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddCodeExercise}
                >
                  <FaPlus className="me-1" /> Añadir Ejercicio
                </Button>
              </div>

              {formData.codeExercises && formData.codeExercises.length > 0 ? (
                formData.codeExercises.map((exercise, index) => (
                  <CodeExerciseEditor
                    key={index}
                    exercise={exercise}
                    index={index}
                    onExerciseChange={handleCodeExerciseChange}
                    onDelete={handleDeleteCodeExercise}
                  />
                ))
              ) : (
                <p className="text-muted text-center py-3">
                  No hay ejercicios de código añadidos aún. Añade ejercicios con el botón arriba.
                </p>
              )}
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {editingLesson ? 'Actualizar' : 'Crear'} Lección
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LessonListModal; 