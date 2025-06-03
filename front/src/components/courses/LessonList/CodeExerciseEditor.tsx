import React from 'react';
import { Form, Button, Accordion } from 'react-bootstrap';
import { FaCode, FaTrash, FaPlus } from 'react-icons/fa';
import { CodeExercise, CodeTestCase } from '../../../types/lesson';

interface CodeExerciseEditorProps {
  exercise: CodeExercise;
  index: number;
  onExerciseChange: (index: number, field: keyof CodeExercise, value: string | CodeTestCase[]) => void;
  onDelete: (index: number) => void;
}

const CodeExerciseEditor: React.FC<CodeExerciseEditorProps> = ({ exercise, index, onExerciseChange, onDelete }) => {
  const handleAddTestCase = () => {
    const newTestCase: CodeTestCase = {
      input: '',
      expectedOutput: '',
      description: `Caso de prueba ${(exercise.testCases?.length || 0) + 1}`
    };
    onExerciseChange(index, 'testCases', [...(exercise.testCases || []), newTestCase]);
  };

  const handleTestCaseChange = (testCaseIndex: number, field: keyof CodeTestCase, value: string) => {
    const updatedTestCases = [...(exercise.testCases || [])];
    updatedTestCases[testCaseIndex] = {
      ...updatedTestCases[testCaseIndex],
      [field]: value
    };
    onExerciseChange(index, 'testCases', updatedTestCases);
  };

  const handleDeleteTestCase = (testCaseIndex: number) => {
    const updatedTestCases = [...(exercise.testCases || [])];
    updatedTestCases.splice(testCaseIndex, 1);
    onExerciseChange(index, 'testCases', updatedTestCases);
  };

  return (
    <Accordion.Item eventKey={index.toString()}>
      <Accordion.Header>
        <div className="d-flex align-items-center">
          <FaCode className="me-2 text-primary" />
          {exercise.title || `Ejercicio ${index + 1}`}
        </div>
      </Accordion.Header>
      <Accordion.Body>
        <Form.Group className="mb-3">
          <Form.Label>Título</Form.Label>
          <Form.Control
            type="text"
            value={exercise.title}
            onChange={(e) => onExerciseChange(index, 'title', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={exercise.description}
            onChange={(e) => onExerciseChange(index, 'description', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Código Inicial</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={exercise.initialCode}
            onChange={(e) => onExerciseChange(index, 'initialCode', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Solución</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={exercise.solution}
            onChange={(e) => onExerciseChange(index, 'solution', e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Salida Esperada</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={exercise.expectedOutput}
            onChange={(e) => onExerciseChange(index, 'expectedOutput', e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Pista</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={exercise.hint}
            onChange={(e) => onExerciseChange(index, 'hint', e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Casos de Prueba</Form.Label>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleAddTestCase}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-1" /> Añadir Caso
            </Button>
          </div>
          
          {exercise.testCases && exercise.testCases.length > 0 ? (
            exercise.testCases.map((testCase, tcIndex) => (
              <div key={tcIndex} className="border rounded p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Caso de prueba {tcIndex + 1}</h6>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteTestCase(tcIndex)}
                  >
                    <FaTrash />
                  </Button>
                </div>
                
                <Form.Group className="mb-2">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    type="text"
                    value={testCase.description}
                    onChange={(e) => handleTestCaseChange(tcIndex, 'description', e.target.value)}
                    placeholder="Descripción del caso de prueba"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Input</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(tcIndex, 'input', e.target.value)}
                    placeholder="Input del caso de prueba"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Salida Esperada</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={testCase.expectedOutput}
                    onChange={(e) => handleTestCaseChange(tcIndex, 'expectedOutput', e.target.value)}
                    placeholder="Salida esperada"
                  />
                </Form.Group>
              </div>
            ))
          ) : (
            <div className="text-muted text-center py-3 border rounded">
              No hay casos de prueba añadidos. Añade casos de prueba con el botón arriba.
            </div>
          )}
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onDelete(index)}
          >
            <FaTrash className="me-1" /> Eliminar Ejercicio
          </Button>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default CodeExerciseEditor; 