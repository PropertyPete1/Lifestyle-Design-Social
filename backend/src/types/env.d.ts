declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    YOUTUBE_API_KEY?: string;
    INSTAGRAM_ACCESS_TOKEN?: string;
    OPENAI_API_KEY?: string;
  }
} 