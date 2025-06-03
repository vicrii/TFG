import React, { useState } from 'react';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { FaCode, FaSave } from 'react-icons/fa';
import CodeEditor from '../../components/interactive/CodeEditor';

const TestEditor: React.FC = () => {
  const [code, setCode] = useState<string>('// Escribe tu código de prueba aquí\nconsole.log("Hola mundo!");');
  const [savedCode, setSavedCode] = useState<string>('');
  const [showSavedAlert, setShowSavedAlert] = useState<boolean>(false);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSaveCode = () => {
    setSavedCode(code);
    setShowSavedAlert(true);
    setTimeout(() => setShowSavedAlert(false), 3000);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <FaCode className="me-2" /> 
        Editor de pruebas
      </h1>
      
      <p className="text-muted mb-4">
        Usa este editor para probar código JavaScript/TypeScript rápidamente.
        El código se ejecuta en el navegador de forma segura.
      </p>
      
      {showSavedAlert && (
        <Alert variant="success" dismissible onClose={() => setShowSavedAlert(false)}>
          ¡Código guardado exitosamente!
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Editor de código</h5>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSaveCode}
            className="d-flex align-items-center"
          >
            <FaSave className="me-2" /> Guardar
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          <CodeEditor
            initialCode={code}
            language="typescript"
            title="Editor de pruebas"
            height={400}
            onCodeChange={handleCodeChange}
          />
        </Card.Body>
      </Card>
      
      {savedCode && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Código guardado</h5>
          </Card.Header>
          <Card.Body>
            <pre className="mb-0">{savedCode}</pre>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TestEditor; 