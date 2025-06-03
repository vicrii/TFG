# Deployment con MongoDB - Script Completo
Write-Host "🚀 Desplegando Aplicación Solana Learning con MongoDB" -ForegroundColor Green

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

# Construir y levantar todos los servicios
Write-Host "`n🏗️  Construyendo y levantando servicios..." -ForegroundColor Blue
docker-compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al levantar los servicios"
    exit 1
}

# Esperar a que los servicios estén listos
Write-Host "`n⏳ Esperando a que los servicios estén listos..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Verificar que los servicios estén corriendo
Write-Host "`n📊 Estado de los servicios:" -ForegroundColor Blue
docker-compose ps

Write-Host "`n🎉 ¡Deployment completado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📋 Servicios disponibles:" -ForegroundColor Blue
Write-Host "   🌐 Aplicación:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "   🗄️  MongoDB:       localhost:27017" -ForegroundColor Yellow  
Write-Host "   📊 Mongo Express:  http://localhost:8081 (admin/admin123)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`n📝 Comandos útiles:" -ForegroundColor Blue
Write-Host "   Ver logs:          docker-compose logs -f" -ForegroundColor Cyan
Write-Host "   Parar servicios:   docker-compose down" -ForegroundColor Cyan
Write-Host "   Reiniciar:         docker-compose restart" -ForegroundColor Cyan

# Preguntar si abrir en navegador
$OpenBrowser = Read-Host "`n🌐 ¿Abrir la aplicación en el navegador? (y/N)"
if ($OpenBrowser -eq "y" -or $OpenBrowser -eq "Y") {
    Start-Process "http://localhost:5000"
}

Write-Host "`n🚀 ¡Todo listo! Tu aplicación está corriendo con MongoDB." -ForegroundColor Green 