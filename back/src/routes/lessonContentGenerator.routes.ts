import express, { Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const router = express.Router();

// Inicializar Gemini con API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Función para obtener el modelo de Gemini con fallback
async function getGeminiModel() {
  try {
    // Intentar con Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    return model;
  } catch (error) {
    try {
      // Intentar con Gemini 2.0 Flash Experimental
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-experimental" });
      return model;
    } catch (error) {
      try {
        // Intentar con Gemini 2.0 Flash Lite
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        return model;
      } catch (error) {
        try {
          // Intentar con Gemini 1.5 Flash
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          return model;
        } catch (error) {
          // Último intento con Gemini 1.5 Flash 8B
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
          return model;
        }
      }
    }
  }
}

/**
 * Endpoint para generar contenido de lecciones a partir de un video de YouTube o texto
 * 
 * Recibe: 
 * - youtubeUrl: URL del video (opcional si se proporciona text)
 * - text: Texto para generar contenido (opcional si se proporciona youtubeUrl)
 * - contentType: 'all', 'quiz' o 'code'
 * - lessonTitle: título de la lección (opcional)
 * - generateMultipleLessons: indica si se deben generar múltiples lecciones
 * - numberOfLessons: número de lecciones a generar (máximo 15)
 * - generateAdvancedContent: indica si se debe generar contenido avanzado
 * 
 * Devuelve:
 * Para una lección:
 * - content: contenido textual de la lección
 * - quizQuestions: preguntas de quiz generadas
 * - codeExercises: ejercicios de código generados
 * 
 * Para múltiples lecciones:
 * - lessons: array de objetos lección con el formato anterior
 */
router.post('/generate-lesson-content', async (req: Request, res: Response) => {
  try {
    console.log("Inicio de procesamiento para generación de contenido");
    
    // Verificar API keys al inicio
    if (!process.env.GEMINI_API_KEY) {
      console.error("ERROR CRÍTICO: GEMINI_API_KEY no está configurada en las variables de entorno");
      return res.status(500).json({ 
        message: 'Error de configuración del servidor', 
        error: 'GEMINI_API_KEY no configurada'
      });
    }
    
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn("ADVERTENCIA: YOUTUBE_API_KEY no está configurada, la extracción de transcripciones de YouTube será simulada");
    }
    
    const { 
      youtubeUrl, 
      text, 
      contentType = 'all', 
      lessonTitle = null,
      generateMultipleLessons = false,
      numberOfLessons = 1,
      generateAdvancedContent = false
    } = req.body;

    console.log(`Datos recibidos: URL=${youtubeUrl || 'no proporcionada'}, text=${text ? 'proporcionado' : 'no proporcionado'}, tipo=${contentType}, título=${lessonTitle || 'no proporcionado'}, generarMúltiples=${generateMultipleLessons}, cantidad=${numberOfLessons}, generarAvanzado=${generateAdvancedContent}`);

    // Validación adicional del tipo de contenido
    if (!['all', 'quiz', 'code', 'content'].includes(contentType)) {
      console.error(`Tipo de contenido inválido: ${contentType}`);
      return res.status(400).json({ message: 'Tipo de contenido inválido. Debe ser "all", "quiz", "code" o "content"' });
    }
    
    // Validar número de lecciones
    const actualNumberOfLessons = Math.min(15, Math.max(1, numberOfLessons));
    if (actualNumberOfLessons !== numberOfLessons) {
      console.warn(`Número de lecciones ajustado: ${numberOfLessons} -> ${actualNumberOfLessons}`);
    }
    
    if (!youtubeUrl && !text) {
      console.error("No se proporcionó URL de YouTube ni texto");
      return res.status(400).json({ message: 'URL de YouTube o texto son requeridos' });
    }

    let inputContent = '';

    // Si se proporciona URL de YouTube, obtener transcripción
    if (youtubeUrl) {
      console.log("Procesando video de YouTube");
      try {
        // Extraer el ID del video de YouTube
        let videoId = '';
        if (youtubeUrl.includes('youtube.com/watch?v=')) {
          videoId = new URL(youtubeUrl).searchParams.get('v') || '';
        } else if (youtubeUrl.includes('youtu.be/')) {
          videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || '';
        }
        
        if (!videoId) {
          console.error(`URL de YouTube inválida: ${youtubeUrl}`);
          return res.status(400).json({ message: 'URL de YouTube inválida' });
        }
        
        console.log(`ID del video de YouTube: ${videoId}`);
        
        // Usar la API de YouTube para obtener detalles del video
        try {
          const transcription = await getYouTubeTranscription(videoId);
          inputContent = transcription;
        } catch (error) {
          console.error('Error específico obteniendo la transcripción:', error);
          return res.status(500).json({ 
            message: 'Error al obtener la transcripción del video',
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      } catch (error) {
        console.error('Error general procesando el video:', error);
        return res.status(500).json({ 
          message: 'Error al procesar el video de YouTube',
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    } else if (text) {
      // Usar el texto proporcionado directamente
      console.log("Usando texto proporcionado como entrada");
      
      // Contar palabras del texto
      const wordCount = text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      if (wordCount < 30) {
        console.warn(`Texto proporcionado demasiado corto (${wordCount} palabras, mínimo 30 requeridas)`);
        return res.status(400).json({ 
          message: `El texto debe tener al menos 30 palabras. Actualmente tiene ${wordCount} palabras.` 
        });
      }
      
      inputContent = text;
    }

    if (inputContent.length < 50) {
      console.error(`Contenido insuficiente para generar lecciones (${inputContent.length} caracteres)`);
      return res.status(400).json({ message: 'No hay suficiente contenido para generar lecciones' });
    }

    try {
      // Obtener el modelo de Gemini
      const model = await getGeminiModel();
      if (!model) {
        throw new Error('No se pudo inicializar ningún modelo de Gemini');
      }

      if (generateMultipleLessons || generateAdvancedContent) {
        // Generar múltiples lecciones
        console.log(`Generando ${actualNumberOfLessons} lecciones...`);
        const multipleLessons = await generateMultipleLessonsContent(
          inputContent,
          contentType,
          lessonTitle || 'Lección',
          actualNumberOfLessons
        );

        console.log(`${multipleLessons.length} lecciones generadas correctamente`);
        
        // Generar título y resumen para el curso
        const courseTitle = lessonTitle || `Curso generado desde texto - ${new Date().toLocaleDateString()}`;
        const courseSummary = inputContent.substring(0, 300) + (inputContent.length > 300 ? '...' : '');
        
        // Devolver en formato TranscriptionResult
        return res.json({
          title: courseTitle,
          transcription: inputContent,
          summary: courseSummary,
          lessons: multipleLessons,
          status: 'success'
        });
      } else {
        // Generar una sola lección (comportamiento original)
        const generatedContent = await generateContent(
          inputContent,
          contentType,
          lessonTitle || 'Lección'
        );

        console.log("Contenido generado correctamente");
        
        // Devolver en formato TranscriptionResult
        const courseTitle = lessonTitle || `Lección generada desde texto - ${new Date().toLocaleDateString()}`;
        const courseSummary = generatedContent.content || inputContent.substring(0, 300) + (inputContent.length > 300 ? '...' : '');
        
        return res.json({
          title: courseTitle,
          transcription: inputContent,
          summary: courseSummary,
          lessons: [generatedContent],
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Error en la generación de contenido:', error);
      return res.status(500).json({ 
        message: 'Error al generar el contenido',
        error: error instanceof Error ? error.message : 'Error desconocido en generación'
      });
    }
  } catch (error) {
    console.error('Error general en generate-lesson-content:', error);
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Extrae el ID del video de YouTube de una URL
 */
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Obtiene información básica del video de YouTube
 */
async function getVideoInfo(videoId: string) {
  // En una implementación real, usaríamos YouTube API
  // Para este ejemplo, simularemos la respuesta
  return {
    title: `Lección sobre el video ${videoId}`,
    description: 'Descripción del video obtenida mediante la API de YouTube',
    duration: '10:30'
  };
}

/**
 * Simulación de transcripción del video
 */
async function simulateTranscription(videoId: string): Promise<string> {
  // En una implementación real, descargaríamos el audio y lo transcribiríamos
  // Para este ejemplo, devolvemos un texto de muestra
  return `
    Bienvenidos a esta lección sobre programación. Hoy hablaremos sobre cómo crear aplicaciones web
    utilizando JavaScript y React. Primero veremos los conceptos básicos de componentes, luego
    aprenderemos sobre el estado y las propiedades, y finalmente implementaremos un pequeño proyecto.
    
    React es una biblioteca para construir interfaces de usuario. Fue creada por Facebook y es ampliamente
    utilizada en la industria. Los componentes son la base de React y permiten dividir la interfaz en
    piezas independientes y reutilizables.
    
    En la segunda parte de la lección, veremos cómo trabajar con estado y efectos. El estado nos permite
    almacenar y actualizar datos dentro de un componente, mientras que los efectos nos permiten 
    realizar operaciones secundarias como peticiones a API.
  `;
}

/**
 * Obtiene la transcripción de un video de YouTube
 */
async function getYouTubeTranscription(videoId: string): Promise<string> {
  try {
    console.log("Obteniendo transcripción de YouTube...");
    // Esta es una simulación, en una implementación real se usaría la API de YouTube 
    // o un servicio de terceros para obtener la transcripción.
    
    // Obtener detalles del vídeo desde la API de datos de YouTube
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API key no configurada en las variables de entorno');
    }
    
    const videoResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
    );
    
    const videoData = videoResponse.data;
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('No se encontró información del video');
    }
    
    const videoTitle = videoData.items[0].snippet.title;
    const videoDescription = videoData.items[0].snippet.description;
    
    console.log(`Título del video: ${videoTitle}`);
    
    // En una implementación real, obtendríamos la transcripción completa aquí.
    // Para simular, usamos el título y descripción.
    const mockTranscription = `
      Título: ${videoTitle}
      
      Descripción: ${videoDescription}
      
      Este es el contenido simulado de la transcripción del video.
      En una implementación real, aquí estaría el texto completo transcrito del video.
      La transcripción contendría todo el contenido hablado y posiblemente los subtítulos del video.
    `;
    
    return mockTranscription;
  } catch (error) {
    console.error('Error al obtener la transcripción:', error);
    throw new Error(`Error al obtener la transcripción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera contenido para la lección usando Gemini
 */
async function generateContent(
  inputContent: string,
  contentType: 'all' | 'quiz' | 'code' | 'content',
  lessonTitle: string
) {
  try {
    console.log("Generando contenido de lección...");
    
    // Resultado que se devolverá con valores predeterminados mejorados
    const result: {
      content?: string;
      quizQuestions: any[];
      codeExercises: any[];
    } = {
      content: '',
      quizQuestions: [],
      codeExercises: []
    };
    
    // Configuración de seguridad de Gemini
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];
    
    console.log("Obteniendo modelo Gemini...");
    // Obtener el modelo disponible a través de la función de fallback
    const model = await getGeminiModel();
    if (!model) {
      throw new Error('No se pudo inicializar ningún modelo de Gemini');
    }
    
    // Generar contenido educativo cuando sea requerido
    if (contentType === 'all' || contentType === 'content') {
      console.log("Generando contenido educativo principal...");
      const contentPrompt = `
        Eres un experto en educación y diseño de cursos online. Vas a crear contenido educativo detallado y atractivo a partir del siguiente texto para una lección titulada "${lessonTitle}".
        
        Texto base:
        ${inputContent}
        
        Crea contenido educativo completo en formato HTML que incluya:
        
        1. **Introducción atractiva** (con título h2)
           - Gancho inicial para captar la atención
           - Breve resumen de lo que aprenderán
        
        2. **Objetivos de aprendizaje** (lista con viñetas)
           - 3-4 objetivos específicos y medibles
        
        3. **Contenido principal** (con subtítulos h3)
           - Explicaciones detalladas y claras
           - Ejemplos prácticos y casos de uso
           - Conceptos clave resaltados en <strong>
           - Diagramas o imágenes sugeridas con <em>
        
        4. **Ejercicios de reflexión** (caja destacada)
           - Preguntas para que el estudiante reflexione
           - Actividades prácticas sugeridas
        
        5. **Resumen y conclusiones**
           - Puntos clave resumidos
           - Conexión con lecciones futuras
        
        6. **Recursos adicionales**
           - Enlaces relevantes
           - Lecturas recomendadas
        
        Usa HTML semántico con estilos inline para hacerlo visualmente atractivo:
        - <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;"> para cajas destacadas
        - <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0;"> para consejos
        - <blockquote style="border-left: 3px solid #007bff; padding-left: 15px; font-style: italic;"> para citas importantes
        
        El contenido debe ser de al menos 800-1200 palabras, educativo, atractivo y bien estructurado.
        No uses etiquetas <html>, <body>, <head>, etc. Solo el contenido HTML del cuerpo.
      `;
      
      try {
        const contentResponse = await model.generateContent(contentPrompt);
        const contentResult = await contentResponse.response;
        const generatedText = contentResult.text();
        
        if (generatedText && generatedText.trim().length > 200) {
          result.content = generatedText;
          console.log(`Contenido educativo generado: ${generatedText.length} caracteres`);
        } else {
          console.warn("El modelo generó contenido insuficiente, creando contenido de respaldo");
          result.content = `
            <h2>${lessonTitle}</h2>
            <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <h3>📚 Objetivos de aprendizaje</h3>
              <ul>
                <li>Comprender los conceptos principales del tema</li>
                <li>Aplicar los conocimientos en situaciones prácticas</li>
                <li>Desarrollar habilidades de análisis crítico</li>
              </ul>
            </div>
            
            <h3>Introducción</h3>
            <p>En esta lección exploraremos conceptos fundamentales que te ayudarán a desarrollar una comprensión sólida del tema tratado.</p>
            
            <h3>Contenido principal</h3>
            <p><strong>Concepto clave:</strong> Los temas que cubriremos en esta lección son esenciales para tu desarrollo profesional y académico.</p>
            
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0;">
              <strong>💡 Consejo:</strong> Toma notas mientras avanzas y practica los conceptos regularmente.
            </div>
            
            <h3>Conclusiones</h3>
            <p>Esta lección proporciona las bases necesarias para continuar con el siguiente nivel de aprendizaje.</p>
            
            <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>📖 Recursos adicionales</h4>
              <p>Te recomendamos explorar recursos adicionales para profundizar en estos temas.</p>
            </div>
          `;
        }
      } catch (error) {
        console.error("Error al generar contenido principal:", error);
        result.content = `
          <h2>${lessonTitle}</h2>
          <div style="background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <p><strong>⚠️ Nota:</strong> El contenido de esta lección está siendo procesado. Inténtalo de nuevo en unos momentos.</p>
          </div>
        `;
      }
    }
    
    if (contentType === 'all' || contentType === 'quiz') {
      // Generar preguntas de quiz
      console.log("Generando preguntas de quiz...");
      const quizPrompt = `
        Eres un especialista en educación. Crea 3-5 preguntas de opción múltiple basadas en el siguiente texto para una lección titulada "${lessonTitle}".
        
        Texto base:
        ${inputContent}
        
        Genera preguntas que evalúen la comprensión del contenido.
        
        Devuelve ÚNICAMENTE un array JSON válido con este formato exacto:
        [
          {
            "question": "¿Pregunta 1?",
            "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
            "correctAnswerIndex": 0
          },
          {
            "question": "¿Pregunta 2?",
            "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
            "correctAnswerIndex": 2
          }
        ]
        
        No incluyas ningún texto adicional, solo el array JSON sin variables ni asignaciones.
      `;
      
      const quizResponse = await model.generateContent(quizPrompt);
      const quizResult = await quizResponse.response;
      const quizText = quizResult.text();
      
      // Extraer JSON del texto devuelto
      const jsonMatch = quizText.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[0];
          result.quizQuestions = JSON.parse(jsonString);
          console.log(`Generadas ${result.quizQuestions.length} preguntas de quiz`);
        } catch (error) {
          console.error("Error al parsear las preguntas de quiz:", error);
          // Si hay error, crear un array vacío
          result.quizQuestions = [];
        }
      } else {
        console.error("No se pudo extraer JSON de la respuesta");
        result.quizQuestions = [];
      }
    }
    
    if (contentType === 'all' || contentType === 'code') {
      // Generar ejercicios de código
      console.log("Generando ejercicios de código...");
      const codePrompt = `
        Eres un experto en programación educativa. Crea 2-3 ejercicios de código en JavaScript basados en el siguiente texto para una lección titulada "${lessonTitle}".
        
        **RESTRICCIONES IMPORTANTES:**
        - USA SOLO JavaScript puro (vanilla JavaScript), NO uses librerías externas
        - NO uses import/require de librerías (React, lodash, jQuery, etc.)
        - NO uses módulos ES6 externos
        - USA ÚNICAMENTE las funciones nativas del navegador y JavaScript estándar
        - El código debe ejecutarse en Monaco Editor sin dependencias externas
        - Usa console.log() para mostrar resultados
        - Si necesitas utilidades, impleméntalas dentro del mismo ejercicio
        
        Texto base:
        ${inputContent}
        
        Genera ejercicios prácticos que ayuden a aplicar los conceptos usando ÚNICAMENTE JavaScript estándar.
        
        Para cada ejercicio, incluye un array de testCases con al menos 2 casos de prueba. Cada testCase debe tener:
          - input: el código o llamada a función que el usuario debe probar
          - expectedOutput: el resultado esperado de esa entrada
          - description: breve explicación del caso de prueba
        
        Devuelve ÚNICAMENTE un array JSON válido con este formato exacto:
        [
          {
            "id": "exercise1",
            "title": "Título del ejercicio 1",
            "description": "Descripción de lo que debe hacer el usuario",
            "language": "javascript",
            "initialCode": "// Código inicial\nconsole.log('Completa el código aquí');\n",
            "solution": "// Solución completa usando SOLO JavaScript puro\nconst resultado = 'Código completado';\nconsole.log(resultado);\n",
            "hint": "Pista para ayudar al usuario",
            "expectedOutput": "Código completado",
            "testCases": [
              { "input": "miFuncion(2, 3)", "expectedOutput": "5", "description": "Suma de 2 y 3" },
              { "input": "miFuncion(0, 0)", "expectedOutput": "0", "description": "Suma de ceros" }
            ]
          }
        ]
        
        No incluyas ningún texto adicional, solo el array JSON sin variables ni asignaciones.
      `;
      let codeText = '';
      let codeError = null;
      let codeModel = model;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const codeResponse = await codeModel.generateContent(codePrompt);
          const codeResult = await codeResponse.response;
          codeText = codeResult.text();
          codeError = null;
          break; // Éxito, salir del bucle
        } catch (error) {
          codeError = error;
          console.error(`Error al generar ejercicios de código (intento ${attempt + 1}):`, error);
          // Si es un error de overload, intenta con otro modelo
          codeModel = await getGeminiModel();
        }
      }
      if (codeError) {
        console.error("No se pudo generar ejercicios de código tras varios intentos:", codeError);
        result.codeExercises = [];
      } else {
        // Extraer JSON del texto devuelto
        const codeJsonMatch = codeText.match(/\[\s*\{.*\}\s*\]/s);
        if (codeJsonMatch) {
          try {
            const codeJsonString = codeJsonMatch[0];
            result.codeExercises = JSON.parse(codeJsonString);
            console.log(`Generados ${result.codeExercises.length} ejercicios de código`);
          } catch (error) {
            console.error("Error al parsear los ejercicios de código:", error);
            result.codeExercises = [];
          }
        } else {
          console.error("No se pudo extraer JSON de la respuesta");
          result.codeExercises = [];
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error generando contenido con Gemini:", error);
    throw new Error(`Error generando contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Genera múltiples lecciones a partir de un contenido usando Gemini
 */
async function generateMultipleLessonsContent(
  inputContent: string,
  contentType: 'all' | 'quiz' | 'code' | 'content',
  baseLessonTitle: string,
  numberOfLessons: number
): Promise<Array<{
  title: string;
  content?: string;
  quizQuestions?: any[];
  codeExercises?: any[];
}>> {
  try {
    console.log(`Iniciando generación de ${numberOfLessons} lecciones con tipo: ${contentType}...`);
    
    // Configuración de seguridad de Gemini
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];
    
    console.log("Obteniendo modelo Gemini...");
    // Obtener el modelo disponible a través de la función de fallback
    const model = await getGeminiModel();
    if (!model) {
      throw new Error('No se pudo inicializar ningún modelo de Gemini');
    }
    
    // Paso 1: Dividir contenido en lecciones básicas
    const multiLessonPrompt = `
      Eres un experto en educación. Divide el siguiente contenido en ${numberOfLessons} lecciones secuenciales para un curso titulado "${baseLessonTitle}".
      Para cada lección, genera un objeto con:
      - "title": título de la lección
      - "content": contenido principal de la lección en HTML educativo (introducción, puntos clave, explicación, conclusión). El contenido debe ser claro, útil y NO puede ser un placeholder ni estar vacío. No uses frases como 'contenido por definir', 'en desarrollo', ni similares. Si no tienes suficiente información, haz una síntesis educativa del tema.
      Devuelve ÚNICAMENTE un array JSON válido con este formato exacto:
      [
        {
          "title": "Título de la Lección 1",
          "content": "<h2>...</h2><p>...</p>"
        },
        {
          "title": "Título de la Lección 2",
          "content": "<h2>...</h2><p>...</p>"
        }
      ]
      No incluyas ningún texto adicional, solo el array JSON.
      
      Contenido original:
      ${inputContent}
    `;
    
    const multiLessonResponse = await model.generateContent(multiLessonPrompt);
    const multiLessonResult = await multiLessonResponse.response;
    const multiLessonText = multiLessonResult.text();
    
    // Extraer JSON del texto devuelto
    const jsonMatch = multiLessonText.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      console.error("No se pudo extraer JSON de la respuesta de lecciones múltiples");
      throw new Error("Error al generar el contenido de las lecciones");
    }
    
    let lessons;
    try {
      const jsonString = jsonMatch[0];
      lessons = JSON.parse(jsonString);
      // Si alguna lección tiene contenido vacío o genérico, pon un mensaje claro
      lessons = lessons.map((l: any) => ({
        ...l,
        content: l.content && l.content.trim() && !/por definir|en desarrollo|vacío|placeholder/i.test(l.content) ? l.content : `<p>Contenido no disponible. Por favor, revisa el video o el texto original para más información.</p>`,
        quizQuestions: [],
        codeExercises: []
      }));
      console.log(`Se generaron ${lessons.length} lecciones con contenido básico`);
    } catch (error) {
      console.error("Error al parsear el JSON de lecciones múltiples:", error);
      throw new Error("Error al procesar el contenido de las lecciones");
    }
    
    // Paso 2: Generar quiz y ejercicios para cada lección si es necesario
    if (contentType === 'all' || contentType === 'quiz' || contentType === 'code') {
      console.log(`Generando contenido adicional (${contentType}) para cada lección...`);
      
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        console.log(`Procesando lección ${i + 1}: ${lesson.title}`);
        
        // Generar quiz questions si es necesario
        if (contentType === 'all' || contentType === 'quiz') {
          try {
            console.log(`Generando quiz para lección: ${lesson.title}`);
            const quizPrompt = `
              Eres un especialista en educación. Crea 3-4 preguntas de opción múltiple basadas en el siguiente contenido de la lección.
              
              Título de la lección: ${lesson.title}
              Contenido: ${lesson.content}
              
              Genera preguntas que evalúen la comprensión del contenido.
              
              Devuelve ÚNICAMENTE un array JSON válido con este formato exacto:
              [
                {
                  "question": "¿Pregunta 1?",
                  "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
                  "correctAnswerIndex": 0
                },
                {
                  "question": "¿Pregunta 2?",
                  "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
                  "correctAnswerIndex": 2
                }
              ]
              
              No incluyas ningún texto adicional, solo el array JSON sin variables ni asignaciones.
            `;
            
            const quizResponse = await model.generateContent(quizPrompt);
            const quizResult = await quizResponse.response;
            const quizText = quizResult.text();
            
            // Extraer JSON del texto devuelto
            const quizJsonMatch = quizText.match(/\[\s*\{.*\}\s*\]/s);
            if (quizJsonMatch) {
              try {
                const quizJsonString = quizJsonMatch[0];
                lesson.quizQuestions = JSON.parse(quizJsonString);
                console.log(`Generadas ${lesson.quizQuestions.length} preguntas para ${lesson.title}`);
              } catch (error) {
                console.error(`Error al parsear quiz para ${lesson.title}:`, error);
                lesson.quizQuestions = [];
              }
            } else {
              console.error(`No se pudo extraer JSON del quiz para ${lesson.title}`);
              lesson.quizQuestions = [];
            }
          } catch (error) {
            console.error(`Error generando quiz para ${lesson.title}:`, error);
            lesson.quizQuestions = [];
          }
        }
        
        // Generar code exercises si es necesario
        if (contentType === 'all' || contentType === 'code') {
          try {
            console.log(`Generando ejercicios de código para lección: ${lesson.title}`);
            console.log(`ContentType: ${contentType} - debería generar código`);
            
            const codePrompt = `
              Crea 1 ejercicio de código JavaScript simple basado en la lección "${lesson.title}".
              
              IMPORTANTE: Usa SOLO JavaScript básico, sin librerías externas.
              
              Contenido de la lección: ${lesson.content.substring(0, 500)}
              
              Devuelve SOLO este JSON (sin texto adicional):
              [
                {
                  "id": "exercise1",
                  "title": "Ejercicio práctico de ${lesson.title}",
                  "description": "Completa el código para resolver el ejercicio",
                  "language": "javascript",
                  "initialCode": "// Tu código aquí\\nconsole.log('Hola mundo');",
                  "solution": "// Solución\\nconst resultado = 'completado';\\nconsole.log(resultado);",
                  "hint": "Revisa la documentación de JavaScript",
                  "expectedOutput": "completado",
                  "testCases": [
                    { "input": "test()", "expectedOutput": "success", "description": "Prueba básica" }
                  ]
                }
              ]
            `;
            
            console.log(`Enviando prompt de código a Gemini para ${lesson.title}...`);
            const codeResponse = await model.generateContent(codePrompt);
            const codeResult = await codeResponse.response;
            const codeText = codeResult.text();
            
            console.log(`Respuesta de Gemini para ejercicios de código (${lesson.title}):`, codeText.substring(0, 300) + '...');
            
            // Extraer JSON del texto devuelto
            const codeJsonMatch = codeText.match(/\[\s*\{.*\}\s*\]/s);
            if (codeJsonMatch) {
              try {
                const codeJsonString = codeJsonMatch[0];
                console.log(`JSON extraído para código (${lesson.title}):`, codeJsonString.substring(0, 200) + '...');
                lesson.codeExercises = JSON.parse(codeJsonString);
                console.log(`✅ Generados ${lesson.codeExercises.length} ejercicios de código para ${lesson.title}`);
                console.log(`Ejercicios generados:`, lesson.codeExercises.map((ex: any) => ({ id: ex.id, title: ex.title })));
              } catch (parseError) {
                console.error(`❌ Error al parsear ejercicios de código para ${lesson.title}:`, parseError);
                console.error(`JSON que falló:`, codeJsonMatch[0]);
                
                // Fallback: crear un ejercicio básico manualmente
                console.log(`🔄 Creando ejercicio de código básico como fallback para ${lesson.title}...`);
                lesson.codeExercises = [{
                  id: "exercise1",
                  title: `Ejercicio práctico - ${lesson.title}`,
                  description: "Practica los conceptos aprendidos en esta lección",
                  language: "javascript",
                  initialCode: "// Completa el código aquí\nconsole.log('Iniciando ejercicio...');\n\n// Tu solución:",
                  solution: "// Solución del ejercicio\nconsole.log('Ejercicio completado');\nconst resultado = 'success';\nconsole.log(resultado);",
                  hint: "Revisa el contenido de la lección para encontrar la solución",
                  expectedOutput: "success",
                  testCases: [
                    { input: "console.log('test')", expectedOutput: "test", description: "Prueba básica de salida" }
                  ]
                }];
                console.log(`✅ Ejercicio básico creado como fallback para ${lesson.title}`);
              }
            } else {
              console.error(`❌ No se pudo extraer JSON de ejercicios de código para ${lesson.title}`);
              console.error(`Respuesta completa:`, codeText);
              
              // Fallback: crear un ejercicio básico manualmente
              console.log(`🔄 Creando ejercicio de código básico como fallback para ${lesson.title}...`);
              lesson.codeExercises = [{
                id: "exercise1",
                title: `Ejercicio práctico - ${lesson.title}`,
                description: "Practica los conceptos aprendidos en esta lección",
                language: "javascript",
                initialCode: "// Completa el código aquí\nconsole.log('Iniciando ejercicio...');\n\n// Tu solución:",
                solution: "// Solución del ejercicio\nconsole.log('Ejercicio completado');\nconst resultado = 'success';\nconsole.log(resultado);",
                hint: "Revisa el contenido de la lección para encontrar la solución",
                expectedOutput: "success",
                testCases: [
                  { input: "console.log('test')", expectedOutput: "test", description: "Prueba básica de salida" }
                ]
              }];
              console.log(`✅ Ejercicio básico creado como fallback para ${lesson.title}`);
            }
          } catch (error) {
            console.error(`❌ Error generando ejercicios de código para ${lesson.title}:`, error);
            console.error(`Stack trace:`, (error as Error).stack);
            lesson.codeExercises = [];
          }
        } else {
          console.log(`Saltando generación de código para ${lesson.title} - contentType: ${contentType}`);
        }
      }
    }
    
    console.log(`Generación completa: ${lessons.length} lecciones con contenido, quiz y ejercicios`);
    return lessons;
  } catch (error) {
    console.error("Error generando múltiples lecciones:", error);
    throw new Error(`Error generando múltiples lecciones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export default router;