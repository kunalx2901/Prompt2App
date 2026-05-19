export type Bindings = {
  MY_DURABLE_OBJECT: DurableObjectNamespace;
  DATABASE_URL: string;
  JWT_SECRET_KEY: string;
  JWT_ISSUER: string;
  JWT_EXPIRES_IN: string;
  PROMPT2APP_STORAGE: R2Bucket;
  OPENROUTER_API_KEY: string;
};
