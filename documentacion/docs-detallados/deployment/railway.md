# 🚀 Despliegue en Railway - Plataforma Educativa

Railway es nuestra plataforma recomendada para el despliegue de la aplicación. Esta guía te llevará paso a paso para tener tu aplicación funcionando en producción.

## 🎯 ¿Por qué Railway?

- ✅ **Deploy automático** desde GitHub
- ✅ **Escalado automático** basado en demanda
- ✅ **Variables de entorno** seguras
- ✅ **Logs en tiempo real** para debugging
- ✅ **Base de datos integrada** (PostgreSQL/MySQL)
- ✅ **CDN y SSL** incluidos
- ✅ **Costo efectivo** con plan gratuito

## 📋 Prerrequisitos

- ✅ Cuenta en [Railway](https://railway.app)
- ✅ Cuenta en [GitHub](https://github.com)
- ✅ Repositorio del proyecto en GitHub
- ✅ MongoDB Atlas configurado
- ✅ API Keys de servicios externos (OpenAI, etc.)

## 🛠️ Configuración Paso a Paso

### **1. Preparar el Repositorio**

Asegurate de que tu proyecto tenga esta estructura:

```
plataforma-educativa/
├── railway.toml          # ✅ Configuración de Railway
├── Dockerfile.simple     # ✅ Dockerfile optimizado
├── package.json          # ✅ Scripts de build
├── front/
│   ├── package.json
│   └── ...
└── back/
    ├── package.json
    └── ...
```

### **2. Conectar con Railway**

1. **Crear Proyecto en Railway**
   ```bash
   # Opción 1: Desde CLI (recomendado)
   npm install -g @railway/cli
   railway login
   railway init
   
   # Opción 2: Desde la web
   # Ir a https://railway.app/new
   ```

2. **Conectar Repositorio GitHub**
   - Ir a Railway Dashboard
   - Click en "New Project"
   - Seleccionar "Deploy from GitHub repo"
   - Autorizar y seleccionar tu repositorio

### **3. Configurar Variables de Entorno**

En Railway Dashboard → Project → Variables:

#### **Variables Requeridas**
```env
# Base de datos
MONGODB_URI_ATLAS=mongodb+srv://user:pass@cluster.mongodb.net/plataforma-educativa

# APIs de IA (al menos una)
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...

# Configuración del servidor
NODE_ENV=production
PORT=8080

# Seguridad
JWT_SECRET=tu-secreto-super-seguro-para-produccion
CORS_ORIGIN=https://tu-dominio.railway.app

# YouTube API (opcional)
YOUTUBE_API_KEY=AIza...
```

#### **Variables Opcionales**
```env
# Límites de la aplicación
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# Analytics
ANALYTICS_ENABLED=true
```

### **4. Configurar railway.toml**

Archivo `railway.toml` en la raíz del proyecto:

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile.simple"

[deploy]
startCommand = "node dist/server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "always"
```

### **5. Optimizar Dockerfile.simple**

```dockerfile
# Multi-stage build para Railway
FROM node:20-alpine AS frontend-builder

WORKDIR /app/front
COPY front/package*.json ./
RUN npm install --legacy-peer-deps --production=false
COPY front/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder

WORKDIR /app/back
COPY back/package*.json ./
RUN npm install --production=false
COPY back/ ./
RUN npm run build

# Imagen final optimizada
FROM node:20-alpine

WORKDIR /app

# Instalar solo dependencias de producción
COPY back/package*.json ./
RUN npm install --production && npm cache clean --force

# Copiar archivos construidos
COPY --from=backend-builder /app/back/dist ./dist
COPY --from=frontend-builder /app/front/dist ./public

# Crear directorios necesarios
RUN mkdir -p uploads logs

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "http.get('http://localhost:8080/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

EXPOSE 8080

CMD ["node", "dist/server.js"]
```

### **6. Script de Deploy Automático**

Crear `deploy-railway.ps1`:

```powershell
#!/usr/bin/env pwsh

# Script de deploy automático para Railway
param(
    [string]$Message = "Deploy to Railway",
    [switch]$Force = $false
)

Write-Host "🚀 Iniciando deploy a Railway..." -ForegroundColor Green

# 1. Verificar que estamos en la rama main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main" -and -not $Force) {
    Write-Host "❌ Debes estar en la rama 'main' para hacer deploy" -ForegroundColor Red
    Write-Host "   Usa -Force para hacer deploy desde otra rama" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar que no hay cambios sin commitear
$gitStatus = git status --porcelain
if ($gitStatus -and -not $Force) {
    Write-Host "❌ Hay cambios sin commitear:" -ForegroundColor Red
    git status --short
    Write-Host "   Commitea los cambios o usa -Force" -ForegroundColor Yellow
    exit 1
}

# 3. Ejecutar tests
Write-Host "🧪 Ejecutando tests..." -ForegroundColor Blue
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests fallaron. Deploy cancelado." -ForegroundColor Red
    exit 1
}

# 4. Build local para verificar
Write-Host "🔨 Verificando build..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falló. Deploy cancelado." -ForegroundColor Red
    exit 1
}

# 5. Commit y push
Write-Host "📤 Pushing cambios..." -ForegroundColor Blue
git add .
git commit -m $Message
git push origin main

# 6. Trigger deploy en Railway
Write-Host "🚀 Triggeando deploy en Railway..." -ForegroundColor Blue
railway up

# 7. Verificar deploy
Start-Sleep 30
Write-Host "✅ Verificando deploy..." -ForegroundColor Blue
$healthUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url
$healthUrl += "/api/health"

try {
    $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30
    if ($response.status -eq "ok") {
        Write-Host "✅ Deploy exitoso! 🎉" -ForegroundColor Green
        Write-Host "🌐 URL: $(railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Deploy completado pero health check falló" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar el health check" -ForegroundColor Yellow
    Write-Host "   Verifica manualmente: $healthUrl" -ForegroundColor Gray
}

Write-Host "🎯 Deploy completado!" -ForegroundColor Green
```

## 🔧 Configuración Avanzada

### **Base de Datos**

#### **Opción 1: MongoDB Atlas (Recomendado)**
```bash
# Ya configurado en variables de entorno
MONGODB_URI_ATLAS=mongodb+srv://...
```

#### **Opción 2: Railway PostgreSQL**
```bash
# Si prefieres PostgreSQL, Railway puede proveerlo
railway add postgresql
```

### **CDN y Archivos Estáticos**

Railway sirve automáticamente los archivos estáticos del frontend. Para optimizar:

```dockerfile
# En Dockerfile.simple, asegurate de:
COPY --from=frontend-builder /app/front/dist ./public
```

### **Dominios Personalizados**

1. **Ir a Railway Dashboard**
2. **Settings → Domains**
3. **Add Domain**
4. **Configurar DNS:**
   ```
   CNAME: tu-dominio.com → railway-production-url
   ```

### **SSL/HTTPS**

Railway proporciona SSL automáticamente:
- ✅ Certificados automáticos con Let's Encrypt
- ✅ Renovación automática
- ✅ Redirección HTTP → HTTPS

## 📊 Monitoreo y Logs

### **Ver Logs en Tiempo Real**
```bash
# Desde CLI
railway logs

# Desde web
# Dashboard → Deployments → View Logs
```

### **Métricas de Performance**
Railway Dashboard proporciona:
- 📈 CPU y memoria usage
- 🌐 Requests por minuto
- ⏱️ Response times
- 💾 Database connections

### **Alertas**
Configurar en Dashboard → Settings → Notifications:
- 📧 Email alerts para errores
- 💬 Slack/Discord webhooks
- 📱 SMS para incidentes críticos

## 🐛 Debugging en Producción

### **Logs Detallados**
```env
# En variables de Railway
LOG_LEVEL=debug
NODE_ENV=production
```

### **Health Check Personalizado**
```javascript
// En tu backend, agregar endpoint detallado
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'checking...',
      ai: 'checking...',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  // Check database
  try {
    await mongoose.connection.db.admin().ping();
    health.services.database = 'connected';
  } catch (err) {
    health.services.database = 'error';
    health.status = 'degraded';
  }
  
  res.json(health);
});
```

### **Error Tracking**
Integrar con servicios como Sentry:

```bash
npm install @sentry/node
```

```javascript
// En tu backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## 🚨 Troubleshooting

### **Build Failures**

#### **Error: Node modules no encontrados**
```bash
# Verificar que package.json está en la raíz
# Y que railway.toml apunta al Dockerfile correcto
```

#### **Error: Frontend build falla**
```bash
# Verificar variables de entorno del frontend
VITE_API_URL=$RAILWAY_PUBLIC_DOMAIN/api
```

#### **Error: Out of memory**
```dockerfile
# Optimizar Dockerfile
RUN npm install --production
RUN npm cache clean --force
```

### **Runtime Errors**

#### **Error: Database connection**
```bash
# Verificar MONGODB_URI_ATLAS
# Verificar whitelist de IPs en MongoDB Atlas (permitir 0.0.0.0/0)
```

#### **Error: API Keys**
```bash
# Verificar que las API keys están configuradas
# Y que tienen los permisos correctos
```

#### **Error: CORS**
```bash
# Actualizar CORS_ORIGIN con la URL de Railway
CORS_ORIGIN=https://tu-proyecto-production.railway.app
```

### **Performance Issues**

#### **Respuesta lenta**
```bash
# Verificar métricas en Railway Dashboard
# Considerar upgrade del plan si es necesario
```

#### **Timeouts**
```env
# Aumentar timeouts
RAILWAY_HEALTHCHECK_TIMEOUT=300
```

## 💰 Costos y Optimización

### **Plan Gratuito de Railway**
- ✅ $5 USD de crédito mensual gratis
- ✅ Hasta 500 horas de compute
- ✅ 1GB RAM, 1 vCPU
- ✅ 1GB de storage

### **Optimizaciones para Reducir Costos**
```dockerfile
# Usar imágenes Alpine (más pequeñas)
FROM node:20-alpine

# Eliminar dev dependencies
RUN npm install --production

# Limpiar cache
RUN npm cache clean --force
```

### **Escalado Automático**
Railway escala automáticamente basado en:
- 📊 CPU usage
- 💾 Memory usage  
- 🌐 Request volume

## 🔒 Seguridad

### **Variables de Entorno Seguras**
- ✅ Nunca commitas secrets al repositorio
- ✅ Usa Railway's secret management
- ✅ Rota API keys regularmente

### **Headers de Seguridad**
```javascript
// En tu backend
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### **Rate Limiting**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🎯 Checklist de Deploy

Antes de hacer deploy, verifica:

- [ ] ✅ Todas las variables de entorno configuradas
- [ ] ✅ MongoDB Atlas configurado y accessible
- [ ] ✅ API keys válidas y con crédito
- [ ] ✅ Frontend build sin errores
- [ ] ✅ Backend build sin errores
- [ ] ✅ Tests pasando
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Health check funcionando
- [ ] ✅ Dockerfile optimizado
- [ ] ✅ railway.toml configurado

## 📞 Soporte

¿Problemas con el deploy?

- 📖 **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- 💬 **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- 🐛 **Nuestro Discord**: [discord.gg/plataforma-educativa](https://discord.gg/plataforma-educativa)
- 📧 **Email**: deployment@plataforma-educativa.com

---

## 🎉 ¡Deploy Exitoso!

Si llegaste hasta aquí, ¡felicidades! Tu aplicación debería estar funcionando en:

**🌐 URL**: `https://tu-proyecto-production.railway.app`

### **Próximos Pasos**
1. **[Configurar dominio personalizado](./custom-domain.md)**
2. **[Configurar monitoreo avanzado](./monitoring.md)**
3. **[Optimizar performance](./performance.md)**
4. **[Configurar backups](./backups.md)** 