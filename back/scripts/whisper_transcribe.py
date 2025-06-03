import sys
import os
import io # Importar io

# Forzar codificación UTF-8 para stdout y stderr para el idioma 
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Imprimimos información de depuración
print(f"Python ejecutándose desde: {sys.executable}", file=sys.stderr)
print(f"Directorio actual: {os.getcwd()}", file=sys.stderr)
print(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'No establecido')}", file=sys.stderr)
print(f"PATH: {os.environ.get('PATH', 'No establecido')}", file=sys.stderr)

try:
    import whisper
    print(f"Whisper importado correctamente: {whisper.__file__}", file=sys.stderr)
except ImportError as e:
    print(f"ERROR DE IMPORTACIÓN: {str(e)}", file=sys.stderr)
    print("Asegúrate de instalar whisper con: pip install openai-whisper", file=sys.stderr)
    sys.exit(1)

import subprocess

def check_ffmpeg():
    """Verifica si FFmpeg está disponible en el sistema o en la carpeta local"""
    # Primero intenta usar ffmpeg del PATH
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("FFmpeg encontrado en el PATH", file=sys.stderr)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        # Si no está en el PATH, busca en la carpeta local
        local_ffmpeg = os.path.join(os.path.dirname(__file__), 'ffmpeg', 'bin', 'ffmpeg.exe')
        if os.path.exists(local_ffmpeg):
            # Agrega la carpeta local al PATH temporalmente
            os.environ['PATH'] = os.path.join(os.path.dirname(__file__), 'ffmpeg', 'bin') + os.pathsep + os.environ['PATH']
            print(f"FFmpeg encontrado en: {local_ffmpeg}", file=sys.stderr)
            return True
        
        # Si no está en la carpeta local, intenta usar la ruta del sistema
        system_ffmpeg = os.path.join('C:', 'Users', 'victo', 'Desktop', 'aaaa', 'ffmpeg-master-latest-win64-gpl', 'bin', 'ffmpeg.exe')
        if os.path.exists(system_ffmpeg):
            os.environ['PATH'] = os.path.join('C:', 'Users', 'victo', 'Desktop', 'aaaa', 'ffmpeg-master-latest-win64-gpl', 'bin') + os.pathsep + os.environ['PATH']
            print(f"FFmpeg encontrado en: {system_ffmpeg}", file=sys.stderr)
            return True
            
        print("ERROR: FFmpeg no encontrado en ninguna ubicación", file=sys.stderr)
        return False

def find_audio_file(base_path):
    """Busca archivos de audio en la carpeta temporal"""
    if os.path.exists(base_path):
        return base_path
    
    # Si no existe, busca en las subcarpetas de temp
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
    if not os.path.exists(temp_dir):
        return None
        
    # Busca en todas las subcarpetas de temp
    for root, files in os.walk(temp_dir):
        for file in files:
            if file.lower().endswith(('.mp3', '.wav', '.webm')):
                return os.path.join(root, file)
    
    return None

def transcribe_audio(audio_path, language='es'):
    try:
        # Verificar que el archivo existe
        if not os.path.exists(audio_path):
            print(f"ERROR: El archivo {audio_path} no existe", file=sys.stderr)
            sys.exit(1)

        # Verificar tamaño del archivo
        file_size = os.path.getsize(audio_path)
        print(f"El archivo existe y su tamaño es: {file_size} bytes", file=sys.stderr)
        
        if file_size == 0:
            print(f"ERROR: El archivo está vacío", file=sys.stderr)
            sys.exit(1)

        # Verificar FFmpeg
        if not check_ffmpeg():
            print("ERROR: FFmpeg no encontrado. Es necesario para la transcripción.", file=sys.stderr)
            sys.exit(1)
        
        print(f"Iniciando transcripción de: {audio_path}", file=sys.stderr)
        
        try:
            model = whisper.load_model('tiny')
            print(f"Modelo cargado correctamente", file=sys.stderr)
            
            result = model.transcribe(audio_path, language=language)
            print(f"Transcripción completada con éxito", file=sys.stderr)
            
            # Imprimir el texto transcrito en la salida estándar
            print(result['text'], flush=True)
            sys.exit(0)
        except Exception as e:
            print(f"ERROR durante la transcripción: {str(e)}", file=sys.stderr)
            import traceback
            print(f"Detalles del error: {traceback.format_exc()}", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR general: {str(e)}", file=sys.stderr)
        import traceback
        print(f"Detalles del error: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

def main():
    if len(sys.argv) != 2:
        print("Uso: python whisper_transcribe.py <ruta_al_audio>")
        sys.exit(1)

    audio_path = sys.argv[1]
    print(f"Recibida ruta de audio: {audio_path}", file=sys.stderr)
    
    # Verificar si la ruta es relativa y convertirla a absoluta
    if not os.path.isabs(audio_path):
        abs_audio_path = os.path.abspath(audio_path)
        print(f"Convirtiendo ruta relativa a absoluta: {abs_audio_path}", file=sys.stderr)
        audio_path = abs_audio_path
    
    # Si la ruta no existe, intenta encontrar el archivo
    if not os.path.exists(audio_path):
        found_path = find_audio_file(audio_path)
        if found_path:
            print(f"Archivo encontrado en: {found_path}", file=sys.stderr)
            audio_path = found_path
        else:
            print(f"Error: No se encontró ningún archivo de audio en {audio_path} o en la carpeta temp", file=sys.stderr)
            sys.exit(1)

    transcribe_audio(audio_path)

if __name__ == "__main__":
    main()