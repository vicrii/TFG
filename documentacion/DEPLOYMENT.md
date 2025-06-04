# Guía de Despliegue en AWS Academy

## Opción 1: AWS Amplify (Recomendada - Más fácil)

### Requisitos previos
- Cuenta de AWS Academy activa
- Código subido a GitHub/GitLab
- Node.js 18+ instalado localmente (para testing)

### Pasos para desplegar:

1. **Accede a AWS Academy**
   - Inicia sesión en AWS Academy
   - Ve al módulo/lab que tengas asignado
   - Inicia tu sesión de laboratorio

2. **Accede a AWS Amplify**
   - En la consola de AWS, busca "Amplify" en el buscador
   - Haz clic en "AWS Amplify"

3. **Crear nueva aplicación**
   - Haz clic en "New app" > "Host web app"
   - Selecciona tu proveedor de código (GitHub, GitLab, etc.)
   - Autoriza AWS para acceder a tu repositorio

4. **Configurar el build**
   - Selecciona tu repositorio
   - Selecciona la rama (main/master)
   - AWS detectará automáticamente que es una app React
   - El archivo `amplify.yml` ya está configurado

5. **Configurar variables de entorno (Opcional)**
   ```
   REACT_APP_API_URL=https://tu-backend-url.com
   REACT_APP_ENVIRONMENT=production
   ```

6. **Desplegar**
   - Haz clic en "Save and deploy"
   - Espera a que termine el proceso (5-10 minutos)
   - ¡Tu app estará disponible en la URL que te proporcione Amplify!

### Ventajas de Amplify:
- ✅ Despliegue automático con cada push a GitHub
- ✅ CDN global incluido
- ✅ SSL certificado automático
- ✅ Muy fácil de configurar
- ✅ Rollbacks automáticos si algo falla

---

## Opción 2: Amazon S3 + CloudFront

### Pasos para desplegar:

1. **Construir la aplicación**
   ```bash
   cd front
   npm run build
   ```

2. **Crear bucket S3**
   - Ve a S3 en la consola AWS
   - Crea un nuevo bucket con un nombre único
   - Habilita "Static website hosting"
   - Configura `index.html` como documento de índice
   - Configura `index.html` como documento de error (para React Router)

3. **Configurar permisos**
   - Desactiva "Block all public access"
   - Agrega esta policy al bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::tu-bucket-name/*"
       }
     ]
   }
   ```

4. **Subir archivos**
   - Sube todos los archivos de la carpeta `front/dist/` al bucket
   - Mantén la estructura de carpetas

5. **Configurar CloudFront (Opcional pero recomendado)**
   - Ve a CloudFront en la consola AWS
   - Crea una nueva distribución
   - Selecciona tu bucket S3 como origen
   - Configura error pages para redirigir 404 a `/index.html`

---

## Opción 3: EC2 con Nginx

### Para más control y backend:

1. **Lanzar instancia EC2**
   - AMI: Amazon Linux 2
   - Tipo: t2.micro (gratis)
   - Configura security group: HTTP (80), HTTPS (443), SSH (22)

2. **Conectar y configurar**
   ```bash
   # Actualizar sistema
   sudo yum update -y
   
   # Instalar Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18
   
   # Instalar Nginx
   sudo yum install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   
   # Clonar repositorio
   git clone https://github.com/vicrii/TFG.git
   cd TFG
   cd front
   npm install
   npm run build
   
   # Configurar Nginx
   sudo cp -r dist/* /var/www/html/
   ```

3. **Configurar Nginx para React Router**
   ```nginx
   # /etc/nginx/conf.d/default.conf
   server {
       listen 80;
       server_name _;
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## Variables de Entorno para Producción

Crea un archivo `.env.production` en la carpeta `front/`:

```env
REACT_APP_API_URL=https://tu-backend-production.com
REACT_APP_ENVIRONMENT=production
REACT_APP_SOLANA_NETWORK=mainnet-beta
```

---

## Comandos útiles para debugging

```bash
# Verificar build local
cd front
npm run build
npm run preview

# Verificar que no hay errores de TypeScript
npm run type-check

# Verificar que no hay errores de linting
npm run lint
```

---

## Solución de problemas comunes

### 1. Error 404 en rutas de React Router
- **Solución**: Asegúrate de que el archivo `_redirects` está en `public/`
- Para S3: Configura error page 404 → `/index.html`

### 2. Variables de entorno no funcionan
- **Solución**: Las variables deben empezar con `REACT_APP_`

### 3. Problemas con CORS en production
- **Solución**: Configura tu backend para permitir el dominio de producción

### 4. Assets no cargan (CSS, JS)
- **Solución**: Verifica que `homepage` en `package.json` está configurado correctamente

---

## Recomendación Final

**Para AWS Academy, usa AWS Amplify** porque:
- Es más fácil de configurar
- Maneja automáticamente el CI/CD
- Incluye CDN y SSL gratis
- Es perfecto para aplicaciones React
- No necesitas gestionar servidores 