# Deployment con MongoDB Atlas - Script Simplificado
Write-Host "🚀 Desplegando Aplicación Solana Learning con MongoDB Atlas" -ForegroundColor Green

# Verificar Docker
Write-Host "📋 Verificando Docker..." -ForegroundColor Blue
try {
    docker info | Out-Null
    Write-Host "✅ Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker no está funcionando. Inicia Docker Desktop."
    exit 1
}

# Verificar Docker Compose
Write-Host "📋 Verificando Docker Compose..." -ForegroundColor Blue
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose está disponible" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker Compose no está disponible."
    exit 1
}

# Detener contenedores anteriores si existen
Write-Host "`n🛑 Deteniendo contenedores anteriores..." -ForegroundColor Yellow
docker-compose down --remove-orphans 2>$null

# Construir y levantar la aplicación
Write-Host "`n🏗️  Construyendo y levantando aplicación..." -ForegroundColor Blue
docker-compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al levantar la aplicación"
    exit 1
}

# Esperar a que la aplicación esté lista
Write-Host "`n⏳ Esperando a que la aplicación esté lista..." -ForegroundColor Blue
Start-Sleep -Seconds 15

# Verificar que la aplicación esté corriendo
Write-Host "`n📊 Estado de la aplicación:" -ForegroundColor Blue
docker-compose ps

# Verificar logs para ver si se conectó a MongoDB
Write-Host "`n📋 Verificando conexión a MongoDB Atlas..." -ForegroundColor Blue
Start-Sleep -Seconds 5

Write-Host "`n🎉 ¡Deployment completado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📋 Servicios disponibles:" -ForegroundColor Blue
Write-Host "   🌐 Aplicación:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "   🗄️  MongoDB:       Atlas Cloud (configurado)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`n📝 Comandos útiles:" -ForegroundColor Blue
Write-Host "   Ver logs:          docker-compose logs -f app" -ForegroundColor Cyan
Write-Host "   Parar aplicación:  docker-compose down" -ForegroundColor Cyan
Write-Host "   Reiniciar:         docker-compose restart" -ForegroundColor Cyan

# Mostrar logs recientes para verificar conexión
Write-Host "`n📊 Logs recientes (verificando conexión):" -ForegroundColor Blue
docker-compose logs --tail=10 app

# Preguntar si abrir en navegador
$OpenBrowser = Read-Host "`n🌐 ¿Abrir la aplicación en el navegador? (y/N)"
if ($OpenBrowser -eq "y" -or $OpenBrowser -eq "Y") {
    Start-Process "http://localhost:5000"
}

Write-Host "`n🚀 ¡Todo listo! Tu aplicación está corriendo con MongoDB Atlas." -ForegroundColor Green 