import { JSX } from "react";

import { render } from "@react-email/render";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import nodemailer from "nodemailer";

import {
  validateComposedEmail,
  ComposedEmail,
  NewComposedEmail,
  NewEmailAttachment,
} from "@repo/data-commons";

import ENV_CONFIG from "@/config/env-config";
import prisma from "@/lib/prisma-client";

import { S3Service } from "./s3.service";
import { S3Dependencies, createS3Dependencies, createS3Service } from "./s3.service";

const localTransport = nodemailer.createTransport({
  host: ENV_CONFIG.smtp.host,
  port: ENV_CONFIG.smtp.port,
  secure: false,
  auth: {
    user: ENV_CONFIG.smtp.user,
    pass: ENV_CONFIG.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function getAllEmails(includeAttachments = false): Promise<ComposedEmail[]> {
  try {
    const records = await prisma.composedEmail.findMany({
      include: includeAttachments ? { attachments: true } : undefined,
      orderBy: { createdAt: "desc" },
    });

    if (records.length === 0) {
      return [];
    }

    const storedEmails = records
      .map((record: any) => {
        const validationResult = validateComposedEmail(record);

        if (!validationResult.success) {
          console.error(validationResult.error);
          return null;
        }

        return { ...validationResult.value, attachments: (record as any).attachments || [] } as ComposedEmail & { attachments: any[] };
      })
      .filter((value: ComposedEmail | null) => !!value) as (ComposedEmail & { attachments: any[] })[];

    return storedEmails;
  } catch (error) {
    console.error("Error reading emails:", error);
    return [];
  }
}

export async function getEmailById(
  id: string,
  includeAttachments = false,
): Promise<ComposedEmail | null> {
  try {
    const record = await prisma.composedEmail.findUnique({
      where: { id },
      include: includeAttachments ? { attachments: true } : undefined,
    });

    if (!record) {
      return null;
    }

    const validationResult = validateComposedEmail(record);

    if (!validationResult.success) {
      console.error(validationResult.error);
      return null;
    }

    return { ...validationResult.value, attachments: (record as any).attachments || [] } as ComposedEmail & { attachments: any[] };
  } catch (error) {
    console.error(`Error reading email ${id}:`, error);
    return null;
  }
}

export async function deleteEmailById(
  id: string,
  s3Service?: S3Service,
): Promise<void> {
  try {
    if (s3Service) {
      await s3Service.deleteAttachmentsByEmailId(id);
    }

    await prisma.composedEmail.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting email ${id}:`, error);
    throw new Error("Failed to delete email");
  }
}

export async function sendEmail({
  from,
  to,
  subject,
  reactEmail,
  text,
}: {
  from: string;
  to: string[];
  subject: string;
  reactEmail?: JSX.Element;
  text: string;
}) {
  try {
    const toAddresses = Array.isArray(to) ? to : [to];

    const html = reactEmail ? await render(reactEmail) : undefined;

    const info = await localTransport.sendMail({
      from,
      to: toAddresses,
      subject,
      text:
        text ||
        (html
          ? "Please view this email in an HTML compatible email client"
          : ""),
      html,
    });

    console.log("Email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function constructAndSaveEmail({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  try {
    const toAddresses = Array.isArray(to) ? to : [to];

    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    const sanitisedHtml = purify.sanitize(html);

    const email: NewComposedEmail = {
      from,
      to: toAddresses,
      subject,
      html: sanitisedHtml,
      text,
      date: null,
    };
    const storedEmail = await saveEmail(email);

    return { success: true, emailId: storedEmail.id };
  } catch (error) {
    console.error("Error saving email:", error);
    return { success: false, error };
  }
}

export async function saveEmail(
  email: NewComposedEmail,
  attachments?: { contentId: string | null; s3Key: string; filename: string; contentType: string; size: number }[],
): Promise<ComposedEmail> {
  if (email.html) {
    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    email.html = purify.sanitize(email.html);
  }

  const record = await prisma.composedEmail.create({
    data: {
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      date: email.date,
      attachments: attachments
        ? {
            create: attachments.map((att) => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
              s3Key: att.s3Key,
              contentId: att.contentId,
            })),
          }
        : undefined,
    },
    include: attachments ? { attachments: true } : undefined,
  });

  const validationResult = validateComposedEmail(record);

  if (!validationResult.success) {
    return Promise.reject(new Error(validationResult.error));
  }

  return { ...validationResult.value, attachments: (record as any).attachments || [] } as ComposedEmail & { attachments: any[] };
}

export function createS3ServiceFromEnv() {
  const deps = createS3Dependencies({
    endpoint: ENV_CONFIG.s3.endpoint,
    bucket: ENV_CONFIG.s3.bucket,
    credentials: {
      accessKeyId: ENV_CONFIG.s3.accessKey,
      secretAccessKey: ENV_CONFIG.s3.secretKey,
    },
    region: ENV_CONFIG.s3.region,
    forcePathStyle: true,
  });
  return createS3Service(deps);
}
