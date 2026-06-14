import pino, { Logger } from "pino";

import ENV_CONFIG from "@/config/env-config";

export const logger: Logger = pino(
  {
    level: ENV_CONFIG.logLevel || "info",
  },
  pino.transport({
    targets: [
      // Always log to stdout in JSON
      {
        target: "pino/file",
        options: {
          destination: 1, // stdout
        } as any,
        level: ENV_CONFIG.logLevel || "info",
      },
    ],
  }),
);
