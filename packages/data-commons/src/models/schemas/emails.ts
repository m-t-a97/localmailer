import { z } from "zod";
import { getValidationResult } from "./generics";

const composedEmailSchema = z.object({
  id: z.string().min(1),
  from: z.string().email(),
  to: z.string().email().array(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.date(),
});
export type ComposedEmail = z.infer<typeof composedEmailSchema>;

const newComposedEmailSchema = composedEmailSchema.omit({
  id: true,
  createdAt: true,
});
export type NewComposedEmail = z.infer<typeof newComposedEmailSchema>;

export const validateComposedEmail = (data: unknown) =>
  getValidationResult<ComposedEmail>(data, composedEmailSchema);
