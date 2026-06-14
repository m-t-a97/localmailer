import { z } from "zod";

import { getValidationResult } from "./generics";

export const emailAttachmentSchema = z.object({
  id: z.string().min(1),
  emailId: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
  s3Key: z.string().min(1),
  contentId: z.string().nullable(),
  createdAt: z.date(),
});
export type EmailAttachment = z.infer<typeof emailAttachmentSchema>;

export const validateEmailAttachment = (data: unknown) =>
  getValidationResult<EmailAttachment>(data, emailAttachmentSchema);

export const newEmailAttachmentSchema = emailAttachmentSchema.omit({
  id: true,
  createdAt: true,
});
export type NewEmailAttachment = z.infer<typeof newEmailAttachmentSchema>;

export const validateNewEmailAttachment = (data: unknown) =>
  getValidationResult<NewEmailAttachment>(data, newEmailAttachmentSchema);
