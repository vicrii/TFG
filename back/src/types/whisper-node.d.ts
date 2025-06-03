declare module '@whisper-node/core' {
  interface WhisperNodeOptions {
    modelName: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language?: string;
  }

  export class WhisperNode {
    constructor(options: WhisperNodeOptions);
    transcribe(audioPath: string): Promise<string>;
  }
} 