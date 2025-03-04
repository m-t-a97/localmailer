import { NextRequest, NextResponse } from "next/server";
import { getAllEmails, getEmailById } from "@/services/server/email.service";
import { constructAndSaveEmail } from "@/services/server/email.service";
import { z } from "zod";

const emailSchema = z.object({
  from: z.string().email(),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
});

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
    const bodyData = await request.json();

    const validationResult = emailSchema.safeParse(bodyData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 422 },
      );
    }

    const { success, emailId } = await constructAndSaveEmail(
      validationResult.data,
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
