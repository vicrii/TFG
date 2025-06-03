import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Aumentar tiempos de conexión y opciones de reconexión
const connectDB = async (): Promise<void> => {
  try {
    // Verifica múltiples posibles variables de entorno para la URI de MongoDB
    const mongoURI = process.env.MONGO_URI || 
                      process.env.MONGODB_URI || 
                      process.env.DB_URI || 
                      'mongodb://localhost:27017/default';
    
    console.log('Conectando a MongoDB...');
    
    // Opciones de conexión mejoradas
    const options = {
      serverSelectionTimeoutMS: 30000, // Tiempo de selección de servidor aumentado
      connectTimeoutMS: 30000, // Timeout de conexión aumentado
      socketTimeoutMS: 45000, // Timeout de socket aumentado
      heartbeatFrequencyMS: 5000, // Frecuencia de heartbeat reducida
      // Forzar el nuevo parser de URL
      useNewUrlParser: true as any,
      useUnifiedTopology: true as any
    };
    
    const connection = await mongoose.connect(mongoURI, options);
    
    // Mejorar el manejo de errores de conexión
    mongoose.connection.on('error', (err) => {
      console.error(`Error de conexión MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('La conexión a MongoDB se ha desconectado');
    });
    
    console.log(`MongoDB Conectado: ${connection.connection.host}`);
    console.log(`Base de datos: ${connection.connection.name}`);
  } catch (error) {
    console.error('Error al conectar a MongoDB:');
    console.error(`Mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    console.error(`Tipo de error: ${error instanceof Error ? error.name : 'Desconocido'}`);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack de error:', error.stack.split('\n')[0]);
    }
    
    // En modo desarrollo, no cerrar la aplicación para permitir reintentos
    if (process.env.NODE_ENV === 'production') {
      console.error('Cerrando aplicación debido a error crítico de base de datos');
      process.exit(1);
    } else {
      console.warn('Error de conexión a MongoDB en modo desarrollo - continuando sin BD');
    }
  }
};

export default connectDB;