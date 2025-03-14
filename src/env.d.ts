// 环境变量类型定义

// 让TypeScript识别process.env中的环境变量
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    API_BASE_URL: string;
    PUBLIC_SUBSCRIPTION_KEY: string;
    PUBLIC_REGION: string;
    [key: string]: string | undefined;
  }
}

export {}; 