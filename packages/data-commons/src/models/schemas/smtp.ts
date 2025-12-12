import { z } from "zod";

export const smtpServerActionSchema = z.enum(["start", "stop"]);
export type SmtpServerAction = z.infer<typeof smtpServerActionSchema>;
