import { JSX } from "react";

import { render } from "@react-email/render";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import nodemailer from "nodemailer";

import {
  validateComposedEmail,
  ComposedEmail,
  NewComposedEmail,
} from "@repo/data-commons";

import ENV_CONFIG from "@/config/env-config";
import prisma from "@/lib/prisma-client";

const localTransport = nodemailer.createTransport({
  host: ENV_CONFIG.smtp.host,
  port: ENV_CONFIG.smtp.port,
  secure: false, // Local dev usually doesn't use SSL/TLS
  auth: {
    user: ENV_CONFIG.smtp.user,
    pass: ENV_CONFIG.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function getAllEmails(): Promise<ComposedEmail[]> {
  try {
    const records = await prisma.composedEmail.findMany();

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

        return validationResult.value;
      })
      .filter((value: ComposedEmail | null) => !!value) as ComposedEmail[];

    return storedEmails.sort(
      (a: ComposedEmail, b: ComposedEmail) =>
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
  } catch (error) {
    console.error("Error reading emails:", error);
    return [];
  }
}

export async function getEmailById(id: string): Promise<ComposedEmail | null> {
  try {
    const record = await prisma.composedEmail.findUnique({
      where: {
        id,
      },
    });

    if (!record) {
      return null;
    }

    const validationResult = validateComposedEmail(record);

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
    await prisma.composedEmail.delete({
      where: {
        id,
      },
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

    // Render React email component to HTML if provided
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
): Promise<ComposedEmail> {
  const record = await prisma.composedEmail.create({
    data: email,
  });

  const validationResult = validateComposedEmail(record);

  if (!validationResult.success) {
    return Promise.reject(new Error(validationResult.error));
  }

  return validationResult.value;
}
