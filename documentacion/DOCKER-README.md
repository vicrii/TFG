# 🐳 Docker Setup - Proyecto DAW

## 🚀 Inicio Rápido

```bash
# 1. Clonar proyecto
git clone https://github.com/vicrii/TFG.git
cd TFG

# 2. Iniciar todo con Docker
docker-compose up --build
```

## 📱 URLs después de iniciar

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend**: http://localhost:5000
- 🗄️ **MongoDB**: mongodb://localhost:27017

## 🔐 Credenciales

### Base de Datos
- **Usuario**: admin
- **Contraseña**: password123
- **Base de datos**: plataforma_educativa

### Aplicación (usuarios de prueba)
- **Admin**: admin@plataforma.com / admin123
- **Instructor**: instructor@plataforma.com / instructor123
- **Estudiante**: estudiante@plataforma.com / estudiante123

## ⚡ Comandos Útiles

```bash
# Iniciar servicios
docker-compose up

# Iniciar servicios en background
docker-compose up -d

# Reconstruir e iniciar
docker-compose up --build

# Ver logs
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Ver estado de servicios
docker-compose ps
```

## 🔧 Estructura de Servicios

- **mongodb**: Base de datos MongoDB 7.0
- **backend**: API Node.js con Express (puerto 5000)
- **frontend**: Aplicación React con Vite (puerto 5173)

## 📝 Variables de Entorno Opcionales

Crear archivo `.env` en la raíz para personalizar:

```env
# APIs opcionales
OPENAI_API_KEY=tu-clave-openai
YOUTUBE_API_KEY=tu-clave-youtube
```

## ❗ Troubleshooting

### Puerto en uso
```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :5173
netstat -ano | findstr :5000

# Cambiar puertos en docker-compose.yml si necesario
```

### Error de permisos
```bash
# En Windows, asegurar que Docker Desktop está corriendo
# En Linux/Mac, usar sudo si es necesario
sudo docker-compose up --build
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## ✅ Verificación

1. ✅ Frontend carga en http://localhost:5173
2. ✅ Backend responde en http://localhost:5000/api/health
3. ✅ MongoDB conectado (no errores en logs)
4. ✅ Puedes hacer login con credenciales de prueba

---

## 🆚 Docker vs Desarrollo Local

### ✅ **Usa Docker cuando:**
- Quieres probar rápido
- No quieres instalar MongoDB localmente
- Quieres un entorno aislado
- Estás evaluando el proyecto DAW

### ✅ **Usa desarrollo local cuando:**
- Vas a desarrollar/modificar código
- Quieres debugging más fácil
- Tienes MongoDB ya instalado
- Necesitas mejor rendimiento

---

**¡Listo para evaluar el proyecto DAW! 🚀** 