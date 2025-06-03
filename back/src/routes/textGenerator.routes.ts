import express, { Request, Response } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const router = express.Router();

// Inicializar Gemini con API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Función para obtener el modelo de Gemini con fallback
async function getGeminiModel() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    return model;
  } catch (error) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      return model;
    } catch (error) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      return model;
    }
  }
}

/**
 * Endpoint optimizado para generar contenido de lecciones a partir de texto únicamente
 */
router.post('/generate-from-text', async (req: Request, res: Response) => {
  try {
    console.log("Inicio de procesamiento para generación de contenido desde texto");
    
    // Verificar API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("ERROR CRÍTICO: GEMINI_API_KEY no está configurada");
      return res.status(500).json({ 
        message: 'Error de configuración del servidor', 
        error: 'GEMINI_API_KEY no configurada'
      });
    }
    
    const { 
      text, 
      contentType = 'all', 
      numberOfLessons = 3,
      generateAdvancedContent = false,
      difficultyLevel = 'medium'
    } = req.body;

    console.log(`Datos recibidos: texto=${text ? 'proporcionado' : 'no proporcionado'}, tipo=${contentType}, lecciones=${numberOfLessons}, avanzado=${generateAdvancedContent}`);

    if (!text) {
      return res.status(400).json({ message: 'El texto es requerido' });
    }
    
    // Contar palabras del texto
    const wordCount = text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
    if (wordCount < 30) {
      console.warn(`Texto demasiado corto (${wordCount} palabras)`);
      return res.status(400).json({ 
        message: `El texto debe tener al menos 30 palabras. Actualmente tiene ${wordCount} palabras.` 
      });
    }
    
    if (text.length < 50) {
      return res.status(400).json({ message: 'No hay suficiente contenido para generar lecciones' });
    }

    // Validar número de lecciones
    const actualNumberOfLessons = Math.min(10, Math.max(1, numberOfLessons));
    
    try {
      const model = await getGeminiModel();
      if (!model) {
        throw new Error('No se pudo inicializar modelo de Gemini');
      }

      if (generateAdvancedContent && actualNumberOfLessons > 1) {
        // Generar múltiples lecciones avanzadas
        console.log(`Generando ${actualNumberOfLessons} lecciones avanzadas...`);
        const lessons = await generateMultipleLessons(text, contentType, actualNumberOfLessons, difficultyLevel);
        
        return res.json({
          title: `Curso generado desde texto - ${new Date().toLocaleDateString()}`,
          transcription: text,
          summary: generateSummary(text),
          lessons: lessons,
          status: 'success'
        });
      } else {
        // Generar lección simple
        console.log("Generando lección simple...");
        const lesson = await generateSingleLesson(text, contentType, difficultyLevel);
        
        return res.json({
          title: `Lección generada desde texto - ${new Date().toLocaleDateString()}`,
          transcription: text,
          summary: generateSummary(text),
          lessons: [lesson],
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Error en la generación:', error);
      return res.status(500).json({ 
        message: 'Error al generar el contenido',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

function generateSummary(text: string): string {
  // Generar un resumen simple del texto
  const words = text.split(' ');
  if (words.length <= 50) return text;
  
  const summary = words.slice(0, 50).join(' ') + '...';
  return `Resumen: ${summary}`;
}

async function generateSingleLesson(
  text: string, 
  contentType: 'all' | 'quiz' | 'code' | 'content',
  difficultyLevel: string
) {
  const model = await getGeminiModel();
  
  const result: any = {
    title: 'Lección generada desde texto',
    content: '',
    quizQuestions: [],
    codeExercises: []
  };

  // Generar contenido
  if (contentType === 'all' || contentType === 'content') {
    const contentPrompt = `
      Eres un experto educador. Crea contenido educativo en HTML a partir de este texto:
      
      ${text}
      
      Incluye:
      1. Introducción atractiva
      2. Objetivos de aprendizaje (3-4 puntos)
      3. Contenido principal bien estructurado
      4. Conclusiones
      
      Usa HTML semántico y estilos inline para hacerlo atractivo.
    `;
    
    try {
      const response = await model.generateContent(contentPrompt);
      result.content = response.response.text() || 'Contenido educativo basado en el texto proporcionado.';
    } catch (error) {
      result.content = '<h2>Contenido Educativo</h2><p>Contenido generado automáticamente desde el texto proporcionado.</p>';
    }
  }

  // Generar quiz
  if (contentType === 'all' || contentType === 'quiz') {
    const quizPrompt = `
      Crea 3 preguntas de opción múltiple basadas en este texto:
      ${text.substring(0, 500)}
      
      Devuelve SOLO este JSON:
      [
        {
          "question": "¿Pregunta aquí?",
          "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
          "correctAnswerIndex": 0
        }
      ]
    `;
    
    try {
      const response = await model.generateContent(quizPrompt);
      const quizText = response.response.text();
      const jsonMatch = quizText.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        result.quizQuestions = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('Error generando quiz:', error);
    }
  }

  return result;
}

async function generateMultipleLessons(
  text: string, 
  contentType: 'all' | 'quiz' | 'code' | 'content',
  numberOfLessons: number,
  difficultyLevel: string
) {
  const model = await getGeminiModel();
  
  // Primero dividir el contenido en lecciones
  const lessonsPrompt = `
    Divide este contenido en ${numberOfLessons} lecciones coherentes:
    
    ${text}
    
    Devuelve SOLO este JSON:
    [
      {
        "title": "Título Lección 1",
        "content": "<h2>Título</h2><p>Contenido educativo detallado...</p>"
      }
    ]
  `;
  
  try {
    const response = await model.generateContent(lessonsPrompt);
    const lessonsText = response.response.text();
    const jsonMatch = lessonsText.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      const lessons = JSON.parse(jsonMatch[0]);
      
      // Añadir quiz y ejercicios a cada lección si es necesario
      for (let lesson of lessons) {
        lesson.quizQuestions = [];
        lesson.codeExercises = [];
        
        if (contentType === 'all' || contentType === 'quiz') {
          // Generar quiz simple
          lesson.quizQuestions = [{
            question: `¿Cuál es el punto principal de: ${lesson.title}?`,
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
            correctAnswerIndex: 0
          }];
        }
      }
      
      return lessons;
    }
  } catch (error) {
    console.error('Error generando múltiples lecciones:', error);
  }
  
  // Fallback: crear lecciones básicas
  const fallbackLessons = [];
  for (let i = 0; i < numberOfLessons; i++) {
    fallbackLessons.push({
      title: `Lección ${i + 1}`,
      content: `<h2>Lección ${i + 1}</h2><p>Contenido educativo basado en el texto proporcionado.</p>`,
      quizQuestions: [],
      codeExercises: []
    });
  }
  
  return fallbackLessons;
}

// Ruta para generar preguntas de quiz a partir del contenido de una lección
router.post('/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { content, difficulty = 'medium', numberOfQuestions = 3 } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Se requiere el contenido para generar preguntas' });
    }

    console.log('Generando preguntas de quiz para contenido...');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no está configurada' });
    }

    const model = await getGeminiModel();
    if (!model) {
      throw new Error('No se pudo inicializar modelo de Gemini');
    }

    const prompt = `Basándote en el siguiente contenido de una lección, genera ${numberOfQuestions} preguntas tipo test/quiz con 4 opciones cada una (una correcta y tres incorrectas).
    
Nivel de dificultad: ${difficulty}

Contenido de la lección:
---
${content.substring(0, 1000)}
---

Genera las preguntas en formato JSON con la siguiente estructura exacta:

[
  {
    "question": "¿Texto de la pregunta 1?",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswerIndex": 0
  },
  {
    "question": "¿Texto de la pregunta 2?",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswerIndex": 2
  }
]

IMPORTANTE: 
- Devuelve ÚNICAMENTE el array JSON, sin texto adicional
- correctAnswerIndex debe ser el índice (0-3) de la opción correcta
- Las preguntas deben ser relevantes al contenido
- Las opciones incorrectas deben ser plausibles pero claramente incorrectas`;

    console.log('Enviando prompt a Gemini para generar preguntas...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text();
    
    // Limpiar posible markdown y extraer JSON
    jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();
    console.log('Respuesta recibida:', jsonText.substring(0, 200) + '...');
    
    // Buscar el array JSON en la respuesta
    const jsonMatch = jsonText.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error('No se encontró formato JSON válido en la respuesta');
    }
    
    const questionsJson = jsonMatch[0];
    const questions = JSON.parse(questionsJson);
    
    // Validar estructura
    if (!Array.isArray(questions) || !questions.every(q => 
      typeof q.question === 'string' && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswerIndex === 'number' &&
      q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3)) {
      throw new Error('Estructura de preguntas inválida');
    }
    
    console.log(`${questions.length} preguntas generadas exitosamente`);
    res.json({ questions });
    
  } catch (error: any) {
    console.error('Error al generar preguntas de quiz:', error);
    res.status(500).json({
      error: error.message || 'Error desconocido al generar preguntas',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 