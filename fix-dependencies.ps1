# Fix Dependencies Script - Web-Only Wallets
Write-Host "🔧 Fixing npm dependencies for Solana project (Web-Only Wallets)" -ForegroundColor Green

# Check Node.js version
Write-Host "`n📋 Checking Node.js version..." -ForegroundColor Blue
$nodeVersion = node --version
Write-Host "Current Node.js version: $nodeVersion" -ForegroundColor Yellow

if ($nodeVersion -lt "v20.18.0") {
    Write-Host "⚠️  Warning: Node.js version is below recommended v20.18.0 for Solana packages" -ForegroundColor Red
    Write-Host "   Consider upgrading Node.js to v20.18.0 or higher" -ForegroundColor Yellow
}

# Clean frontend dependencies aggressively
Write-Host "`n🧹 Cleaning frontend dependencies..." -ForegroundColor Blue
Set-Location front
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}
if (Test-Path ".npm") {
    Remove-Item -Recurse -Force .npm
    Write-Host "✅ Removed .npm cache" -ForegroundColor Green
}

# Clear npm cache
Write-Host "`n🗑️  Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force

# Install frontend dependencies with legacy peer deps
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Blue
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully" -ForegroundColor Green
    
    # Verify no USB package was installed
    Write-Host "`n🔍 Verifying no hardware wallet dependencies..." -ForegroundColor Blue
    if (Test-Path "node_modules/usb") {
        Write-Host "⚠️  WARNING: USB package was still installed!" -ForegroundColor Red
        Write-Host "   Some wallet adapter may have hardware wallet dependencies" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No USB package found - hardware wallets successfully excluded" -ForegroundColor Green
    }
} else {
    Write-Error "❌ Frontend dependency installation failed"
    Set-Location ..
    exit 1
}

# Clean and install backend dependencies
Write-Host "`n🧹 Cleaning backend dependencies..." -ForegroundColor Blue
Set-Location ../back
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Removed backend node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Removed backend package-lock.json" -ForegroundColor Green
}

Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Error "❌ Backend dependency installation failed"
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "`n🎉 Dependencies fixed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🌐 Web-Only Wallets Configured:" -ForegroundColor Blue
Write-Host "   ✅ Phantom (Most popular)" -ForegroundColor Green
Write-Host "   ✅ Solflare (Second most popular)" -ForegroundColor Green
Write-Host "   ❌ Hardware wallets excluded (no USB dependencies)" -ForegroundColor Yellow
Write-Host "`n📋 Next steps:" -ForegroundColor Blue
Write-Host "   1. Test frontend: cd front && npm run dev" -ForegroundColor Yellow
Write-Host "   2. Test backend: cd back && npm run dev" -ForegroundColor Yellow
Write-Host "   3. Build Docker image: ./simple-deploy.ps1" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green 