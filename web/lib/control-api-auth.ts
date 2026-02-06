import { SignJWT } from "jose";

export async function createControlApiToken(userId: string): Promise<string> {
  const secret = process.env.INACTU_API_AUTH_SECRET;
  if (!secret) {
    throw new Error("INACTU_API_AUTH_SECRET is required.");
  }
  if (!userId) {
    throw new Error("user id is required to create control API token.");
  }

  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("inactu-web")
    .setAudience("inactu-control")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
}
