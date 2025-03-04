import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { JSX } from "react";
import fs, { promises as fsPromises } from "fs";
import path from "path";

import ENV_CONFIG from "@/config/env-config";
import { generateEmailId } from "@/utils";
import { StoredEmail } from "@/types";

const localTransport = nodemailer.createTransport({
  host: ENV_CONFIG.smtp.host,
  port: 2525,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
});

const emailsDir = path.join(process.cwd(), "emails-history");
if (!fs.existsSync(emailsDir)) {
  fs.mkdirSync(emailsDir, { recursive: true });
}

export async function saveEmail(email: StoredEmail): Promise<void> {
  const filePath = path.join(emailsDir, `${email.id}.json`);

  await fsPromises.writeFile(
    filePath,
    JSON.stringify(
      email,
      (key, value) => {
        // Convert Buffer to base64 string for storage
        if (key === "content" && Buffer.isBuffer(value)) {
          return value.toString("base64");
        }
        return value;
      },
      2,
    ),
  );
}

export async function getAllEmails(): Promise<StoredEmail[]> {
  try {
    const files = await fsPromises.readdir(emailsDir);

    const emailPromises = files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const content = await fsPromises.readFile(
          path.join(emailsDir, file),
          "utf8",
        );

        const email = JSON.parse(content, (key, value) => {
          // Convert base64 string back to Buffer for attachments
          if (key === "content" && typeof value === "string") {
            return Buffer.from(value, "base64");
          }
          return value;
        });

        return email as StoredEmail;
      });

    const emails = await Promise.all(emailPromises);

    return emails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error("Error reading emails:", error);
    return [];
  }
}

export async function getEmailById(id: string): Promise<StoredEmail | null> {
  try {
    const filePath = path.join(emailsDir, `${id}.json`);
    const content = await fsPromises.readFile(filePath, "utf8");
    const email = JSON.parse(content, (key, value) => {
      // Convert base64 string back to Buffer for attachments
      if (key === "content" && typeof value === "string") {
        return Buffer.from(value, "base64");
      }
      return value;
    });

    return email as StoredEmail;
  } catch (error) {
    console.error(`Error reading email ${id}:`, error);
    return null;
  }
}

export async function sendEmail({
  from,
  to,
  subject,
  reactEmail,
  text,
  attachments = [],
}: {
  from: string;
  to: string | string[];
  subject: string;
  reactEmail?: JSX.Element;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}) {
  try {
    const toAddresses = Array.isArray(to) ? to : [to];
    // Render React email component to HTML if provided
    const html = reactEmail ? await render(reactEmail) : undefined;
    const info = await localTransport.sendMail({
      from,
      to: toAddresses.join(", "),
      subject,
      text:
        text ||
        (html
          ? "Please view this email in an HTML compatible email client"
          : ""),
      html,
      attachments,
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
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const toAddresses = Array.isArray(to) ? to : [to];
    const email: StoredEmail = {
      id: generateEmailId(),
      from,
      to: toAddresses,
      subject,
      text: text || "",
      html,
      date: new Date(),
    };
    await saveEmail(email);

    console.log(`Email saved with ID: ${email.id}`);

    return { success: true, emailId: email.id };
  } catch (error) {
    console.error("Error saving email:", error);
    return { success: false, error };
  }
}
