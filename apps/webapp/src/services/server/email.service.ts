import "temporal-polyfill/global";

import { JSX } from "react";

import { render } from "@react-email/render";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import nodemailer from "nodemailer";

import { validateComposedEmail, ComposedEmail, NewComposedEmail } from "@repo/data-commons";

import ENV_CONFIG from "@/config/env-config";
import { db } from "@/prisma/db";

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

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof (value as any).epochMilliseconds === "number") {
    return new Date((value as any).epochMilliseconds);
  }
  if (typeof (value as any).epochNanoseconds === "bigint") {
    return new Date(Number((value as any).epochNanoseconds / 1_000_000n));
  }
  return new Date(value as any);
}

function normalizeRecord(record: any) {
  if (!record || typeof record !== "object") return record;
  return {
    ...record,
    date: toDate(record.date),
    createdAt: toDate(record.createdAt) ?? record.createdAt,
  };
}

export async function getAllEmails(): Promise<ComposedEmail[]> {
  try {
    const records = await db.orm.public.ComposedEmails.orderBy((u) => u.createdAt.desc()).all();

    if (records.length === 0) {
      return [];
    }

    const storedEmails = records
      .map((record: any) => {
        const normalized = normalizeRecord(record);
        const validationResult = validateComposedEmail(normalized);

        if (!validationResult.success) {
          console.error(validationResult.error);
          return null;
        }

        return {
          ...validationResult.value,
        } as ComposedEmail;
      })
      .filter((value: ComposedEmail | null) => !!value);

    return storedEmails;
  } catch (error) {
    console.error("Error reading emails:", error);
    return [];
  }
}

export async function getEmailById(id: string): Promise<ComposedEmail | null> {
  try {
    const result: any = await db.orm.public.ComposedEmails.where({ id }).all();
    const record = Array.isArray(result) ? result[0] : result;
    if (!record) {
      return null;
    }

    const normalized = normalizeRecord(record);
    const validationResult = validateComposedEmail(normalized);

    if (!validationResult.success) {
      console.error(validationResult.error);
      return null;
    }

    return validationResult.value;
  } catch (error) {
    console.error(`Error reading email ${id}:`, error);
    return null;
  }
}

export async function deleteEmailById(id: string): Promise<void> {
  try {
    await db.orm.public.ComposedEmails.where({ id }).delete();
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
      text: text || (html ? "Please view this email in an HTML compatible email client" : ""),
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

export async function saveEmail(email: NewComposedEmail): Promise<ComposedEmail> {
  if (email.html) {
    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    email.html = purify.sanitize(email.html);
  }

  const record = await db.orm.public.ComposedEmails.create({
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    date: email.date
      ? typeof (globalThis as any).Temporal !== "undefined"
        ? (globalThis as any).Temporal.Instant.from(email.date.toISOString())
        : email.date
      : null,
  });

  const normalized = normalizeRecord(record);
  const validationResult = validateComposedEmail(normalized);

  if (!validationResult.success) {
    return Promise.reject(new Error(validationResult.error));
  }

  return {
    ...validationResult.value,
  };
}
