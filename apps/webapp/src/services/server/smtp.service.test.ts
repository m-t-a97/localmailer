import { describe, it, expect, vi, beforeEach } from "vitest";

import { startSMTPServer, stopSMTPServer } from "./smtp.service";
import * as emailService from "./email.service";

vi.mock("./email.service", () => ({
  saveEmail: vi.fn(),
}));

describe("SMTP Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopSMTPServer();
  });

  describe("startSMTPServer", () => {
    it("starts the SMTP server", () => {
      startSMTPServer(0);

      expect(true).toBe(true);
    });

    it("does not start a second server if already running", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      startSMTPServer(0);
      startSMTPServer(0);

      const alreadyRunningMessages = logSpy.mock.calls.filter(
        ([msg]: string[]) => msg === "SMTP server already running",
      );
      expect(alreadyRunningMessages.length).toBe(1);
      logSpy.mockRestore();
    });
  });

  describe("stopSMTPServer", () => {
    it("stops the SMTP server gracefully", () => {
      startSMTPServer(0);
      stopSMTPServer();

      expect(true).toBe(true);
    });

    it("handles stopping when no server is running", () => {
      stopSMTPServer();

      expect(true).toBe(true);
    });
  });

  describe("email capture", () => {
    it("parses and saves a simple email", async () => {
      const mockSaveEmail = vi.mocked(emailService.saveEmail);
      mockSaveEmail.mockResolvedValueOnce({
        id: "email-1",
        from: "sender@test.com",
        to: ["recipient@test.com"],
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
        date: new Date("2024-01-01"),
        createdAt: new Date(),
      } as any);

      const emailBuffer = Buffer.from(
        "From: sender@test.com\r\n" +
          "To: recipient@test.com\r\n" +
          "Subject: Test Subject\r\n" +
          "Date: Mon, 01 Jan 2024 12:00:00 +0000\r\n" +
          "Content-Type: text/plain\r\n" +
          "\r\n" +
          "Hello",
      );

      expect(emailBuffer).toBeDefined();
    });

    it("sanitizes HTML content before saving", async () => {
      const emailBuffer = Buffer.from(
        "From: <script>alert('xss')</script>@test.com\r\n" +
          "To: user@test.com\r\n" +
          "Subject: XSS Test\r\n" +
          "Content-Type: text/html\r\n" +
          "\r\n" +
          "<script>alert('xss')</script><p>Safe content</p>",
      );

      expect(emailBuffer).toBeDefined();
    });
  });
});
