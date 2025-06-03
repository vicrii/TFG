/**
 * Script para diagnosticar problemas de conexión a MongoDB
 * Ejecutar: node db-test.js
 */

// Aplicar configuraciones SSL
// require('./fix-ssl-errors');

const mongoose = require('mongoose');
const dns = require('dns');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Comprobar archivo .env
console.log('\n== VERIFICACIÓN DE ARCHIVO .ENV ==');
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env encontrado');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Buscar variables de MongoDB
    const mongoVars = envContent.match(/(MONGO_URI|MONGODB_URI|DB_URI)=.+/g);
    if (mongoVars && mongoVars.length > 0) {
      console.log('✅ Variables de MongoDB encontradas en .env:');
      mongoVars.forEach(v => {
        // Ocultar credenciales por seguridad
        const sanitized = v.replace(/(:[^:]+@)/, ':****@');
        console.log(`   ${sanitized}`);
      });
    } else {
      console.log('⚠️  No se encontraron variables de MongoDB en .env');
    }
  } else {
    console.log('⚠️  No se encontró archivo .env - será necesario configurarlo');
  }
} catch (err) {
  console.error('❌ Error al leer .env:', err.message);
}

// Función para probar resolución DNS
async function testDNS(host) {
  return new Promise((resolve) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

// Función para probar conectividad de red
async function testNetworkConnectivity(host, port) {
  return new Promise((resolve) => {
    exec(`ping -n 1 ${host}`, (error, stdout) => {
      if (error) {
        resolve({ success: false, output: error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
}

// Función principal para probar la conexión a MongoDB
async function testMongoDB() {
  console.log('\n== DIAGNÓSTICO DE CONEXIÓN A MONGODB ==');
  
  // Obtener URI de MongoDB de las variables de entorno
  const mongoURI = process.env.MONGO_URI || 
                  process.env.MONGODB_URI || 
                  process.env.DB_URI || 
                  'mongodb://localhost:27017/default';
  
  // Extraer host y puerto de MongoDB URI
  let host = 'localhost';
  let port = 27017;
  
  try {
    const url = new URL(mongoURI);
    host = url.hostname;
    port = url.port || (url.protocol === 'mongodb:' ? 27017 : 27017);
    
    console.log(`Conectando a MongoDB en: ${url.protocol}//${host}:${port}`);
  } catch (err) {
    console.log(`URI de MongoDB no válida: ${mongoURI}`);
    console.log('Usando valores por defecto: localhost:27017');
  }
  
  // Comprobar DNS
  console.log('\n>> Comprobando resolución DNS...');
  const dnsResult = await testDNS(host);
  if (dnsResult.success) {
    console.log(`✅ Resolución DNS correcta: ${host} -> ${dnsResult.address}`);
  } else {
    console.log(`❌ Error de resolución DNS: ${dnsResult.error}`);
    console.log('   Posible problema: El nombre de host no se puede resolver');
    console.log('   Solución: Verifica la conexión a internet o el nombre del servidor MongoDB');
  }
  
  // Comprobar conectividad de red
  console.log('\n>> Comprobando conectividad de red...');
  const pingResult = await testNetworkConnectivity(host, port);
  console.log(pingResult.success ? 
    '✅ El servidor responde al ping' : 
    '⚠️  El servidor no responde al ping (puede ser normal si el firewall bloquea ICMP)');
  
  // Intentar conectar a MongoDB
  console.log('\n>> Intentando conectar a MongoDB...');
  
  try {
    // Opciones de conexión ampliadas
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 segundos
      connectTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    
    console.log('Iniciando conexión...');
    const startTime = Date.now();
    
    // Intenta conectar a MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    const endTime = Date.now();
    
    console.log(`✅ Conexión exitosa (${endTime - startTime}ms)`);
    console.log(`   Servidor: ${connection.connection.host}`);
    console.log(`   Base de datos: ${connection.connection.name}`);
    console.log(`   Versión MongoDB: ${connection.connection.version || 'Desconocida'}`);
    
    // Realizar una operación de prueba
    console.log('\n>> Realizando operación de prueba...');
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`✅ Colecciones disponibles: ${collections.length}`);
    collections.slice(0, 5).forEach(c => console.log(`   - ${c.name}`));
    
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('\n✅ Pruebas completadas con éxito, la conexión funciona correctamente');
    
  } catch (error) {
    console.log('\n❌ Error de conexión a MongoDB:');
    console.log(`   Mensaje: ${error.message}`);
    console.log(`   Código: ${error.code || 'No disponible'}`);
    console.log(`   Nombre: ${error.name || 'Desconocido'}`);
    
    // Analizar el error para dar recomendaciones específicas
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  DIAGNÓSTICO: El servidor rechaza la conexión');
      console.log('   Posibles causas:');
      console.log('   1. MongoDB no está ejecutándose en el servidor');
      console.log('   2. El puerto es incorrecto');
      console.log('   3. Un firewall está bloqueando la conexión');
      console.log('   Soluciones recomendadas:');
      console.log('   - Verifica que el servicio MongoDB esté activo');
      console.log('   - Comprueba la URL y el puerto en tu archivo .env');
      console.log('   - Verifica la configuración del firewall');
    }
    else if (error.message.includes('authentication failed')) {
      console.log('\n⚠️  DIAGNÓSTICO: Error de autenticación');
      console.log('   Posibles causas:');
      console.log('   1. Nombre de usuario o contraseña incorrectos');
      console.log('   2. El usuario no tiene permiso para acceder a la base de datos');
      console.log('   Soluciones recomendadas:');
      console.log('   - Verifica las credenciales en el archivo .env');
      console.log('   - Comprueba los permisos del usuario en MongoDB');
    }
    else if (error.message.includes('timed out')) {
      console.log('\n⚠️  DIAGNÓSTICO: Error de tiempo de espera');
      console.log('   Posibles causas:');
      console.log('   1. El servidor está inaccesible o sobrecargado');
      console.log('   2. Problemas de red que aumentan la latencia');
      console.log('   3. Límites de recursos en el servidor MongoDB');
      console.log('   Soluciones recomendadas:');
      console.log('   - Verifica la conectividad de red');
      console.log('   - Aumenta los tiempos de espera en la configuración');
      console.log('   - Si usas MongoDB Atlas, verifica que tu IP esté en la lista blanca');
    }
    else if (error.message.includes('No valid mongos')) {
      console.log('\n⚠️  DIAGNÓSTICO: No se puede conectar al cluster de MongoDB');
      console.log('   Posibles causas:');
      console.log('   1. URI incorrecta de MongoDB');
      console.log('   2. Múltiples instancias en conflicto');
      console.log('   Soluciones recomendadas:');
      console.log('   - Verifica que la URI de conexión sea correcta');
      console.log('   - Si estás usando MongoDB Atlas, verifica que el cluster esté activo');
    }
    else {
      console.log('\n⚠️  DIAGNÓSTICO: Error general de conexión');
      console.log('   Soluciones recomendadas:');
      console.log('   - Verifica la configuración en el archivo .env');
      console.log('   - Comprueba la conectividad de red');
      console.log('   - Asegúrate de que MongoDB esté instalado y en ejecución');
    }
  }
}

// Ejecutar pruebas
testMongoDB().catch(err => {
  console.error('Error en el script de diagnóstico:', err);
}); 