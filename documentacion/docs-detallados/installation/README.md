# 📖 Manual de Instalación - Proyecto DAW

## 🎯 Requisitos del Sistema

### **Requisitos Mínimos**
- **Sistema Operativo**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Node.js**: 20.x o superior
- **RAM**: 4GB mínimo (8GB recomendado)
- **Almacenamiento**: 2GB disponibles
- **Conexión**: Internet para dependencias y MongoDB Atlas

### **Software Necesario**
- **Git**: Control de versiones
- **Docker**: Para containerización (opcional)
- **MongoDB**: 7.x (local) o Atlas (cloud)
- **Editor**: VSCode recomendado

---

## 🚀 Instalación Paso a Paso

### **Método 1: Docker (Recomendado para Evaluación)**

#### **1. Preparación**
```bash
# Verificar Docker instalado
docker --version
docker-compose --version

# Clonar repositorio
git clone https://github.com/vicrii/TFG.git
cd TFG
```

#### **2. Configuración de Variables**
```bash
# Copiar archivo de configuración
cp back/.env.example back/.env
```

**Editar `back/.env`:**
```env
# Base de datos (ya configurada para Docker)
MONGODB_URI=mongodb://admin:password123@mongodb:27017/solana_learning?authSource=admin

# Configuración del servidor
PORT=5000
NODE_ENV=development

# Seguridad
JWT_SECRET=your-jwt-secret-key-here

# APIs externas (opcional para demo)
OPENAI_API_KEY=sk-your-key-here
YOUTUBE_API_KEY=your-youtube-key
```

#### **3. Ejecutar con Docker**
```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# En modo detached (background)
docker-compose up --build -d

# Ver logs en tiempo real
docker-compose logs -f
```

#### **4. Verificar Instalación**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017

### **Método 2: Instalación Manual**

#### **1. Preparación del Entorno**
```bash
# Verificar Node.js
node --version  # Debe ser 20.x+
npm --version

# Clonar repositorio
git clone https://github.com/vicrii/TFG.git
cd TFG
```

#### **2. Instalar Dependencias**
```bash
# Instalar dependencias raíz
npm install

# Instalar todas las dependencias (front + back)
npm run install:all

# O manualmente:
cd back && npm install
cd ../front && npm install
cd ..
```

#### **3. Configurar Base de Datos**

**Opción A: MongoDB Local**
```bash
# Instalar MongoDB Community Edition
# Windows: Descargar de mongodb.com
# macOS: brew install mongodb/brew/mongodb-community
# Ubuntu: sudo apt install mongodb

# Iniciar servicio
sudo systemctl start mongod  # Linux
brew services start mongodb/brew/mongodb-community  # macOS
```

**Opción B: MongoDB Atlas (Recomendado)**
1. Crear cuenta en [MongoDB Atlas](https://cloud.mongodb.com)
2. Crear cluster gratuito
3. Configurar usuario de base de datos
4. Obtener connection string

#### **4. Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp back/.env.example back/.env
```

**Para MongoDB Local:**
```env
MONGODB_URI=mongodb://localhost:27017/plataforma_educativa
PORT=5000
NODE_ENV=development
JWT_SECRET=tu-secreto-muy-seguro-aqui
```

**Para MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/plataforma_educativa
PORT=5000
NODE_ENV=development
JWT_SECRET=tu-secreto-muy-seguro-aqui
```

#### **5. Ejecutar en Desarrollo**
```bash
# Opción 1: Ambos servicios simultáneamente
npm run dev

# Opción 2: Por separado (en terminales diferentes)
npm run dev:back    # Terminal 1
npm run dev:front   # Terminal 2
```

#### **6. Verificar Instalación**
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

---

## 🌐 Configuración para Producción

### **Preparar para Despliegue**

#### **1. Build de Producción**
```bash
# Frontend
cd front
npm run build
cd ..

# Backend
cd back
npm run build
cd ..

# O ambos
npm run build
```

#### **2. Variables de Producción**
```env
# back/.env.production
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...tu-atlas-uri
JWT_SECRET=super-secreto-produccion
CORS_ORIGIN=https://solanalearn.up.railway.app
```

#### **3. Despliegue en Railway**

**Preparación:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login
```

**Configurar proyecto:**
```bash
# Inicializar proyecto Railway
railway init

# Configurar variables de entorno
railway variables set MONGODB_URI=mongodb+srv://...
railway variables set JWT_SECRET=tu-secreto
railway variables set NODE_ENV=production

# Desplegar
railway up
```

#### **4. Configuración Nginx (Opcional)**

**nginx.conf básico:**
```nginx
server {
    listen 80;
    server_name solanalearn.up.railway.app;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name solanalearn.up.railway.app;
    
    # Certificados SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 Configuración Avanzada

### **Base de Datos**

#### **Inicialización con Datos de Prueba**
```bash
# Ejecutar script de seed (si existe)
cd back
npm run seed

# O importar datos manualmente
mongoimport --db plataforma_educativa --collection users --file seed/users.json
mongoimport --db plataforma_educativa --collection courses --file seed/courses.json
```

#### **Backup y Restauración**
```bash
# Backup
mongodump --db plataforma_educativa --out ./backup

# Restore
mongorestore --db plataforma_educativa ./backup/plataforma_educativa
```

### **SSL/HTTPS**

#### **Certificados Autofirmados (Desarrollo)**
```bash
# Generar certificados
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurar en Express
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

#### **Let's Encrypt (Producción)**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d solanalearn.up.railway.app

# Renovación automática
sudo crontab -e
# Añadir: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🛠️ Herramientas de Desarrollo

### **VSCode Extensions Recomendadas**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "mongodb.mongodb-vscode"
  ]
}
```

### **Scripts NPM Útiles**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:back\" \"npm run dev:front\"",
    "dev:back": "cd back && npm run dev",
    "dev:front": "cd front && npm run dev",
    "build": "npm run build:back && npm run build:front",
    "build:back": "cd back && npm run build",
    "build:front": "cd front && npm run build",
    "install:all": "npm install && cd back && npm install && cd ../front && npm install",
    "test": "npm run test:back && npm run test:front",
    "test:back": "cd back && npm test",
    "test:front": "cd front && npm test"
  }
}
```

---

## 🐛 Solución de Problemas

### **Problemas Comunes**

#### **Error: Puerto en uso**
```bash
# Encontrar proceso usando puerto
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Matar proceso
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### **Error: MongoDB connection**
```bash
# Verificar estado MongoDB
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Verificar conexión
mongo --eval "db.adminCommand('ismaster')"
```

#### **Error: Node version**
```bash
# Instalar Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node 20
nvm install 20
nvm use 20
nvm alias default 20
```

#### **Error: Permisos npm**
```bash
# Configurar npm prefix
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Añadir a PATH en ~/.bashrc o ~/.zshrc
export PATH=~/.npm-global/bin:$PATH
```

### **Logs y Debugging**

#### **Backend Logs**
```bash
# Ver logs en tiempo real
cd back && npm run dev

# Logs con más detalle
DEBUG=app:* npm run dev
```

#### **Frontend Logs**
```bash
# Console del navegador
F12 → Console

# Logs de Vite
cd front && npm run dev -- --debug
```

#### **Docker Logs**
```bash
# Ver logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Seguir logs en tiempo real
docker-compose logs -f
```

---

## ✅ Verificación de Instalación

### **Checklist de Verificación**

#### **✅ Servicios Funcionando**
- [ ] Frontend accesible en http://localhost:5173
- [ ] Backend API responde en http://localhost:5000/api/health
- [ ] Base de datos conectada correctamente
- [ ] Sin errores en logs

#### **✅ Funcionalidades Básicas**
- [ ] Página principal se carga correctamente
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Navegación entre páginas
- [ ] Responsive design en móvil

#### **✅ Características DAW**
- [ ] HTML5 semántico
- [ ] CSS3 y animaciones
- [ ] Bootstrap responsive
- [ ] Validación de formularios
- [ ] Comunicación AJAX/fetch

#### **✅ Base de Datos**
- [ ] Conexión establecida
- [ ] Colecciones creadas
- [ ] Datos de prueba cargados
- [ ] Relaciones funcionando

### **Test de Funcionalidad**
```bash
# Ejecutar tests automatizados
npm test

# Test manual de endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/courses
```

---

## 📞 Soporte

### **Si tienes problemas:**

1. **Revisa logs**: Siempre revisar logs primero
2. **Verifica requisitos**: Node.js, MongoDB, etc.
3. **Consulta documentación**: README principal y docs/
4. **Issues GitHub**: [Reportar problema](https://github.com/vicrii/TFG/issues)
5. **Email**: soporte@plataforma-educativa.com

### **Para evaluadores DAW:**
- Documentación completa en carpeta `docs/`
- Credenciales de prueba en README principal
- Demo live disponible 24/7
- Código comentado y estructurado

---

*Instalación completada exitosamente ✅* 