import { z } from "zod";

// TYPES

export type StoredEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  date: Date;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
};

// SCHEMAS

export const smtpServerActionSchema = z.enum(["start", "stop"]);
export type SmtpServerAction = z.infer<typeof smtpServerActionSchema>;
