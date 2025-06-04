# 🚀 Getting Started - Plataforma Educativa

¡Bienvenido a la Plataforma de Aprendizaje Blockchain! Esta guía te llevará paso a paso desde la instalación inicial hasta tener un entorno completamente funcional.

## 📋 Requisitos del Sistema

### **Mínimos**
- **Node.js**: 18.x o superior (recomendado 20.x)
- **NPM**: 9.x o superior
- **Git**: 2.x o superior
- **RAM**: 4GB mínimo
- **Espacio en disco**: 2GB libres

### **Recomendados**
- **Node.js**: 20.x LTS
- **NPM**: 10.x
- **RAM**: 8GB o más
- **CPU**: 4 cores o más
- **SSD**: Para mejor rendimiento

### **Base de Datos**
Elige una de estas opciones:
- **MongoDB Atlas** (recomendado para desarrollo)
- **MongoDB local** (versión 7.x)
- **Docker MongoDB** (para desarrollo aislado)

## 🛠️ Instalación Paso a Paso

### **1. Clonar el Repositorio**

```bash
# Clonar el proyecto
git clone https://github.com/tu-usuario/plataforma-educativa.git
cd plataforma-educativa

# Verificar la estructura
ls -la
```

### **2. Verificar Node.js**

```bash
# Verificar versión de Node.js
node --version  # Debe ser >= 18.x

# Verificar NPM
npm --version   # Debe ser >= 9.x

# Si necesitas instalar Node.js:
# https://nodejs.org/en/download/
```

### **3. Instalar Dependencias**

```bash
# Opción 1: Instalar todo automáticamente (recomendado)
npm run install:all

# Opción 2: Instalar manualmente
npm install
cd back && npm install
cd ../front && npm install
cd ..
```

### **4. Configurar Variables de Entorno**

#### **Backend (.env)**
```bash
# Crear archivo de configuración del backend
cd back
cp .env.example .env
```

Editar `back/.env` con tus configuraciones:

```env
# Base de datos - Elige una opción
MONGODB_URI=mongodb://localhost:27017/plataforma-educativa
# O usar MongoDB Atlas:
# MONGODB_URI_ATLAS=mongodb+srv://usuario:password@cluster.mongodb.net/plataforma-educativa

# APIs de IA (al menos una es requerida)
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=your-google-api-key-here

# YouTube API (opcional, para funcionalidad de videos)
YOUTUBE_API_KEY=your-youtube-api-key-here

# Configuración del servidor
PORT=5000
NODE_ENV=development

# Seguridad
JWT_SECRET=tu-secreto-super-seguro-aqui
CORS_ORIGIN=http://localhost:5173

# Opcional: Configuraciones avanzadas
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

#### **Frontend (.env)**
```bash
cd ../front
cp .env.example .env
```

Editar `front/.env`:

```env
# URL del backend
VITE_API_URL=http://localhost:5000/api

# Configuración de Solana
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Configuración de la app
VITE_APP_NAME=Plataforma Educativa
VITE_APP_VERSION=1.0.0

# Opcional: Analytics y tracking
VITE_ANALYTICS_ID=your-analytics-id
```

### **5. Configurar Base de Datos**

#### **Opción A: MongoDB Atlas (Recomendado)**
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster gratuito
3. Obtener string de conexión
4. Actualizar `MONGODB_URI_ATLAS` en `.env`

#### **Opción B: MongoDB Local**
```bash
# Instalar MongoDB localmente
# macOS con Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian:
sudo apt-get install mongodb

# Windows: Descargar desde mongodb.com

# Iniciar MongoDB
mongod --dbpath /ruta/a/tu/db
```

#### **Opción C: MongoDB con Docker**
```bash
# Crear y ejecutar contenedor MongoDB
docker run --name mongodb-dev \
  -p 27017:27017 \
  -d mongo:7

# Verificar que esté corriendo
docker ps
```

### **6. Obtener APIs Keys**

#### **OpenAI API (Recomendado)**
1. Ir a [OpenAI Platform](https://platform.openai.com/)
2. Crear cuenta / iniciar sesión
3. Ir a API Keys
4. Crear nueva key
5. Copiar a `OPENAI_API_KEY` en `.env`

#### **Google Gemini API (Alternativo)**
1. Ir a [Google AI Studio](https://makersuite.google.com/)
2. Crear proyecto
3. Obtener API key
4. Copiar a `GOOGLE_API_KEY` en `.env`

#### **YouTube API (Opcional)**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear proyecto
3. Habilitar YouTube Data API v3
4. Crear credenciales (API Key)
5. Copiar a `YOUTUBE_API_KEY` en `.env`

## 🚀 Ejecutar en Desarrollo

### **Iniciar Todo Automáticamente**
```bash
# Desde la raíz del proyecto
npm run dev

# Esto inicia:
# - Backend en http://localhost:5000
# - Frontend en http://localhost:5173
```

### **Iniciar Manualmente**

#### **Terminal 1: Backend**
```bash
cd back
npm run dev

# Verás:
# ✅ Servidor iniciado en puerto 5000
# ✅ Conectado a MongoDB
# ✅ APIs de IA configuradas
```

#### **Terminal 2: Frontend**
```bash
cd front
npm run dev

# Verás:
# ✅ Servidor de desarrollo en http://localhost:5173
# ✅ Hot reload habilitado
```

## ✅ Verificar Instalación

### **1. Verificar Backend**
```bash
# Probar health endpoint
curl http://localhost:5000/api/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### **2. Verificar Frontend**
Abrir http://localhost:5173 en el navegador:
- ✅ Página de inicio carga correctamente
- ✅ Wallet connect button visible
- ✅ No errores en consola del navegador

### **3. Verificar Base de Datos**
```bash
# Con MongoDB local
mongo plataforma-educativa --eval "db.stats()"

# Con MongoDB Atlas - verificar en la consola web
```

### **4. Verificar APIs de IA**
```bash
# Probar endpoint de IA
curl -X POST http://localhost:5000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Respuesta esperada:
# {"status":"ok","ai_service":"openai","response":"..."}
```

## 🎯 Próximos Pasos

Una vez que todo esté funcionando:

1. **[Crear tu primer curso](../user-manual/create-course.md)** - Aprende a crear contenido
2. **[Configurar wallet](../user-manual/wallet-setup.md)** - Conectar wallet Solana
3. **[Explorar la API](../api/README.md)** - Entender los endpoints disponibles
4. **[Personalizar la plataforma](../development/customization.md)** - Hacer modificaciones

## 🐛 Solución de Problemas Comunes

### **Error: Puerto 5000 en uso**
```bash
# Encontrar proceso usando el puerto
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Cambiar puerto en back/.env
PORT=5001
```

### **Error: MongoDB no conecta**
```bash
# Verificar que MongoDB esté corriendo
ps aux | grep mongod  # macOS/Linux
tasklist | findstr mongod  # Windows

# Verificar string de conexión en .env
```

### **Error: API Key inválida**
- Verificar que la API key esté correcta en `.env`
- Revisar créditos en la plataforma (OpenAI/Google)
- Verificar permisos de la API key

### **Error: Dependencias no se instalan**
```bash
# Limpiar cache y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **Frontend no conecta con Backend**
- Verificar que `VITE_API_URL` en `front/.env` sea correcto
- Verificar que el backend esté corriendo en el puerto especificado
- Revisar configuración CORS en `back/.env`

## 📞 Obtener Ayuda

¿Problemas con la instalación?

- 📖 **Documentación completa**: [Ver todas las guías](../README.md)
- 🐛 **Reportar problema**: [GitHub Issues](https://github.com/tu-usuario/plataforma-educativa/issues)
- 💬 **Comunidad**: [Discord](https://discord.gg/plataforma-educativa)
- 📧 **Email**: soporte@plataforma-educativa.com

## 🎉 ¡Felicidades!

Si llegaste hasta aquí, ¡ya tienes la plataforma funcionando! Ahora puedes:

- ✅ Crear cursos con IA
- ✅ Conectar wallets Solana
- ✅ Gestionar estudiantes
- ✅ Analizar métricas de aprendizaje

---

**Siguiente paso recomendado**: [🎯 Crear tu primer curso](../user-manual/create-course.md) 