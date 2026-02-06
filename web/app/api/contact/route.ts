import { NextRequest, NextResponse } from "next/server";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  message: string;
};

function validate(payload: Partial<ContactPayload>) {
  if (!payload.name || payload.name.trim().length < 2) {
    return "Please provide your name.";
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please provide a valid email address.";
  }

  if (!payload.message || payload.message.trim().length < 20) {
    return "Please provide a message with at least 20 characters.";
  }

  return null;
}

export async function POST(request: NextRequest) {
  let body: Partial<ContactPayload>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const error = validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const submission = {
    name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    company: body.company?.trim() || "",
    message: body.message!.trim(),
    submittedAt: new Date().toISOString()
  };

  const webhookUrl = process.env.INACTU_CONTACT_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(submission)
      });

      if (!webhookResponse.ok) {
        return NextResponse.json(
          {
            error: "Contact intake is temporarily unavailable. Please email support directly."
          },
          { status: 502 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          error: "Contact intake is temporarily unavailable. Please email support directly."
        },
        { status: 502 }
      );
    }
  }

  console.info("Contact submission received", submission);

  return NextResponse.json({ ok: true });
}
