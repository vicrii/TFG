import React from 'react';
import { Modal, Button, Alert, Form, Tab, Tabs } from 'react-bootstrap';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Lesson } from '../../../types/lesson';

interface LessonListReviewModalProps {
  show: boolean;
  onHide: () => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  generatedLessons: Partial<Lesson>[];
  currentLessonIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onUpdateLesson: (updatedData: Partial<Lesson>) => void;
  creatingLessons: boolean;
}

const LessonListReviewModal: React.FC<LessonListReviewModalProps> = ({
  show,
  onHide,
  onSave,
  onCancel,
  generatedLessons,
  currentLessonIndex,
  onNavigate,
  onUpdateLesson,
  creatingLessons
}) => {
  return (
    <Modal
      show={show}
      onHide={onCancel}
      backdrop="static"
      keyboard={false}
      size="xl"
      dialogClassName="lesson-review-modal"
      centered
    >
      <Modal.Header>
        <Modal.Title>Revisar contenido generado antes de crear lecciones</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {generatedLessons.length > 0 && (
          <>
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Importante</Alert.Heading>
              <p>
                El contenido se ha generado correctamente. Ahora puedes revisarlo y editarlo antes de crear las lecciones.
              </p>
              <p className="mb-0">
                <strong>Solo se crearán las lecciones que tengan contenido válido.</strong> Una vez creadas, aparecerán en el listado de lecciones del curso.
              </p>
            </Alert>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>
                Lección {currentLessonIndex + 1} de {generatedLessons.length}
              </h5>
              <div className="d-flex">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onNavigate('prev')}
                  disabled={currentLessonIndex === 0}
                  className="me-2"
                >
                  <FaArrowLeft /> Anterior
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onNavigate('next')}
                  disabled={currentLessonIndex === generatedLessons.length - 1}
                >
                  Siguiente <FaArrowRight />
                </Button>
              </div>
            </div>

            <Tabs className="mb-4" defaultActiveKey="content">
              <Tab eventKey="content" title="Contenido principal">
                <Form.Group className="mb-3">
                  <Form.Label>Título</Form.Label>
                  <Form.Control
                    type="text"
                    value={generatedLessons[currentLessonIndex].title || ''}
                    onChange={(e) => onUpdateLesson({ title: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={generatedLessons[currentLessonIndex].description || ''}
                    onChange={(e) => onUpdateLesson({ description: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Orden</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={generatedLessons[currentLessonIndex].order || 0}
                    onChange={(e) => onUpdateLesson({ order: parseInt(e.target.value) })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Contenido de la lección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={generatedLessons[currentLessonIndex].content || ''}
                    onChange={(e) => onUpdateLesson({ content: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Puedes usar formato HTML para enriquecer el contenido.
                  </Form.Text>
                </Form.Group>
              </Tab>
            </Tabs>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={onSave}
          disabled={creatingLessons}
        >
          {creatingLessons ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Guardando lecciones...
            </>
          ) : (
            `Guardar ${generatedLessons.length} lecciones`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LessonListReviewModal; 