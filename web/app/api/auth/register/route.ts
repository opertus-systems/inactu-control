import { hash } from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { getDbPool } from "../../../../lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 10) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");
    const userResult = await client.query<{ id: string }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::text",
      [email, passwordHash]
    );
    await client.query("INSERT INTO owners (kind, user_id) VALUES ('user', $1::uuid)", [userResult.rows[0].id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }
    throw error;
  } finally {
    client.release();
  }
}
