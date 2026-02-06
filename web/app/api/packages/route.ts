import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { controlApiFetch } from "../../../lib/control-api";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await controlApiFetch("/v1/packages", session.user.id, { method: "GET" });
  const payload = await response.json().catch(() => ({ error: "Unexpected response" }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await controlApiFetch("/v1/packages", session.user.id, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({ error: "Unexpected response" }));
  return NextResponse.json(payload, { status: response.status });
}
