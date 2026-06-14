import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type S3Dependencies = {
  s3Client: S3Client;
  bucket: string;
};

export function createS3Dependencies(config: S3ClientConfig & { bucket: string }): S3Dependencies {
  const { bucket, ...s3Config } = config;
  return {
    s3Client: new S3Client(s3Config),
    bucket,
  };
}

export function createS3Service(deps: S3Dependencies) {
  const { s3Client, bucket } = deps;

  async function ensureBucket(): Promise<void> {
    try {
      await s3Client.send(
        new CreateBucketCommand({ Bucket: bucket }),
      );
      console.log(`S3 bucket "${bucket}" created`);
    } catch {
      // Bucket already exists
    }
  }

  async function uploadAttachment(
    emailId: string,
    attachmentId: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const s3Key = `${emailId}/${attachmentId}-${filename}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return s3Key;
  }

  async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
    return getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: s3Key }),
      { expiresIn: 3600 },
    );
  }

  async function getObjectStream(s3Key: string) {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: s3Key }),
    );
    return response;
  }

  async function deleteAttachmentsByEmailId(emailId: string): Promise<void> {
    try {
      const listed = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${emailId}/`,
        }),
      );

      if (!listed.Contents || listed.Contents.length === 0) return;

      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: listed.Contents.map((obj) => ({ Key: obj.Key! })),
          },
        }),
      );
    } catch (error) {
      console.error(`Error deleting S3 objects for email ${emailId}:`, error);
    }
  }

  return {
    ensureBucket,
    uploadAttachment,
    getPresignedDownloadUrl,
    getObjectStream,
    deleteAttachmentsByEmailId,
  };
}

export type S3Service = ReturnType<typeof createS3Service>;
