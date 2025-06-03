declare module 'youtube-dl-exec' {
  interface Flags {
    dumpSingleJson?: boolean;
    noWarnings?: boolean;
    noCallHome?: boolean;
    noCheckCertificate?: boolean;
    preferFreeFormats?: boolean;
    youtubeSkipDashManifest?: boolean;
    extractAudio?: boolean;
    audioFormat?: string;
    output?: string;
  }

  interface VideoInfo {
    title: string;
    duration: number;
    uploader: string;
    upload_date: string;
    description: string;
  }

  function youtubeDl(url: string, flags?: Flags): Promise<VideoInfo | string>;

  export default youtubeDl;
} 