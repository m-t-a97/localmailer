import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";

import { CapturedEmail, NewComposedEmail } from "@repo/data-commons";

import { saveEmail } from "./email.service";
import { S3Service } from "./s3.service";

let smtpServer: SMTPServer | null = null;

export function startSMTPServer(port = 2525, s3Service?: S3Service): void {
  if (smtpServer) {
    console.log("SMTP server already running");
    return;
  }

  smtpServer = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, session, callback) {
      let mailData = "";

      stream.on("data", (chunk) => {
        mailData += chunk.toString();
      });

      stream.on("end", async () => {
        try {
          const parsed = await simpleParser(mailData);

          let fromAddress = parsed.from?.text;
          if (!fromAddress && session.envelope.mailFrom) {
            if (typeof session.envelope.mailFrom === "object") {
              fromAddress = session.envelope.mailFrom.address;
            }
          }

          const toAddresses = parsed.to
            ? Array.isArray(parsed.to)
              ? parsed.to.map((addr) => addr.text.trim())
              : [parsed.to.text]
            : [];

          const captured: CapturedEmail = {
            from: fromAddress || "unknown",
            to: toAddresses,
            subject: parsed.subject || "(No Subject)",
            text: parsed.text || "",
            html: parsed.html || "",
            date: parsed.date || null,
          };

          let htmlContent = captured.html || "";
          const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;
          const savedAttachments: { contentId: string | null; s3Key: string; filename: string; contentType: string; size: number }[] = [];

          if (parsed.attachments && parsed.attachments.length > 0 && s3Service) {
            for (const attachment of parsed.attachments) {
              if (attachment.size && attachment.size > MAX_ATTACHMENT_SIZE) {
                console.warn(`Attachment "${attachment.filename}" exceeds 25MB, skipping`);
                continue;
              }

              const attachmentId = crypto.randomUUID();
              const s3Key = await s3Service.uploadAttachment(
                "pending",
                attachmentId,
                attachment.filename || "unnamed",
                attachment.content,
                attachment.contentType || "application/octet-stream",
              );

              savedAttachments.push({
                contentId: attachment.contentId || null,
                s3Key,
                filename: attachment.filename || "unnamed",
                contentType: attachment.contentType || "application/octet-stream",
                size: attachment.size || 0,
              });

              if (attachment.contentId) {
                htmlContent = htmlContent.replace(
                  new RegExp(`cid:${attachment.contentId}`, "gi"),
                  `/api/attachments/${attachmentId}/raw`,
                );
              }
            }
          }

          const email: NewComposedEmail = {
            from: captured.from,
            to: captured.to,
            subject: captured.subject,
            text: captured.text,
            html: htmlContent,
            date: captured.date,
          };

          const composedEmail = await saveEmail(email, savedAttachments.length > 0 ? savedAttachments : undefined);
          console.log(`Email received and saved with ID: ${composedEmail.id}`);
          callback();
        } catch (error) {
          console.error("Error processing email:", error);
          callback(new Error("Error processing email"));
        }
      });
    },
    onAuth(auth, session, callback) {
      callback(null, { user: auth.username });
    },
  });

  smtpServer.listen(port, () => {
    console.log(`SMTP Server running on port ${port}`);
  });

  smtpServer.on("error", (err) => {
    console.error("SMTP Server error:", err);
  });
}

export function stopSMTPServer(): void {
  if (smtpServer) {
    const server = smtpServer;
    smtpServer = null;
    server.close(() => {
      console.log("SMTP Server stopped");
    });
  }
}
