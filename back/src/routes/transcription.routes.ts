import { Router } from 'express';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';
import axios from 'axios';

// Asegurarse de que dotenv esté configurado para leer GEMINI_API_KEY
dotenv.config();

const router = Router();
const mkdtemp = promisify(fs.mkdtemp);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const readFile = promisify(fs.readFile);

interface VideoInfo {
  title?: string;
  formats?: any[];
}

interface AudioExtractionResult {
  audioPath: string;
  title: string;
}

interface TranscriptionResult {
  text: string;
}

interface SummaryResult {
  summary_text?: string;
}

// Verificamos si existe la carpeta temp y la creamos si no
function ensureTempDirExists() {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    console.log('Creando directorio temp principal...');
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

// Función para descargar el video y extraer el audio
async function downloadAndExtractAudio(videoUrl: string, tempDir: string): Promise<AudioExtractionResult> {
  const audioPath = path.join(tempDir, 'audio.mp3');
  const ffmpegPath = 'C:\\Users\\victo\\Documents\\TYPESCRIPT - copia\\back\\scripts\\ffmpeg\\bin\\ffmpeg.exe';
  const ytDlpPath = 'C:\\Users\\victo\\yt-dlp\\yt-dlp.exe';

  console.log(`Intentando descargar video desde: ${videoUrl}`);
  console.log(`Directorio temporal: ${tempDir}`);
  console.log('ffmpeg exists:', fs.existsSync(ffmpegPath));
  console.log('yt-dlp exists:', fs.existsSync(ytDlpPath));

  // Verificar que el directorio exista
  if (!fs.existsSync(tempDir)) {
    console.log('Creando directorio temporal que no existe...');
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Obtener el título real del video usando yt-dlp --dump-json
  let videoTitle = 'Video sin título';
  try {
    const dumpJsonArgs = ['--dump-json', videoUrl];
    const dumpJsonResult = await new Promise<string>((resolve, reject) => {
      execFile(ytDlpPath, dumpJsonArgs, { windowsHide: true }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error ejecutando yt-dlp --dump-json:', error);
          return resolve('Video sin título');
        }
        try {
          const info = JSON.parse(stdout);
          resolve(info.title || 'Video sin título');
        } catch (e) {
          console.error('Error parseando JSON de yt-dlp:', e);
          resolve('Video sin título');
        }
      });
    });
    videoTitle = dumpJsonResult;
  } catch (e) {
    console.error('Fallo inesperado al obtener título del video:', e);
    videoTitle = 'Video sin título';
  }

  // Elimina el archivo de audio si ya existe
  if (fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
  }

  // Ejecutar yt-dlp directamente
  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--ffmpeg-location', ffmpegPath,
    '-o', audioPath,
    videoUrl
  ];
  console.log('Ejecutando yt-dlp con argumentos:', args.join(' '));

  await new Promise<void>((resolve, reject) => {
    execFile(ytDlpPath, args, { windowsHide: true }, (error, stdout, stderr) => {
      console.log('yt-dlp STDOUT:', stdout);
      console.log('yt-dlp STDERR:', stderr);
      if (error) {
        console.error('Error ejecutando yt-dlp:', error);
        return reject(new Error(`Error ejecutando yt-dlp: ${error.message}\nSTDERR: ${stderr}\nSTDOUT: ${stdout}`));
      }
      resolve();
    });
  });

  // Verificar que el archivo de audio se creó
  if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
    throw new Error('El archivo de audio no se creó correctamente tras ejecutar yt-dlp');
  }

  return {
    audioPath,
    title: videoTitle || 'Video sin título'
  };
}

// Función para transcribir el audio usando spawn
async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const absoluteAudioPath = path.isAbsolute(audioPath)
      ? audioPath
      : path.resolve(__dirname, '../../', audioPath);

    console.log(`Transcribiendo audio desde: ${absoluteAudioPath}`);

    return new Promise<string>((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../scripts', 'whisper_transcribe.py');
      const pythonExecutable = 'python'; // O la ruta completa a tu ejecutable de Python si es necesario

      // Verificar que el script existe
      if (!fs.existsSync(scriptPath)) {
        console.error(`Error: El script ${scriptPath} no existe`);
        return reject(new Error(`ERROR: El archivo de script ${scriptPath} no existe.`));
      }

      console.log(`Ejecutando: ${pythonExecutable} ${scriptPath} ${absoluteAudioPath}`);

      // Configurar el entorno para el proceso hijo
      const env = {
        ...process.env,
        PYTHONPATH: path.join(__dirname, '../../scripts'),
        PATH: process.env.PATH + path.delimiter +
              'C:\\Users\\victo\\Desktop\\aaaa\\ffmpeg-master-latest-win64-gpl\\bin' + path.delimiter +
              path.join(__dirname, '../../scripts/ffmpeg/bin')
      };

      const pythonProcess = spawn(pythonExecutable, [scriptPath, absoluteAudioPath], {
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
        env: env
      });

      let transcriptionOutput = '';
      let errorOutput = '';

      // Capturar stdout (salida de la transcripción)
      pythonProcess.stdout.on('data', (data) => {
        const message = data.toString('utf8');
        console.log('Python stdout:', message);
        transcriptionOutput += message;
      });

      // Capturar stderr (logs de depuración y errores de Python)
      pythonProcess.stderr.on('data', (data) => {
        const message = data.toString('utf8');
        console.log('Python stderr:', message);
        errorOutput += message;
      });

      // Manejar errores del proceso spawn en sí (ej. Python no encontrado)
      pythonProcess.on('error', (err) => {
        console.error('Error al iniciar el proceso Python:', err);
        reject(new Error(`Error al iniciar Python: ${err.message}`));
      });

      // Manejar la salida del proceso
      pythonProcess.on('close', (code) => {
        console.log(`Proceso Python terminó con código: ${code}`);

        if (code === 0) {
          if (transcriptionOutput.trim()) {
            console.log('Transcripción completada con éxito (spawn)');
            resolve(transcriptionOutput.trim());
          } else {
            console.error('Proceso Python terminó con código 0 pero sin salida stdout. stderr:', errorOutput);
            reject(new Error(`No se obtuvo texto en la transcripción (código 0). Logs: ${errorOutput}`));
          }
        } else {
          console.error(`Proceso Python falló con código ${code}. stderr:`, errorOutput);
          let finalError = `La transcripción falló (código: ${code}). Logs: ${errorOutput}`;
          // Revisar stderr por errores específicos si el código no es 0
          if (errorOutput.includes("ModuleNotFoundError: No module named 'whisper'")) {
            finalError = 'ERROR: El módulo whisper no está instalado o no es accesible. Instálalo con: pip install openai-whisper';
          } else if (errorOutput.includes('FFmpeg no encontrado')) {
            finalError = 'ERROR DE DEPENDENCIA: FFmpeg no encontrado o no accesible.';
          }
          reject(new Error(finalError));
        }
      });

      // Timeout (opcional pero recomendado)
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error('La transcripción tomó demasiado tiempo (timeout con spawn).'));
        }
      }, 300000);
    });
  } catch (error) {
    console.error('Error síncrono en transcribeAudio (spawn):', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Función para generar un resumen
async function generateSummary(transcription: string): Promise<string> {
  try {
    // Implementación básica para resumir el texto
    // Extraemos las primeras frases como resumen básico
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const importantSentences = sentences.slice(0, Math.min(5, sentences.length));
    
    // Si el texto es muy corto, simplemente lo devolvemos
    if (sentences.length <= 5) {
      return transcription;
    }
    
    return importantSentences.join('. ') + '.';
  } catch (error) {
    console.error('Error durante la generación del resumen:', error);
    return 'No se pudo generar un resumen';
  }
}

// Función para generar esquema del curso con Gemini (con fallback)
async function generateCourseOutlineWithGemini(transcription: string): Promise<string[]> {
    console.log("Iniciando generación de esquema del curso con Gemini...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY no está configurada.");
        return [];
    }

    const primaryModelName = "gemini-2.0-flash";
    const fallbackModelName = "gemini-1.5-flash-latest";
    let modelToUse = primaryModelName;
    let attempt = 1;

    while (attempt <= 2) { // Intentar máximo 2 veces (modelo principal y fallback)
        try {
            console.log(`Intento ${attempt}: Usando modelo ${modelToUse}...`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: modelToUse,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
            });

            const prompt = `Basándote en la siguiente transcripción de un video, genera una lista estructurada de posibles títulos de lecciones para un curso online. Quiero SOLO un array JSON de strings, donde cada string es un título de lección conciso y claro. No incluyas numeración, introducciones, conclusiones ni ningún otro texto fuera del array JSON.

Transcripción:
---
${transcription}
---

Salida esperada (SOLO el array JSON):
["Título Lección 1", "Título Lección 2", "Título Lección 3", ...]`;

            console.log(`Enviando prompt a Gemini (modelo: ${modelToUse})...`);
            const result = await model.generateContent(prompt);
            const response = result.response;
            let jsonText = "";
            try {
                jsonText = response.text();
            } catch (textError) {
                console.error(`Error al obtener el texto de la respuesta de Gemini (modelo: ${modelToUse}):`, textError);
                throw new Error("Error al procesar respuesta de Gemini"); // Lanzar para que el catch externo maneje
            }

            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            console.log(`Respuesta JSON (limpia) recibida de Gemini (modelo: ${modelToUse}):`, jsonText);

            // Limpiar posible markdown alrededor del JSON y asegurarse de que sea solo el array
            const startIndex = jsonText.indexOf('[');
            const endIndex = jsonText.lastIndexOf(']');
            let potentialJson = "";
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                potentialJson = jsonText.substring(startIndex, endIndex + 1);
            } else {
                console.error(`Error: No se pudo encontrar un array JSON válido ([...]) en la respuesta de Gemini (modelo: ${modelToUse}). Texto recibido:`, jsonText);
                throw new Error("Respuesta de Gemini no contiene un array JSON válido");
            }
            
            console.log(`Texto extraído para parsear (modelo: ${modelToUse}):`, potentialJson);
            
            // Intentar parsear el JSON extraído
            try {
                const lessons = JSON.parse(potentialJson); // Parsear la cadena extraída
                if (Array.isArray(lessons) && lessons.every(item => typeof item === 'string')) {
                    console.log(`Esquema del curso generado con éxito (modelo: ${modelToUse}):`, lessons);
                    return lessons; // ÉXITO, salir de la función
                } else {
                    console.error(`Error: El contenido parseado no es un array JSON de strings válido (modelo: ${modelToUse}):`, lessons);
                    throw new Error("Formato de contenido inválido después del parseo");
                }
            } catch (parseError) {
                console.error(`Error CRÍTICO al parsear el JSON extraído (modelo: ${modelToUse}):`, parseError);
                console.error("Texto que causó el error de parseo:", potentialJson); // Loguear el texto problemático
                throw new Error("Error crítico al parsear respuesta de Gemini");
            }

        } catch (error: any) {
            console.error(`Error en intento ${attempt} con modelo ${modelToUse}:`, error.message || error);
            if (attempt === 1) {
                // Si falla el primer intento, preparamos el segundo con el fallback
                console.log("Error con modelo principal, intentando con fallback...");
                modelToUse = fallbackModelName;
                attempt++;
            } else {
                // Si falla también el segundo intento (fallback)
                console.error("El modelo fallback también falló. No se pudo generar el esquema.");
                return []; // Falló dos veces, devolver vacío
            }
        }
    } // Fin del while

    // Este punto no debería alcanzarse si la lógica es correcta, pero por si acaso:
    console.error("Se salió del bucle de intentos sin éxito ni error claro.");
    return [];
}

// --- Nueva función para generar Resumen con Gemini ---
async function generateSummaryWithGemini(transcription: string): Promise<string> {
    console.log("Iniciando generación de resumen con Gemini...");
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY no está configurada para resumen.");
        return "Resumen no disponible (API Key no configurada)";
    }

    // Usaremos el modelo flash que es más rápido y económico para resúmenes
    const modelName = "gemini-1.5-flash-latest"; 

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
            safetySettings: [ // Mantener configuraciones de seguridad 
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
        });

        const prompt = `Basándote en la siguiente transcripción de un video, genera un resumen conciso y claro en español (máximo 3-4 frases). El resumen debe capturar las ideas principales del texto.

Transcripción:
---
${transcription}
---

Resumen conciso (3-4 frases):`;

        console.log(`Enviando prompt de resumen a Gemini (modelo: ${modelName})...`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        let summaryText = "";
        try {
            summaryText = response.text();
            console.log("Resumen generado con éxito por Gemini.");
            return summaryText.trim(); // Devolver el resumen
        } catch (textError) {
            console.error(`Error al obtener el texto de la respuesta de resumen de Gemini:`, textError);
            return "Resumen no disponible (Error al procesar respuesta)";
        }

    } catch (error) {
        console.error(`Error al llamar a la API de Gemini para resumen (modelo: ${modelName}):`, error);
        return "Resumen no disponible (Error de API)"; // Devolver mensaje de error
    }
}

// Función para obtener información del video
async function getVideoInfo(videoUrl: string): Promise<{ title: string, duration: number, transcription?: string }> {
  try {
    const infoOptions = {
      dumpSingleJson: true,
      skipDownload: true,
      noCallHome: true
    };
    // const videoInfo = await youtubeDl(videoUrl, infoOptions) as any;
    let transcription = '';
    // No videoInfo available, so skip automatic_captions logic or set a default message
    transcription = 'No se encontraron subtítulos automáticos para este video.';
    return {
      title: 'Video sin título',
      duration: 0,
      transcription
    };
  } catch (error: any) {
    console.error('Error al obtener información del video:', error.message);
    throw new Error(`Error al obtener información del video: ${error.message || 'Error desconocido'}`);
  }
}

// Ruta para obtener información del video
router.post('/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL no proporcionada' });
    }

    console.log('Obteniendo información del video:', url);
    
    const videoInfo = await getVideoInfo(url);
    console.log('Información obtenida:', videoInfo);
    
    res.json(videoInfo);
  } catch (error: any) {
    console.error('Error al obtener información del video:', error);
    res.status(500).json({
      error: error.message || 'Error desconocido al obtener información del video',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Ruta para transcribir videos
router.post('/transcribe', async (req, res) => {
  try {
    const { 
      url,
      // NUEVAS OPCIONES AVANZADAS
      generateAdvancedContent = false,
      contentType = 'all',
      numberOfLessons = 3,
      selectedLanguage = 'javascript',
      difficultyLevel = 'medium',
      includeExamples = true,
      includeTestCases = true,
      includeHints = true
    } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL no proporcionada' });
    }

    console.log('Iniciando proceso completo para URL:', url);
    if (generateAdvancedContent) {
      console.log('Generación avanzada activada:', {
        contentType,
        numberOfLessons,
        selectedLanguage,
        difficultyLevel
      });
    }
    
    // Crear directorio temporal si no existe
    const tempDir = await ensureTempDirExists();
    console.log('Directorio temporal:', tempDir);

    // Descargar y extraer audio
    console.log('Paso 1: Descargando audio...');
    const extractionResult = await downloadAndExtractAudio(url, tempDir);
    const audioPath = extractionResult.audioPath;
    console.log('Audio descargado en:', audioPath);

    if (!audioPath || !fs.existsSync(audioPath)) {
      throw new Error(`El archivo de audio no se creó correctamente en ${audioPath || 'ruta desconocida'}`);
    }

    // 2. Transcribir audio
    console.log('Paso 2: Iniciando transcripción...');
    let transcription = '';
    try {
      transcription = await transcribeAudio(audioPath);
      console.log('Transcripción obtenida (primeros 100 chars):', transcription.substring(0, 100) + '...');
    } catch (transcriptionError: any) {
      console.error("Error durante la transcripción capturado en la ruta:", transcriptionError);
      transcription = transcriptionError.message || "Error durante la transcripción";
    }

    // Limpiar archivo temporal DESPUÉS de intentar transcribir
    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log('Archivo temporal eliminado:', audioPath);
      }
    } catch (err) {
      console.error('Error al eliminar archivo temporal (no crítico):', err);
    }

    // 3. Generar contenido básico o avanzado
    const isTranscriptionError = transcription.startsWith('ERROR:') || transcription.startsWith('La transcripción falló') || transcription.includes("Error durante la transcripción");
    
    if (isTranscriptionError) {
      console.log('Error en transcripción, saltando generación de contenido.');
      return res.json({
        transcription: transcription,
        summary: 'Resumen no generado debido a error en transcripción.',
        lessons: [],
        title: extractionResult.title || 'Video transcrito',
        status: 'error'
      });
    }

    if (generateAdvancedContent) {
      console.log('Paso 3-A: Generando contenido avanzado con IA...');
      
      try {
        // Usar el sistema de generación de contenido avanzado
        const requestData = {
          text: transcription,
          contentType,
          lessonTitle: extractionResult.title || 'Lección de Video',
          generateMultipleLessons: numberOfLessons > 1,
          numberOfLessons: numberOfLessons,
          selectedLanguage,
          difficultyLevel,
          includeExamples,
          includeTestCases,
          includeHints
        };

        // Llamar al endpoint de generación de contenido de lecciones
        const contentGenerationResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/generate-lesson-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!contentGenerationResponse.ok) {
          throw new Error(`Error en generación de contenido: ${contentGenerationResponse.statusText}`);
        }

        const contentData = await contentGenerationResponse.json();
        
        let enhancedLessons = [];
        let enhancedSummary = '';

        if (requestData.generateMultipleLessons && contentData.lessons) {
          // Múltiples lecciones generadas
          enhancedLessons = contentData.lessons.map((lesson: any) => ({
            title: lesson.title,
            content: lesson.content || '',
            quizQuestions: lesson.quizQuestions || [],
            codeExercises: lesson.codeExercises || []
          }));
          
          // Generar resumen basado en todas las lecciones
          enhancedSummary = `Curso generado con ${enhancedLessons.length} lecciones sobre ${extractionResult.title}. ` +
            `Contenido incluye: ${contentType === 'all' ? 'explicaciones detalladas, evaluaciones y ejercicios prácticos' : 
              contentType === 'content' ? 'explicaciones educativas detalladas' :
              contentType === 'quiz' ? 'evaluaciones y preguntas de comprensión' : 
              'ejercicios prácticos de programación'}.`;
        } else {
          // Una sola lección generada
          enhancedLessons = [{
            title: requestData.lessonTitle,
            content: contentData.content || '',
            quizQuestions: contentData.quizQuestions || [],
            codeExercises: contentData.codeExercises || []
          }];
          
          enhancedSummary = contentData.content ? 
            contentData.content.substring(0, 300) + '...' : 
            'Contenido educativo generado automáticamente.';
        }

        console.log(`Contenido avanzado generado: ${enhancedLessons.length} lecciones`);

        return res.json({
          transcription: "Transcripción completada y procesada",
          summary: enhancedSummary,
          lessons: enhancedLessons,
          title: extractionResult.title || 'Curso Generado',
          status: 'success',
          contentType: contentType,
          advanced: true
        });

      } catch (error) {
        console.error('Error en generación avanzada, fallback a generación básica:', error);
        // Continuar con generación básica si falla la avanzada
      }
    }

    // 3-B. Generación básica (fallback o cuando no se solicita avanzada)
    console.log('Paso 3-B: Generando resumen básico con Gemini...');
    let summary = '';
    if (transcription.trim().length > 0) {
      summary = await generateSummaryWithGemini(transcription);
      console.log('Resumen básico obtenido de Gemini.');
    } else {
      console.log('Transcripción vacía, saltando resumen.');
      summary = 'Resumen no generado debido a transcripción vacía.';
    }

    // 4. Generar Esquema del Curso básico con Gemini
    console.log('Paso 4: Generando esquema básico del curso...');
    let lessons: string[] = [];
    if (transcription.trim().length > 0) {
      lessons = await generateCourseOutlineWithGemini(transcription);
      console.log(`Esquema básico del curso generado (${lessons.length} lecciones).`);
    } else {
      console.log('Saltando esquema del curso debido a transcripción vacía.');
    }

    // 5. Enviar respuesta final
    console.log('Paso 5: Enviando respuesta al frontend.');
    res.json({
      transcription: "Transcripción completada",
      summary,
      lessons,
      title: extractionResult.title || 'Video transcrito',
      status: 'success',
      advanced: false
    });

  } catch (error: any) {
    console.error('Error general en la ruta /transcribe:', error);
    res.status(500).json({
      error: error.message || 'Error desconocido en el proceso de transcripción',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Ruta para generar preguntas de quiz
router.post('/generate-quiz', async (req, res) => {
  try {
    const { lessonTitle, lessonContent } = req.body;
    
    if (!lessonTitle || !lessonContent) {
      return res.status(400).json({ error: 'Se requiere título y contenido de la lección' });
    }

    console.log('Generando preguntas para la lección:', lessonTitle);
    
    // Usar Gemini para generar preguntas
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no está configurada' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const prompt = `Basándote en el siguiente título y contenido de una lección, genera 3-5 preguntas tipo test/quiz con 4 opciones cada una (una correcta y tres incorrectas).

Título de la lección: ${lessonTitle}

Contenido:
---
${lessonContent}
---

Genera las preguntas en formato JSON con la siguiente estructura exacta (es muy importante mantener este formato):

[
  {
    "question": "Texto de la pregunta 1?",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswerIndex": 0
  },
  {
    "question": "Texto de la pregunta 2?",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswerIndex": 2
  }
]

Nota: correctAnswerIndex debe ser el índice (0-3) de la opción correcta en el array de opciones. Las preguntas deben ser relevantes y basadas en el contenido proporcionado. Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas.`;

    console.log('Enviando prompt a Gemini para generar preguntas de quiz...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text();
    
    // Limpiar posible markdown
    jsonText = jsonText.replace(/```json\s*|\s*```/g, '').trim();
    console.log('Respuesta para quiz recibida:', jsonText.substring(0, 200) + '...');
    
    // Extraer el array JSON
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    let questionsJson = "";
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      questionsJson = jsonText.substring(startIndex, endIndex + 1);
    } else {
      throw new Error('No se pudo extraer el formato JSON de la respuesta');
    }
    
    // Parsear las preguntas
    const questions = JSON.parse(questionsJson);
    
    // Validar estructura
    if (!Array.isArray(questions) || !questions.every(q => 
      typeof q.question === 'string' && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswerIndex === 'number')) {
      throw new Error('Estructura de preguntas inválida');
    }
    
    res.json({ questions });
    
  } catch (error: any) {
    console.error('Error al generar preguntas de quiz:', error);
    res.status(500).json({
      error: error.message || 'Error desconocido al generar preguntas',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- Ruta de progreso (sin cambios) ---
router.get('/transcribe/progress/:id', (req, res) => {
    // ... (código existente de la ruta de progreso) ...
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      res.write(`data: ${JSON.stringify({ progress, status: `Progreso: ${progress}%` })}\\n\\n`);

      if (progress >= 100) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
    });
});

export default router; // Asegurarse que el export default esté al final y correcto