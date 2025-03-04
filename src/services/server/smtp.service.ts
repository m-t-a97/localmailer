import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";

import { StoredEmail } from "@/types";
import { generateEmailId } from "@/utils";
import { saveEmail } from "./email.service";

// Create SMTP server
let smtpServer: SMTPServer | null = null;

export function startSMTPServer(port = 2525): void {
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

          const email: StoredEmail = {
            id: generateEmailId(),
            from: parsed.from?.text || "",
            to: !!parsed.to
              ? Array.isArray(parsed.to)
                ? parsed.to.map((addr) => addr.text.trim())
                : [parsed.to.text]
              : [],
            subject: parsed.subject || "(No Subject)",
            text: parsed.text || "",
            html: parsed.html || undefined,
            date: parsed.date || new Date(),
            attachments: parsed.attachments?.map((attachment) => ({
              filename: attachment.filename || "unnamed",
              contentType: attachment.contentType || "application/octet-stream",
              content: attachment.content,
            })),
          };

          await saveEmail(email);
          console.log(`Email received and saved with ID: ${email.id}`);
          callback();
        } catch (error) {
          console.error("Error processing email:", error);
          callback(new Error("Error processing email"));
        }
      });
    },
    onAuth(auth, session, callback) {
      // Accept any authentication
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
    smtpServer.close(() => {
      console.log("SMTP Server stopped");
      smtpServer = null;
    });
  }
}
