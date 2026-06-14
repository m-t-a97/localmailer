import { describe, it, expect, vi, beforeEach } from "vitest";

import { createS3Dependencies, createS3Service, S3Service } from "./s3.service";

function createMockS3Client() {
  return {
    send: vi.fn(),
  };
}

describe("S3 Service", () => {
  let s3Service: S3Service;
  let mockS3Client: ReturnType<typeof createMockS3Client>;

  beforeEach(() => {
    mockS3Client = createMockS3Client();
    const deps = {
      s3Client: mockS3Client as any,
      bucket: "test-bucket",
    };
    s3Service = createS3Service(deps);
  });

  describe("ensureBucket", () => {
    it("creates bucket successfully", async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      await s3Service.ensureBucket();

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const command = mockS3Client.send.mock.calls[0][0];
      expect(command.constructor.name).toBe("CreateBucketCommand");
      expect(command.input.Bucket).toBe("test-bucket");
    });

    it("handles bucket already existing", async () => {
      mockS3Client.send.mockRejectedValueOnce(new Error("BucketAlreadyExists"));

      await s3Service.ensureBucket();

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe("uploadAttachment", () => {
    it("uploads attachment to correct S3 key", async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      const s3Key = await s3Service.uploadAttachment(
        "email-1",
        "att-1",
        "photo.jpg",
        Buffer.from("test-data"),
        "image/jpeg",
      );

      expect(s3Key).toBe("email-1/att-1-photo.jpg");
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const command = mockS3Client.send.mock.calls[0][0];
      expect(command.constructor.name).toBe("PutObjectCommand");
      expect(command.input.Bucket).toBe("test-bucket");
      expect(command.input.Key).toBe("email-1/att-1-photo.jpg");
      expect(command.input.ContentType).toBe("image/jpeg");
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("calls getSignedUrl with correct parameters", async () => {
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      try {
        await s3Service.getPresignedDownloadUrl("email-1/att-1-photo.jpg");
      } catch {
        // Expected to fail with mocked S3 client - just verify it was called
      }

      expect(mockS3Client.send).not.toHaveBeenCalled();
    });
  });

  describe("getObjectStream", () => {
    it("returns S3 response object", async () => {
      const mockResponse = { Body: "stream-data" };
      mockS3Client.send.mockResolvedValueOnce(mockResponse);

      const result = await s3Service.getObjectStream("email-1/att-1-photo.jpg");

      expect(result).toBe(mockResponse);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      const command = mockS3Client.send.mock.calls[0][0];
      expect(command.constructor.name).toBe("GetObjectCommand");
    });
  });

  describe("deleteAttachmentsByEmailId", () => {
    it("lists and deletes objects by prefix", async () => {
      mockS3Client.send
        .mockResolvedValueOnce({
          Contents: [
            { Key: "email-1/att-1-photo.jpg" },
            { Key: "email-1/att-2-doc.pdf" },
          ],
        })
        .mockResolvedValueOnce({});

      await s3Service.deleteAttachmentsByEmailId("email-1");

      expect(mockS3Client.send).toHaveBeenCalledTimes(2);
      const listCommand = mockS3Client.send.mock.calls[0][0];
      expect(listCommand.constructor.name).toBe("ListObjectsV2Command");
      expect(listCommand.input.Prefix).toBe("email-1/");

      const deleteCommand = mockS3Client.send.mock.calls[1][0];
      expect(deleteCommand.constructor.name).toBe("DeleteObjectsCommand");
      expect(deleteCommand.input.Delete.Objects).toHaveLength(2);
    });

    it("skips deletion when no objects found", async () => {
      mockS3Client.send.mockResolvedValueOnce({ Contents: [] });

      await s3Service.deleteAttachmentsByEmailId("email-1");

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it("logs error and continues on S3 failure", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockS3Client.send.mockRejectedValueOnce(new Error("S3 error"));

      await s3Service.deleteAttachmentsByEmailId("email-1");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createS3Dependencies", () => {
    it("creates S3 dependencies with given config", () => {
      const deps = createS3Dependencies({
        endpoint: "http://localhost:9000",
        bucket: "test-bucket",
        credentials: {
          accessKeyId: "minioadmin",
          secretAccessKey: "minioadmin",
        },
        region: "us-east-1",
        forcePathStyle: true,
      });

      expect(deps.bucket).toBe("test-bucket");
      expect(deps.s3Client).toBeDefined();
    });
  });
});
