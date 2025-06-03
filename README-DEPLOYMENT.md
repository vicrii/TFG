# 🚀 Solana Learn - Despliegue con Docker

## ⚡ Despliegue en 1 Comando

### 📋 Prerequisitos:
- EC2 instance (t2.micro o superior)
- Puertos abiertos: 80, 443
- Git instalado

### 🚀 Instalación Completa:

```bash
# 1. Instalar Docker y Docker Compose
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Logout y volver a conectar
exit
```

### 🎯 Despliegue de la Aplicación:

```bash
# Clonar repositorio
git clone https://github.com/vicrii/TFG.git
cd TFG

# ¡EJECUTAR TODO CON 1 COMANDO!
docker-compose up --build -d
```

## ✅ Resultado:

- **Aplicación**: `https://TU-IP-EC2` (ej: https://3.89.10.184)
- **SSL**: ✅ Automático
- **Frontend**: ✅ React con Vite
- **Backend**: ✅ Node.js + MongoDB Atlas
- **Wallets**: ✅ Phantom, Solflare funcionando

## 🔧 Comandos Útiles:

```bash
# Ver logs
docker-compose logs -f

# Parar aplicación
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up --build -d
```

## 🔧 Configuración Automática:

El docker-compose incluye:
- ✅ Nginx con SSL automático
- ✅ Certificados autofirmados
- ✅ Proxy reverso configurado
- ✅ Variables de entorno
- ✅ Red interna Docker
- ✅ Volúmenes persistentes

## 🌐 Acceso:

1. Ve a `https://TU-IP-EC2`
2. Acepta el certificado autofirmado
3. ¡Disfruta tu aplicación Solana Learn!

---

**¡Despliegue completo en menos de 10 minutos!** 🎉 