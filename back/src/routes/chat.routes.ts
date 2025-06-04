import { Router } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const router = Router();

// Asegurarse de que la API key esté configurada
const apiKey = process.env.GEMINI_API_KEY;

// Función para manejar la generación de respuestas con Gemini
async function generateChatResponse(message: string, history: Array<{role: string, content: string}> = []) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo 1.5-flash para respuestas rápidas
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    // Asegurarse que la historia tenga un formato válido para la API de Gemini
    // El primer mensaje debe ser de un usuario
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Si la historia está vacía o el primer mensaje no es de usuario,
    // simplemente omitimos la historia y comenzamos una nueva conversación
    const startChat = model.startChat({
      // Solo incluimos history si hay mensajes y el primero es de usuario
      ...(formattedHistory.length > 0 && formattedHistory[0].role === 'user' ? { history: formattedHistory } : {}),
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      }
    });

    // Generar respuesta
    const result = await startChat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error al comunicarse con Gemini:", error);
    throw error;
  }
}

// Ruta para manejar la generación de chat
router.post('/send', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Validar que se ha proporcionado un mensaje
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Se requiere un mensaje válido' });
    }


    console.log(`Procesando mensaje: "${message.substring(0, 30)}..."`);
    const response = await generateChatResponse(message, history);
    
    return res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error en la ruta /chat/send:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el mensaje'
    });
  }
});

export default router; 