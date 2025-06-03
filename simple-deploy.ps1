# Simple Deployment Script - Docker Build y Push
Write-Host "🚀 Simple Docker Deployment" -ForegroundColor Green

# Configurar variables
$ImageName = "learning-solana-app"
$Tag = "latest"

# Verificar que Docker funciona
Write-Host "📋 Verificando Docker..." -ForegroundColor Blue
try {
    docker info | Out-Null
    Write-Host "✅ Docker está funcionando" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker no está funcionando. Asegúrate de que Docker Desktop esté ejecutándose."
    exit 1
}

# Construir la imagen
Write-Host "`n🏗️  Construyendo imagen Docker..." -ForegroundColor Blue
docker build -t ${ImageName}:${Tag} .

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al construir la imagen Docker"
    exit 1
}

Write-Host "✅ Imagen construida exitosamente: ${ImageName}:${Tag}" -ForegroundColor Green

# Mostrar información de la imagen
Write-Host "`n📊 Información de la imagen:" -ForegroundColor Blue
docker images ${ImageName}:${Tag}

# Mostrar próximos pasos
Write-Host "`n🎉 ¡Construcción completada!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📋 Próximos pasos:" -ForegroundColor Blue
Write-Host "   1. Probar localmente: docker run -p 5000:5000 ${ImageName}:${Tag}" -ForegroundColor Yellow
Write-Host "   2. Para subir a Docker Hub:" -ForegroundColor Yellow
Write-Host "      - docker tag ${ImageName}:${Tag} tusername/${ImageName}:${Tag}" -ForegroundColor Cyan
Write-Host "      - docker push tusername/${ImageName}:${Tag}" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

# Preguntar si quiere ejecutar localmente
$RunLocal = Read-Host "`n🤔 ¿Quieres probar la aplicación localmente? (y/N)"
if ($RunLocal -eq "y" -or $RunLocal -eq "Y") {
    Write-Host "🏃 Ejecutando aplicación localmente en puerto 5000..." -ForegroundColor Blue
    Write-Host "   💡 Accede a: http://localhost:5000" -ForegroundColor Yellow
    Write-Host "   ⚠️  Presiona Ctrl+C para detener" -ForegroundColor Yellow
    docker run -p 5000:5000 ${ImageName}:${Tag}
}

Write-Host "`n🚀 Script completado!" -ForegroundColor Green 