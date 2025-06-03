import React from 'react';
import { Form, Button } from 'react-bootstrap';
import { CodeTestCase } from '../../../types/lesson';

interface TestCasesEditorProps {
  testCases: CodeTestCase[];
  onTestCasesChange: (updatedTestCases: CodeTestCase[]) => void;
}

const TestCasesEditor: React.FC<TestCasesEditorProps> = ({ testCases, onTestCasesChange }) => {
  return (
    <div>
      <Form.Label>Casos de Prueba</Form.Label>
      {testCases && testCases.length > 0 ? (
        testCases.map((tc, tcIdx) => (
          <div key={tcIdx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8, borderRadius: 4 }}>
            <Form.Control
              className="mb-2"
              type="text"
              placeholder="Input"
              value={tc.input}
              onChange={(e) => {
                const updated = [...testCases];
                updated[tcIdx].input = e.target.value;
                onTestCasesChange(updated);
              }}
            />
            <Form.Control
              className="mb-2"
              type="text"
              placeholder="Expected Output"
              value={tc.expectedOutput}
              onChange={(e) => {
                const updated = [...testCases];
                updated[tcIdx].expectedOutput = e.target.value;
                onTestCasesChange(updated);
              }}
            />
            <Form.Control
              className="mb-2"
              type="text"
              placeholder="Descripción"
              value={tc.description}
              onChange={(e) => {
                const updated = [...testCases];
                updated[tcIdx].description = e.target.value;
                onTestCasesChange(updated);
              }}
            />
            <Button variant="outline-danger" size="sm" onClick={() => {
              const updated = [...testCases];
              updated.splice(tcIdx, 1);
              onTestCasesChange(updated);
            }}>Eliminar</Button>
          </div>
        ))
      ) : (
        <div className="text-muted mb-2">No hay casos de prueba añadidos.</div>
      )}
      <Button variant="outline-primary" size="sm" onClick={() => {
        const updated = [...testCases];
        updated.push({ input: '', expectedOutput: '', description: '' });
        onTestCasesChange(updated);
      }}>Agregar caso de prueba</Button>
    </div>
  );
};

export default TestCasesEditor; 