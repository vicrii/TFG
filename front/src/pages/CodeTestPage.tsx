import React from 'react';
import { Container } from 'react-bootstrap';
import CodeTest from '../components/interactive/CodeTest';

const CodeTestPage: React.FC = () => {
  // Ejemplo de una función para sumar dos números
  const initialCode = `function suma(a, b) {
  return a + b;
}

function multiplicar(a, b) {
  return a * b;
}

function esPar(numero) {
  return numero % 2 === 0;
}`;

  const testCases = [
    {
      description: "La función suma debe retornar la suma de dos números positivos",
      input: "suma(2, 3)",
      expectedOutput: "5"
    },
    {
      description: "La función suma debe manejar números negativos",
      input: "suma(-1, 1)",
      expectedOutput: "0"
    },
    {
      description: "La función multiplicar debe retornar el producto de dos números",
      input: "multiplicar(4, 3)",
      expectedOutput: "12"
    },
    {
      description: "La función esPar debe retornar true para números pares",
      input: "esPar(4)",
      expectedOutput: "true"
    },
    {
      description: "La función esPar debe retornar false para números impares",
      input: "esPar(7)",
      expectedOutput: "false"
    }
  ];

  return (
    <Container className="py-4">
      <h1 className="mb-4">Pruebas de Código</h1>
      
      <p className="text-muted mb-4">
        Esta página demuestra cómo funciona el componente de pruebas de código.
        Modifica el código y ejecuta las pruebas para ver los resultados.
      </p>

      <CodeTest
        title="Pruebas de Funciones Matemáticas"
        description="Implementa las funciones suma, multiplicar y esPar según las especificaciones de las pruebas."
        initialCode={initialCode}
        testCases={testCases}
        height={300}
      />

      <CodeTest
        title="Prueba de Algoritmos"
        description="Implementa una función que determine si una cadena es un palíndromo."
        initialCode={`function esPalindromo(texto) {
  // Tu código aquí
  // Retorna true si el texto es un palíndromo, false en caso contrario
}`}
        testCases={[
          {
            description: "Debe identificar un palíndromo simple",
            input: 'esPalindromo("ana")',
            expectedOutput: "true"
          },
          {
            description: "Debe manejar espacios y mayúsculas",
            input: 'esPalindromo("Anita lava la tina")',
            expectedOutput: "true"
          },
          {
            description: "Debe retornar false para textos que no son palíndromos",
            input: 'esPalindromo("hola mundo")',
            expectedOutput: "false"
          }
        ]}
        height={250}
      />
    </Container>
  );
};

export default CodeTestPage; 