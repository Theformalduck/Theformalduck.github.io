import { createHmac } from "crypto";

// Signed unsubscribe tokens, let a recipient remove themselves from a store's
// list via an email link without logging in, and without a DB token column.
// The token embeds {ownerId, email} and is HMAC-signed with NEXTAUTH_SECRET so
// it can't be forged or pointed at someone else's address.

const SECRET = process.env.NEXTAUTH_SECRET ?? "dev-unsubscribe-secret";

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeUnsubToken(ownerId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({ o: ownerId, e: email })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyUnsubToken(token: string): { ownerId: string; email: string } | null {
  const [payload, sig] = (token ?? "").split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || sig !== expected) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof obj?.o === "string" && typeof obj?.e === "string") return { ownerId: obj.o, email: obj.e };
  } catch {
    /* fall through */
  }
  return null;
}
