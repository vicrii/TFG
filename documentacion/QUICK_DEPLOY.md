# 🚀 Despliegue Rápido en AWS Academy

## ✅ Preparación (Ya completada)
- ✅ Build de producción funcionando
- ✅ Archivos de configuración creados (`amplify.yml`, `_redirects`)
- ✅ Código listo para desplegar

## 🎯 OPCIÓN MÁS FÁCIL: AWS Amplify

### 1. Sube tu código a GitHub
```bash
git add .
git commit -m "Ready for AWS deployment"
git push origin main
```

### 2. En AWS Academy:
1. **Inicia tu laboratorio** en AWS Academy
2. **Busca "Amplify"** en la consola de AWS
3. **Clic en "New app" → "Host web app"**
4. **Conecta GitHub** y selecciona este repositorio
5. **Build settings**: AWS detectará automáticamente React
6. **Deploy**: Espera 5-10 minutos

### 3. ¡Listo! 🎉
Tu aplicación estará disponible en una URL como:
`https://main.d1234567890.amplifyapp.com`

---

## 🔧 Configuración de Variables (Si tienes backend)

En AWS Amplify → Environment variables:
```
REACT_APP_API_URL = https://tu-backend-url.com
REACT_APP_ENVIRONMENT = production
```

---

## 📋 Lista de verificación pre-despliegue

- ✅ `npm run build` funciona sin errores
- ✅ Código subido a GitHub/GitLab
- ✅ Variables de entorno configuradas (si es necesario)
- ✅ Archivos `amplify.yml` y `_redirects` en su lugar

---

## 🆘 Si algo sale mal

### Error de build:
1. Verifica que el build funciona localmente: `npm run build`
2. Revisa los logs en Amplify console

### Error 404 en rutas:
- El archivo `_redirects` debe estar en `front/public/`

### Variables de entorno no funcionan:
- Deben empezar con `REACT_APP_`
- Configurar en Amplify Console → Environment variables

---

## 💰 Costo
- ✅ **GRATIS** en AWS Academy
- ✅ Incluye CDN, SSL, y hosting
- ✅ 1000 build minutes/mes gratis

¡Tu aplicación de Solana Learn estará en línea en menos de 15 minutos! 🚀 