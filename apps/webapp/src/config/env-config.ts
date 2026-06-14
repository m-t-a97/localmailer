const ENV_CONFIG = {
  databaseUrl: process.env.DATABASE_URL as string,
  smtp: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT) || 2525,
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
  logLevel: process.env.LOG_LEVEL || "info",
} as const;

export default ENV_CONFIG;
