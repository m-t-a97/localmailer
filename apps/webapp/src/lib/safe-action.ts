import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

import { logger } from "./logger/logger-server";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e, utils) {
    // You can access these properties inside the `utils` object.
    const { clientInput, bindArgsClientInputs, metadata, ctx } = utils;

    logger.error(e, "Action error");

    if (e instanceof ActionError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

// Auth client defined by extending the base one.
// Note that the same initialisation options and middleware functions of the base client
// will also be used for this one.
export const authActionClient = actionClient
  // Define authorization middleware.
  .use(async ({ next }) => {
    // TODO: Return the next middleware with the auth user value in the context
    return next({ ctx: {} });
  });
