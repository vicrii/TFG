# 🚂 Deploy to Railway - Paso a Paso
# ========================================

Write-Host "🚂 RAILWAY DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Paso 1: Verificar que estamos en el directorio correcto
Write-Host "`n✅ Paso 1: Verificando directorio..." -ForegroundColor Green
if (!(Test-Path "front") -or !(Test-Path "back")) {
    Write-Host "❌ Error: No se encontraron las carpetas 'front' y 'back'" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Directorio correcto encontrado" -ForegroundColor Green

# Paso 2: Build del frontend
Write-Host "`n🏗️ Paso 2: Construyendo frontend..." -ForegroundColor Green
Set-Location front
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build del frontend" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ Frontend construido correctamente" -ForegroundColor Green

# Paso 3: Verificar archivos necesarios
Write-Host "`n📋 Paso 3: Verificando archivos..." -ForegroundColor Green
$requiredFiles = @(
    "Dockerfile.simple",
    "railway.toml",
    "front/dist",
    "back/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file - OK" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - FALTA" -ForegroundColor Red
        exit 1
    }
}

# Paso 4: Mostrar instrucciones para Railway
Write-Host "`n🚂 Paso 4: Instrucciones para Railway:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a https://railway.app" -ForegroundColor Yellow
Write-Host "2. Haz login con GitHub" -ForegroundColor Yellow
Write-Host "3. Crea un nuevo proyecto: New Project > Deploy from GitHub repo" -ForegroundColor Yellow
Write-Host "4. Selecciona este repositorio" -ForegroundColor Yellow
Write-Host "5. Railway detectará automáticamente:" -ForegroundColor Yellow
Write-Host "   - Dockerfile.simple" -ForegroundColor Gray
Write-Host "   - railway.toml" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Variables de entorno a configurar en Railway:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "MONGODB_URI=mongodb+srv://vicridev:OvDwlhYiLfdOdhSS@db.e0byx.mongodb.net/?retryWrites=true&w=majority" -ForegroundColor Gray
Write-Host "NODE_ENV=production" -ForegroundColor Gray
Write-Host "PORT=5000" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ ¡Proyecto listo para desplegar en Railway!" -ForegroundColor Green
Write-Host "🌐 Después del despliegue, tu app estará en: https://tu-app.railway.app" -ForegroundColor Green 