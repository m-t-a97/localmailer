import pino, { Logger } from "pino";

import ENV_CONFIG from "@/config/env-config";

export const logger: Logger = pino({
  level: ENV_CONFIG.logLevel || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});
