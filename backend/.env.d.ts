declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_USERNAME: string;
      REDIS_PASSWORD: string;
      MONGODB_URL: string;
      DB: string;
      COLLECTION?: string;
    }
  }
}

export {}