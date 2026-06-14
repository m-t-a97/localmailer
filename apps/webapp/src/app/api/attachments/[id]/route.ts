import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma-client";
import { createS3ServiceFromEnv } from "@/services/server/email.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const attachment = await prisma.emailAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    const s3Service = createS3ServiceFromEnv();
    const downloadUrl = await s3Service.getPresignedDownloadUrl(attachment.s3Key);

    return NextResponse.json({
      id: attachment.id,
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 },
    );
  }
}
