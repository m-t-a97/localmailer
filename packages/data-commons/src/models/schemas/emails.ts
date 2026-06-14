import { z } from "zod";

import { getValidationResult } from "./generics";

const composedEmailSchema = z.object({
  id: z.string().min(1),
  from: z.email(),
  to: z.email().array(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1),
  date: z.date().nullable(),
  createdAt: z.date(),
});
export type ComposedEmail = z.infer<typeof composedEmailSchema>;

export const validateComposedEmail = (data: unknown) =>
  getValidationResult<ComposedEmail>(data, composedEmailSchema);

export const newComposedEmailSchema = composedEmailSchema.omit({
  id: true,
  createdAt: true,
});
export type NewComposedEmail = z.infer<typeof newComposedEmailSchema>;

export const validateNewComposedEmail = (data: unknown) =>
  getValidationResult<NewComposedEmail>(data, newComposedEmailSchema);

export const capturedEmailSchema = z.object({
  from: z.string().default("unknown"),
  to: z.array(z.string()).default([]),
  subject: z.string().default("(No Subject)"),
  html: z.string().default(""),
  text: z.string().default(""),
  date: z.date().nullable().default(null),
});
export type CapturedEmail = z.infer<typeof capturedEmailSchema>;

export const validateCapturedEmail = (data: unknown) =>
  getValidationResult<CapturedEmail>(data, capturedEmailSchema);
