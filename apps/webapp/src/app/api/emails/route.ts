import { NextRequest, NextResponse } from "next/server";

import { validateNewComposedEmail } from "@repo/data-commons";

import { getAllEmails, getEmailById } from "@/services/server/email.service";
import { constructAndSaveEmail } from "@/services/server/email.service";

// GET handler to retrieve all emails
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const email = await getEmailById(id);

      if (!email) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      return NextResponse.json(email);
    }

    const emails = await getAllEmails();

    return NextResponse.json(emails);
  } catch (error) {
    console.error("Error fetching emails:", error);

    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 },
    );
  }
}

// POST handler to send a new email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = validateNewComposedEmail(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 422 },
      );
    }

    const { success, emailId } = await constructAndSaveEmail(
      validationResult.value,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, emailId });
  } catch (error) {
    console.error("Error sending email:", error);

    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
