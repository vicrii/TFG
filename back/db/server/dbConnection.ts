import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Aumentar tiempos de conexión y opciones de reconexión
const connectDB = async (): Promise<void> => {
  try {
    // Usar directamente la URI de MongoDB Atlas para desarrollo
    const mongoURI = process.env.MONGO_URI || 
                      process.env.MONGODB_URI || 
                      process.env.DB_URI || 
                      'mongodb+srv://vicridev:OvDwlhYiLfdOdhSS@db.e0byx.mongodb.net/?retryWrites=true&w=majority';
    
    console.log('Conectando a MongoDB Atlas...');
    
    // Opciones de conexión mejoradas para Atlas
    const options = {
      serverSelectionTimeoutMS: 10000, // Reducido para Atlas
      connectTimeoutMS: 10000, // Reducido para Atlas
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 5000,
    };
    
    const connection = await mongoose.connect(mongoURI, options);
    
    // Mejorar el manejo de errores de conexión
    mongoose.connection.on('error', (err) => {
      console.error(`Error de conexión MongoDB: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('La conexión a MongoDB se ha desconectado');
    });
    
    console.log(`MongoDB Atlas Conectado: ${connection.connection.host}`);
    console.log(`Base de datos: ${connection.connection.name}`);
  } catch (error) {
    console.error('Error al conectar a MongoDB Atlas:');
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
      console.warn('Error de conexión a MongoDB Atlas en modo desarrollo - reintentando...');
    }
  }
};

export default connectDB;