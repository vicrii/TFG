declare module 'node-whisper.cpp' {
  interface WhisperOptions {
    modelName: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    modelPath: string;
    language?: string;
  }

  export class Whisper {
    constructor(options: WhisperOptions);
    transcribe(audioPath: string): Promise<string>;
  }
} 