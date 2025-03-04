const ENV_CONFIG = {
  smtp: {
    host: process.env.NEXT_PUBLIC_SMTP_HOST as string,
  },

  appName: process.env.NEXT_PUBLIC_APP_NAME as string,
} as const;

export default ENV_CONFIG;
