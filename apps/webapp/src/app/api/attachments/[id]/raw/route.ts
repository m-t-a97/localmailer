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
    const s3Response = await s3Service.getObjectStream(attachment.s3Key);

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: "Attachment body not found" },
        { status: 404 },
      );
    }

    const byteArray = await s3Response.Body.transformToByteArray();
    const body = Buffer.from(byteArray);

    return new NextResponse(body, {
      headers: {
        "Content-Type": attachment.contentType,
        "Content-Length": attachment.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error streaming attachment:", error);
    return NextResponse.json(
      { error: "Failed to stream attachment" },
      { status: 500 },
    );
  }
}
