import { simpleParser } from "mailparser";
import { SMTPServer } from "smtp-server";

import { CapturedEmail, NewComposedEmail } from "@repo/data-commons";

import { saveEmail } from "./email.service";

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

          // Extract From: prefer pure email from parsed.from.value, fallback to envelope
          let fromAddress: string = "";
          if (parsed.from?.value && parsed.from.value.length > 0) {
            fromAddress = parsed.from.value[0]?.address || "";
          }
          if (!fromAddress && parsed.from?.text) {
            const match = parsed.from.text.match(/<([^>]+)>/);
            fromAddress = match ? match[1].trim() : parsed.from.text.trim();
          }
          if (!fromAddress && (session.envelope as any)?.mailFrom) {
            const mf: any = (session.envelope as any).mailFrom;
            fromAddress = typeof mf === "object" ? mf.address || "" : String(mf);
          }
          fromAddress = (fromAddress?.trim() || "") as string;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!fromAddress || !emailRegex.test(fromAddress)) {
            const fallback = (session.envelope as any)?.mailFrom?.address;
            fromAddress =
              fallback && emailRegex.test(fallback) ? fallback : "unknown@example.com";
          }

          // Extract To: flatten all AddressObjects to pure email addresses
          let toAddresses: string[] = [];
          if (parsed.to) {
            const toArray = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
            toAddresses = toArray.flatMap((addr) => {
              if (addr.value && addr.value.length > 0) {
                return addr.value
                  .map((v) => v.address)
                  .filter((a): a is string => Boolean(a));
              }
              const txt = addr.text || "";
              const matches = txt.match(/[^,\s<>]+@[^,\s<>]+/g);
              return matches || [];
            });
          }
          if (toAddresses.length === 0 && (session.envelope as any)?.rcptTo) {
            const rcpt: any = (session.envelope as any).rcptTo;
            const rcptArray = Array.isArray(rcpt) ? rcpt : [rcpt];
            toAddresses = rcptArray
              .map((r: any) => (typeof r === "object" ? r.address : String(r)))
              .filter(Boolean)
              .map((a: string) => a.trim())
              .filter((a: string) => emailRegex.test(a));
          }
          toAddresses = toAddresses.map((a) => a.trim()).filter((a) => emailRegex.test(a));

          // Html/Text handling with fallbacks to satisfy min(1) validation
          let htmlContent: string =
            typeof parsed.html === "string" ? parsed.html : (parsed.textAsHtml as string) || "";
          let textContent: string = parsed.text || "";
          if (!htmlContent && textContent) {
            const escaped = textContent
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            htmlContent = `<div>${escaped.replace(/\n/g, "<br>")}</div>`;
          }
          if (!textContent && htmlContent) {
            textContent =
              htmlContent
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim() || "Please view this email in an HTML compatible client";
          }
          if (!htmlContent) htmlContent = "<p>(no content)</p>";
          if (!textContent) textContent = "(no content)";

          const captured: CapturedEmail = {
            from: fromAddress,
            to: toAddresses,
            subject: parsed.subject || "(No Subject)",
            text: textContent,
            html: htmlContent,
            date: parsed.date || null,
          };

          const email: NewComposedEmail = {
            from: captured.from,
            to: captured.to,
            subject: captured.subject,
            text: captured.text,
            html: htmlContent,
            date: captured.date,
          };

          const composedEmail = await saveEmail(email);
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
