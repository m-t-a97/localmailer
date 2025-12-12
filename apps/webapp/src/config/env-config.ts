const ENV_CONFIG = {
  databaseUrl: process.env.DATABASE_URL as string,
} as const;

export default ENV_CONFIG;
