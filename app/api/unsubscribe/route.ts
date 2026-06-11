import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/unsubscribe";

// Public one-click unsubscribe, the signed token authorizes removing exactly
// one email from one store's list, so no login is needed.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const data = verifyUnsubToken(token);

  const page = (title: string, message: string, ok: boolean) =>
    new NextResponse(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
       <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f4f8">
         <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:36px 32px;max-width:400px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
           <div style="font-size:34px;margin-bottom:8px">${ok ? "✅" : "⚠️"}</div>
           <h2 style="margin:0 0 8px;color:#111;font-size:18px">${title}</h2>
           <p style="color:#555;margin:0;font-size:14px;line-height:1.6">${message}</p>
         </div>
       </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }, status: ok ? 200 : 400 }
    );

  if (!data) return page("Invalid link", "This unsubscribe link is invalid or has expired.", false);

  try {
    await db.subscriber.deleteMany({ where: { ownerId: data.ownerId, email: data.email } });
  } catch {
    return page("Something went wrong", "We couldn't process your request. Please try again later.", false);
  }

  return page("You're unsubscribed", `${data.email} has been removed and won't receive further emails from this store.`, true);
}
