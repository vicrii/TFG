# Script para ejecutar el proyecto con HTTPS

Write-Host "🚀 Iniciando proyecto con HTTPS..." -ForegroundColor Green

# Parar servicios anteriores
docker-compose -f docker-compose.https.yml down 2>$null

# Iniciar servicios
docker-compose -f docker-compose.https.yml up --build

Write-Host ""
Write-Host "✅ Tu aplicación está en: https://localhost" -ForegroundColor Green
Write-Host "⚠️  Acepta el certificado autofirmado en tu navegador" -ForegroundColor Yellow 