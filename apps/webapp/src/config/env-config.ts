const ENV_CONFIG = {
  databaseUrl: process.env.DATABASE_URL as string,
  smtp: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT) || 2525,
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    bucket: process.env.S3_BUCKET || "localmailer",
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    region: process.env.S3_REGION || "us-east-1",
  },
  logLevel: process.env.LOG_LEVEL || "info",
} as const;

export default ENV_CONFIG;
