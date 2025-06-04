import React, { useState } from 'react';
import { Card, Button, Alert, Badge, Row, Col, Collapse } from 'react-bootstrap';
import { FaPlay, FaCheck, FaTimes } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import { useUI } from '../../context/ThemeContext';
import './CodeTest.css';

interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

interface CodeTestProps {
  title: string;
  description?: string;
  initialCode: string;
  testCases: TestCase[];
  height?: number;
  lessonId?: string;
  exerciseId?: string;
  isCompleted?: boolean;
  onCompleted?: (exerciseId: string) => void;
}

const CodeTest: React.FC<CodeTestProps> = ({
  title,
  description,
  initialCode,
  testCases,
  height = 400,
  lessonId,
  exerciseId,
  isCompleted,
  onCompleted,
}) => {
  const [code, setCode] = useState(initialCode);
  const [testResults, setTestResults] = useState<boolean[]>([]);
  const [testDetails, setTestDetails] = useState<{ result: any; expected: any; passed: boolean; error?: string | null }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  // Función para capturar console.log
  const captureConsole = () => {
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
      originalConsoleLog.apply(console, args);
    };
    return () => {
      console.log = originalConsoleLog;
      return logs;
    };
  };

  const runTests = async () => {
    setIsRunning(true);
    setError(null);
    setConsoleOutput([]);
    const results: boolean[] = [];
    const details: { result: any; expected: any; passed: boolean; error?: string | null }[] = [];

    try {
      for (const testCase of testCases) {
        let testPassed = false;
        let resultValue: any = undefined;
        let expectedValue: any = undefined;
        let testError: string | null = null;

        try {
          // Capturar console.log
          const restoreConsole = captureConsole();

          // Ejecutar el código del usuario con el input del caso de prueba
          const userFunc = new Function(`${code}; return (${testCase.input});`);
          resultValue = userFunc();

          // Obtener los logs
          const logs = restoreConsole();
          if (logs.length > 0) {
            setConsoleOutput(prev => [...prev, ...logs]);
          }

          // Evaluar el valor esperado del caso de prueba
          try {
            expectedValue = eval(`(${testCase.expectedOutput})`);
          } catch (e) {
            expectedValue = testCase.expectedOutput;
          }

          // Comparar resultados
          if (typeof resultValue === 'object' && typeof expectedValue === 'object') {
            testPassed = JSON.stringify(resultValue) === JSON.stringify(expectedValue);
          } else {
            testPassed = resultValue === expectedValue;
          }
        } catch (err) {
          testError = err instanceof Error ? err.message : 'Error desconocido';
          setConsoleOutput(prev => [...prev, `Error: ${testError}`]);
        }

        results.push(testPassed);
        details.push({ 
          result: resultValue, 
          expected: expectedValue, 
          passed: testPassed,
          error: testError 
        });
      }
    } catch (err) {
      setError('Error al ejecutar las pruebas');
      setIsRunning(false);
      return;
    }

    setTestResults(results);
    setTestDetails(details);
    setIsRunning(false);

    // Solo marcar como completado si TODAS las pruebas pasan
    const allTestsPassed = results.every(result => result === true);
    
    if (allTestsPassed && onCompleted && exerciseId) {
      onCompleted(exerciseId);
    } else if (allTestsPassed) {
    } else {
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
  };

  return (
    <Card className="code-test-container shadow-sm mb-4">
      <Card.Header className="bg-dark text-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">{title}</h5>
            <Badge bg="info" className="mt-2">javascript</Badge>
          </div>
          <Button
            variant="success"
            onClick={runTests}
            disabled={isRunning}
            className="d-flex align-items-center"
          >
            {isRunning ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <FaPlay className="me-2" />
            )}
            Ejecutar pruebas
          </Button>
        </div>
      </Card.Header>

      {description && (
        <Card.Body className="border-bottom bg-light">
          <p className="mb-0">{description}</p>
        </Card.Body>
      )}

      <div className="editor-wrapper" style={{ height: `${height}px` }}>
        <Editor
          height="100%"
          language="javascript"
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || '')}
          options={editorOptions}
        />
      </div>

      <Card.Body>
        <h6 className="mb-3">Resultados de las pruebas:</h6>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Row>
          {testCases.map((test, index) => (
            <Col md={6} key={index} className="mb-3">
              <Card className={`test-result-card ${
                testResults[index] === undefined
                  ? ''
                  : testResults[index]
                  ? 'border-success'
                  : 'border-danger'
              } ${testResults.length > 0 ? 'test-complete' : ''}`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Prueba #{index + 1}</h6>
                    {testResults[index] !== undefined && (
                      <div className={`test-status-icon ${testResults[index] ? 'success' : 'failure'}`}>
                        {testResults[index] ? <FaCheck /> : <FaTimes />}
                      </div>
                    )}
                  </div>
                  {test.description && (
                    <p className="text-muted small mb-2">{test.description}</p>
                  )}
                  <div className="small">
                    <strong>Input:</strong> <code>{test.input}</code>
                  </div>
                  <div className="small">
                    <strong>Expected:</strong> <code>{test.expectedOutput}</code>
                  </div>
                  {testResults[index] !== undefined && (
                    <div className="small mt-2">
                      <strong>Tu resultado:</strong> <code>{JSON.stringify(testDetails[index]?.result)}</code>
                      <br />
                      <strong>Esperado:</strong> <code>{JSON.stringify(testDetails[index]?.expected)}</code>
                      {testDetails[index]?.error && (
                        <div className="text-danger mt-1">
                          <strong>Error:</strong> {testDetails[index]?.error}
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Botón para mostrar/ocultar consola */}
        <div className="text-center my-3">
          <Button
            variant="outline-dark"
            size="sm"
            onClick={() => setShowConsole((prev) => !prev)}
          >
            {showConsole ? 'Ocultar consola' : 'Mostrar consola'}
          </Button>
        </div>
        <Collapse in={showConsole}>
          <div>
            <div
              style={{
                background: '#222',
                color: '#eee',
                fontFamily: 'monospace',
                borderRadius: 6,
                padding: 12,
                marginTop: 8,
                marginBottom: 8,
                minHeight: 40,
              }}
            >
              {consoleOutput.length === 0
                ? <span className="text-muted">No hay salida de consola.</span>
                : consoleOutput.map((line, idx) => <div key={idx}>{line}</div>)
              }
            </div>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

export default CodeTest; 