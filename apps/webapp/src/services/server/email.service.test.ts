import { describe, it, expect, vi, beforeEach } from "vitest";

import { constructAndSaveEmail, createS3ServiceFromEnv } from "./email.service";

vi.mock("@/lib/prisma-client", () => ({
  default: {
    composedEmail: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/config/env-config", () => ({
  default: {
    databaseUrl: "postgresql://localhost/test",
    smtp: {
      host: "localhost",
      port: 2525,
      user: "user",
      pass: "pass",
    },
    s3: {
      endpoint: "http://localhost:9000",
      bucket: "test-bucket",
      accessKey: "test",
      secretKey: "test",
      region: "us-east-1",
    },
    logLevel: "info",
  },
}));

import prisma from "@/lib/prisma-client";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructAndSaveEmail", () => {
    it("sanitizes HTML and saves email", async () => {
      const mockCreate = vi.mocked(prisma.composedEmail.create);
      mockCreate.mockResolvedValueOnce({
        id: "email-1",
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<p>Safe content</p>",
        text: "Test",
        date: null,
        createdAt: new Date(),
      } as any);

      const result = await constructAndSaveEmail({
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<script>alert('xss')</script><p>Safe content</p>",
        text: "Test",
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBe("email-1");

      const savedData = mockCreate.mock.calls[0][0].data;
      expect(savedData.html).not.toContain("<script>");
      expect(savedData.html).toContain("<p>Safe content</p>");
    });

    it("returns error when save fails", async () => {
      const mockCreate = vi.mocked(prisma.composedEmail.create);
      mockCreate.mockRejectedValueOnce(new Error("DB error"));

      const result = await constructAndSaveEmail({
        from: "test@test.com",
        to: ["recipient@test.com"],
        subject: "Test",
        html: "<p>Hello</p>",
        text: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("createS3ServiceFromEnv", () => {
    it("creates S3 service from env config", () => {
      const s3Service = createS3ServiceFromEnv();

      expect(s3Service).toBeDefined();
      expect(typeof s3Service.ensureBucket).toBe("function");
      expect(typeof s3Service.uploadAttachment).toBe("function");
      expect(typeof s3Service.getPresignedDownloadUrl).toBe("function");
      expect(typeof s3Service.getObjectStream).toBe("function");
      expect(typeof s3Service.deleteAttachmentsByEmailId).toBe("function");
    });
  });
});
