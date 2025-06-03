import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { FaPlay, FaCheck, FaTimes, FaCode, FaLightbulb, FaRedo } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';
import { useUI } from '../../context/ThemeContext';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  title: string;
  description?: string;
  expectedOutput?: string;
  hint?: string;
  solution?: string;
  readOnly?: boolean;
  height?: number;
  validateCode?: (code: string) => Promise<boolean>;
  theme?: 'vs-dark' | 'light';
  onCodeChange?: (code: string) => void;
  onSuccess?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  language,
  title,
  description,
  expectedOutput,
  hint,
  solution,
  readOnly = false,
  height = 300,
  validateCode,
  theme: propTheme,
  onCodeChange,
  onSuccess
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Usar el tema del editor de código configurado por el usuario
  const { codeEditorTheme } = useUI();
  // Si se proporciona un tema específico, se usa ese, de lo contrario se usa el tema del usuario
  const editorTheme = propTheme || codeEditorTheme;

  useEffect(() => {
    // Reset state when initialCode changes
    setCode(initialCode);
    setOutput('');
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage('');
    setShowHint(false);
    setShowSolution(false);
  }, [initialCode]);

  const handleEditorChange = (value: string) => {
    setCode(value);
    if (onCodeChange) {
      onCodeChange(value);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setIsError(false);
    setErrorMessage('');

    try {
  
      // Para propósitos de demostración, simulamos diferentes comportamientos según el lenguaje
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular tiempo de ejecución
      
      let simulatedOutput = '';
      
      if (language === 'javascript' || language === 'typescript') {
        try {
          // ADVERTENCIA: Esto es solo para demo. NUNCA ejecute código del usuario en el frontend en producción
          // En una app real, el código se enviaría a un backend con sandbox
          const consoleOutput: string[] = [];
          const originalConsoleLog = console.log;
          
          // Interceptar console.log
          console.log = (...args) => {
            consoleOutput.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '));
          };
          
          // Ejecutar el código con seguridad
          const safeCode = code.replace(/document|window|localStorage|sessionStorage|fetch|XMLHttpRequest/g, 'undefined');
          // eslint-disable-next-line no-new-func
          new Function(safeCode)();
          
          // Restaurar console.log
          console.log = originalConsoleLog;
          
          simulatedOutput = consoleOutput.join('\n');
        } catch (e) {
          if (e instanceof Error) {
            throw new Error(`Error de ejecución: ${e.message}`);
          } else {
            throw new Error('Error desconocido durante la ejecución');
          }
        }
      } else if (language === 'rust') {
        // Simular salida de código Rust
        if (code.includes('println!')) {
          simulatedOutput = 'Output simulado para Rust:\n';
          
          // Extraer cadenas de texto de llamadas a println!
          const printMatches = code.match(/println!\s*\(\s*"([^"]*)"/g);
          if (printMatches) {
            printMatches.forEach(match => {
              const text = match.match(/"([^"]*)"/)?.[1] || '';
              simulatedOutput += text + '\n';
            });
          } else {
            simulatedOutput += 'No se detectaron llamadas a println!';
          }
        } else {
          simulatedOutput = 'El código compiló correctamente, pero no produjo salida visible.';
        }
      } else {
        simulatedOutput = `Simulación de ejecución para ${language}:\nExitoso! (Nota: Esta es una simulación)`;
      }
      
      setOutput(simulatedOutput);
    } catch (error) {
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsRunning(false);
    }
  };

  const handleValidate = async () => {
    if (!validateCode) return;
    
    setIsValidating(true);
    setIsSuccess(false);
    setIsError(false);
    
    try {
      const result = await validateCode(code);
      setIsSuccess(result);
      
      if (result && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Error durante la validación');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput('');
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage('');
  };

  const editorOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: readOnly,
    cursorStyle: 'line' as const,
    automaticLayout: true,
    minimap: {
      enabled: false
    }
  };

  return (
    <Card className="code-editor-container shadow-sm border-0 mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center py-3 bg-dark text-white">
        <div className="d-flex align-items-center">
          <h5 className="mb-0">{title}</h5>
          <Badge bg="info" className="ms-2">{language}</Badge>
        </div>
        {!readOnly && (
          <div className="editor-controls">
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleReset}
              className="me-2"
              title="Reiniciar código"
            >
              <FaRedo />
            </Button>
            {hint && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="me-2"
                title="Ver pista"
              >
                <FaLightbulb />
              </Button>
            )}
            {solution && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => setShowSolution(!showSolution)}
                className="me-2"
                title="Ver solución"
              >
                <FaCode />
              </Button>
            )}
          </div>
        )}
      </Card.Header>

      {description && (
        <Card.Body className="border-bottom py-3 bg-light">
          <p className="mb-0">{description}</p>
        </Card.Body>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-0 editor-tabs"
        fill
      >
        <Tab eventKey="editor" title="Editor">
          <div className="editor-wrapper" style={{ height: `${height}px` }}>
            <Editor
              width="100%"
              height={height}
              language={language}
              theme={editorTheme}
              value={code}
              options={editorOptions}
              onChange={(value) => handleEditorChange(value || '')}
            />
          </div>
        </Tab>
        {output && (
          <Tab eventKey="output" title="Resultado">
            <div className="output-container p-3" style={{ height: `${height}px`, overflow: 'auto', backgroundColor: '#1e1e1e', color: 'white', fontFamily: 'monospace' }}>
              <pre className="mb-0">{output}</pre>
            </div>
          </Tab>
        )}
      </Tabs>

      {showHint && (
        <Alert variant="warning" className="m-3 mb-0">
          <strong>Pista:</strong> {hint}
        </Alert>
      )}

      {showSolution && (
        <div className="solution-container m-3 mb-0">
          <Alert variant="info">
            <strong>Solución:</strong>
          </Alert>
          <div style={{ height: '200px' }}>
            <Editor
              width="100%"
              height={200}
              language={language}
              theme={editorTheme}
              value={solution}
              options={{
                readOnly: true,
                selectOnLineNumbers: true,
                roundedSelection: false,
                cursorStyle: 'line' as const,
                automaticLayout: true,
                minimap: {
                  enabled: false
                }
              }}
            />
          </div>
        </div>
      )}

      {isSuccess && (
        <Alert variant="success" className="m-3 mb-0">
          <FaCheck className="me-2" /> ¡Correcto! Tu código ha pasado la validación.
        </Alert>
      )}

      {isError && (
        <Alert variant="danger" className="m-3 mb-0">
          <FaTimes className="me-2" /> {errorMessage || 'Ha ocurrido un error en tu código.'}
        </Alert>
      )}

      {expectedOutput && (
        <div className="expected-output p-3 border-top">
          <strong>Salida esperada:</strong>
          <pre className="mt-2 mb-0 expected-output-pre">{expectedOutput}</pre>
        </div>
      )}

      <Card.Footer className="d-flex justify-content-between py-3">
        <Button
          variant="primary"
          onClick={handleRun}
          disabled={isRunning || readOnly}
          className="d-flex align-items-center"
        >
          {isRunning ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Ejecutando...
            </>
          ) : (
            <>
              <FaPlay className="me-2" /> Ejecutar código
            </>
          )}
        </Button>

        {validateCode && (
          <Button
            variant={isSuccess ? "success" : "outline-primary"}
            onClick={handleValidate}
            disabled={isValidating || readOnly}
            className="d-flex align-items-center"
          >
            {isValidating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Validando...
              </>
            ) : (
              <>
                {isSuccess ? <FaCheck className="me-2" /> : null} Validar
              </>
            )}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default CodeEditor; 