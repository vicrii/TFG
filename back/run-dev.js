const { exec } = require('child_process');
const path = require('path');

// Obtener la ruta del directorio raíz (un nivel arriba)
const rootDir = path.resolve(__dirname, '..');

// Ejecutar el comando npm run dev desde la raíz del proyecto
exec('cd "' + rootDir + '" && npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(stdout);
}); 