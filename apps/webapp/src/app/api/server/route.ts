import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import {
  getValidationResult,
  smtpServerActionSchema,
} from "@repo/data-commons";

import {
  startSMTPServer,
  stopSMTPServer,
} from "@/services/server/smtp.service";

// GET handler to check server status
export async function GET() {
  return NextResponse.json({
    message: "Email development server is running",
    endpoints: {
      "GET /api/emails": "Get all emails or a specific email with ?id=emailId",
      "POST /api/emails": "Send a new email",
      "GET /api/server": "Get server status",
      "POST /api/server": "Start/Stop SMTP server",
    },
  });
}

const postSchema = z.object({
  action: smtpServerActionSchema,
});
type PostSchema = z.infer<typeof postSchema>;

// POST handler to start/stop the SMTP server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = getValidationResult<PostSchema>(body, postSchema);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 422 },
      );
    }

    const { action } = validationResult.value;

    switch (action) {
      case "start": {
        const port = 2525;
        startSMTPServer(port);

        return NextResponse.json({
          success: true,
          message: `SMTP server started on port ${port}`,
        });
      }
      case "stop": {
        stopSMTPServer();

        return NextResponse.json({
          success: true,
          message: "SMTP server stopped",
        });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing SMTP server:", error);

    return NextResponse.json(
      { error: "Failed to manage SMTP server" },
      { status: 500 },
    );
  }
}
