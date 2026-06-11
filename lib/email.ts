import nodemailer from "nodemailer";
import { after } from "next/server";

// ── Provider configuration ────────────────────────────────────────────────────
// Email is sent via the first configured provider, in priority order:
//   1. Resend , set RESEND_API_KEY (recommended; no extra package to install)
//   2. SMTP   , set EMAIL_SERVER_HOST / _USER / _PASSWORD (and optional _PORT)
//   3. Console, nothing configured: emails are logged to the server console
//                (fine for local dev, verification/reset links print to the terminal)
const resendKey = process.env.RESEND_API_KEY;
const host = process.env.EMAIL_SERVER_HOST;
const port = Number(process.env.EMAIL_SERVER_PORT ?? 587);
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM ?? "Sellora <onboarding@resend.dev>";
const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const smtpConfigured = !!(host && user && pass);
const transporter = smtpConfigured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

async function sendViaResend(to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${detail}`);
  }
}

export async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  // 1) Resend
  if (resendKey) {
    try {
      await sendViaResend(to, subject, html, replyTo);
      console.log(`[email] sent via Resend to ${to}: ${subject}`);
    } catch (err) {
      console.error(`[email] Resend FAILED to ${to}:`, err);
      throw err;
    }
    return;
  }

  // 2) SMTP
  if (transporter) {
    try {
      await transporter.sendMail({ from, to, subject, html, ...(replyTo ? { replyTo } : {}) });
      console.log(`[email] sent via SMTP to ${to}: ${subject}`);
    } catch (err) {
      console.error(`[email] SMTP FAILED to ${to}:`, err);
      throw err;
    }
    return;
  }

  // 3) No provider, log to console (dev convenience)
  console.log(
    `\n[email, no provider configured]\nTo: ${to}\nSubject: ${subject}\n` +
    `(Set RESEND_API_KEY or EMAIL_SERVER_* to actually send.)\n` +
    `${html.replace(/<[^>]+>/g, "").replace(/\n{2,}/g, "\n").trim()}\n`
  );
}

// Send without blocking the response: the email is delivered after the HTTP
// response is flushed (Next.js `after`). Falls back to inline send outside a
// request scope (scripts). Use this in request handlers so a slow SMTP/API
// call never delays the user.
export function sendEmailAfter(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  try {
    after(async () => {
      try { await sendEmail(opts); } catch (err) { console.error(`[email after] failed to ${opts.to}:`, err); }
    });
  } catch {
    // Not inside a request, send inline, fire-and-forget.
    sendEmail(opts).catch((err) => console.error(`[email] failed to ${opts.to}:`, err));
  }
}

const baseStyle = `font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#111`;
const btnStyle = `display:inline-block;background:#2e9cfe;color:#fff;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none`;
const mutedStyle = `color:#999;font-size:12px;margin-top:24px`;
const dividerStyle = `border:none;border-top:1px solid #eee;margin:20px 0`;

export function passwordResetEmail(resetUrl: string) {
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:8px">Reset your password</h2>
    <p style="color:#555;margin-bottom:24px">Click the button below to set a new password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
    <p style="${mutedStyle}">If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#bbb;font-size:11px">Link: ${resetUrl}</p>
  </div>`;
}

export function verifyEmailTemplate(verifyUrl: string) {
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:8px">Verify your email</h2>
    <p style="color:#555;margin-bottom:24px">Thanks for signing up! Click below to verify your email address. This link expires in 24 hours.</p>
    <a href="${verifyUrl}" style="${btnStyle}">Verify Email</a>
    <p style="${mutedStyle}">If you didn't create an account, you can safely ignore this email.</p>
    <p style="color:#bbb;font-size:11px">Link: ${verifyUrl}</p>
  </div>`;
}

export function orderConfirmationEmail(order: {
  id: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  storeName: string;
  storeUsername: string;
  downloads?: { productName: string; fileUrl: string }[];
}) {
  const rows = order.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center">${i.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join("");

  const storeUrl = `${appUrl}/${order.storeUsername}/store`;

  const downloadSection = order.downloads?.length
    ? `<hr style="${dividerStyle}" />
       <h3 style="font-size:15px;margin-bottom:12px">Your Downloads</h3>
       <p style="color:#555;font-size:13px;margin-bottom:12px">Click the links below to download your files. Save them somewhere safe, these links won't expire.</p>
       ${order.downloads.map(d =>
         `<div style="margin-bottom:8px">
            <a href="${d.fileUrl}" style="color:#2e9cfe;font-size:14px;text-decoration:none;font-weight:500">
              ↓ ${d.productName}
            </a>
          </div>`
       ).join("")}`
    : "";

  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:4px">Order confirmed!</h2>
    <p style="color:#555;margin-bottom:4px">Your order from <strong>${order.storeName}</strong> has been received.</p>
    <p style="color:#999;font-size:13px;margin-bottom:24px">Order #${order.id.slice(-8).toUpperCase()}</p>
    <hr style="${dividerStyle}" />
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;font-size:12px;color:#999;padding-bottom:8px;text-transform:uppercase">Item</th>
          <th style="text-align:center;font-size:12px;color:#999;padding-bottom:8px;text-transform:uppercase">Qty</th>
          <th style="text-align:right;font-size:12px;color:#999;padding-bottom:8px;text-transform:uppercase">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right;margin-top:12px">
      <span style="font-size:16px;font-weight:700">Total: $${order.total.toFixed(2)}</span>
    </div>
    ${downloadSection}
    <hr style="${dividerStyle}" />
    <a href="${storeUrl}" style="${btnStyle}">Visit Store</a>
    <p style="${mutedStyle}">Questions? Reply to this email or contact the seller directly.</p>
  </div>`;
}

export function orderStatusEmail(order: {
  id: string;
  status: "SHIPPED" | "DELIVERED" | "PROCESSING" | "CANCELLED";
  storeName: string;
  storeUsername: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}) {
  const storeUrl = `${appUrl}/${order.storeUsername}/store`;
  const orderNo = order.id.slice(-8).toUpperCase();

  const copy: Record<string, { title: string; body: string }> = {
    PROCESSING: { title: "Your order is being prepared", body: "Good news, the seller is preparing your order for shipment." },
    SHIPPED:    { title: "Your order is on its way!",      body: "Your order has shipped and is heading your way." },
    DELIVERED:  { title: "Your order was delivered",        body: "Your order has been marked as delivered. We hope you love it!" },
    CANCELLED:  { title: "Your order was cancelled",        body: "Your order has been cancelled. If you were charged, a refund will follow." },
  };
  const c = copy[order.status] ?? { title: "Order update", body: `Your order status is now ${order.status.toLowerCase()}.` };

  const trackingSection = order.status === "SHIPPED" && (order.trackingNumber || order.trackingUrl)
    ? `<hr style="${dividerStyle}" />
       <h3 style="font-size:15px;margin-bottom:8px">Tracking</h3>
       ${order.trackingNumber ? `<p style="color:#555;font-size:14px;margin:4px 0">Tracking number: <strong>${order.trackingNumber}</strong></p>` : ""}
       ${order.trackingUrl ? `<p style="margin:12px 0"><a href="${order.trackingUrl}" style="${btnStyle}">Track Your Package</a></p>` : ""}`
    : "";

  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:4px">${c.title}</h2>
    <p style="color:#555;margin-bottom:4px">${c.body}</p>
    <p style="color:#999;font-size:13px;margin-bottom:20px">Order #${orderNo} · ${order.storeName}</p>
    ${trackingSection}
    <hr style="${dividerStyle}" />
    <a href="${storeUrl}" style="${btnStyle}">Visit Store</a>
    <p style="${mutedStyle}">Questions? Reply to this email or contact the seller directly.</p>
  </div>`;
}

export function lowStockEmail(opts: {
  productName: string;
  inventory: number;
  productId: string;
  outOfStock: boolean;
}) {
  const editUrl = `${appUrl}/store/products/${opts.productId}/edit`;
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:8px">${opts.outOfStock ? "A product is out of stock" : "Low stock alert"}</h2>
    <p style="color:#555;margin-bottom:8px">
      <strong>${opts.productName}</strong> ${opts.outOfStock
        ? "has sold out and is no longer available to buyers."
        : `is running low, only <strong>${opts.inventory}</strong> left in stock.`}
    </p>
    <p style="color:#555;margin-bottom:24px">Restock it so you don't miss sales.</p>
    <a href="${editUrl}" style="${btnStyle}">Update Inventory</a>
    <p style="${mutedStyle}">You're receiving this because low-stock alerts are enabled for your store.</p>
  </div>`;
}

// Escape user-supplied text before embedding it in the email HTML.
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function feedbackEmail(opts: { message: string; category: string; userEmail: string; userName: string }) {
  const who = opts.userName ? `${escapeHtml(opts.userName)} &lt;${escapeHtml(opts.userEmail)}&gt;` : escapeHtml(opts.userEmail);
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:4px">New feedback</h2>
    <p style="color:#999;font-size:13px;margin-bottom:20px">Category: <strong>${escapeHtml(opts.category)}</strong></p>
    <div style="background:#f7f9fc;border:1px solid #eef2f7;border-radius:10px;padding:16px;color:#222;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(opts.message)}</div>
    <hr style="${dividerStyle}" />
    <p style="color:#555;font-size:13px">From: <strong>${who}</strong></p>
    <p style="${mutedStyle}">Sent from the Sellora dashboard feedback button. Reply directly to respond to the sender.</p>
  </div>`;
}

export function newsletterEmail(opts: { subject: string; body: string; storeName: string; storeUsername: string; unsubscribeUrl?: string }) {
  const storeUrl = `${appUrl}/${opts.storeUsername}/store`;
  const unsub = opts.unsubscribeUrl
    ? `<a href="${opts.unsubscribeUrl}" style="color:#999;text-decoration:underline">Unsubscribe</a>`
    : `Reply with "unsubscribe" to stop`;
  // opts.body is pre-sanitized rich HTML (see lib/sanitize-html).
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:16px">${escapeHtml(opts.subject)}</h2>
    <div style="color:#333;font-size:15px;line-height:1.7">${opts.body}</div>
    <hr style="${dividerStyle}" />
    <a href="${storeUrl}" style="${btnStyle}">Visit ${escapeHtml(opts.storeName)}</a>
    <p style="${mutedStyle}">You're receiving this because you subscribed to updates from ${escapeHtml(opts.storeName)}.<br/>${unsub}.</p>
  </div>`;
}

// Generic activity notification (new order, comment, follower, message, …).
// Mirrors the in-app notification so users get the same alert by email.
export function activityEmail(opts: { title: string; body?: string; link?: string }) {
  const url = `${appUrl}${opts.link ?? "/dashboard"}`;
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:8px">${escapeHtml(opts.title)}</h2>
    ${opts.body ? `<p style="color:#555;margin-bottom:24px">${escapeHtml(opts.body)}</p>` : ""}
    <a href="${url}" style="${btnStyle}">View on Sellora</a>
    <p style="${mutedStyle}">You're receiving this because activity emails are on. Manage these in Settings → Notifications.</p>
  </div>`;
}

export function teamInviteEmail(opts: { inviterName: string; accountName: string; role: string; acceptUrl: string }) {
  return `<div style="${baseStyle}">
    <h2 style="margin-bottom:8px">You've been invited to a team</h2>
    <p style="color:#555;margin-bottom:8px"><strong>${opts.inviterName}</strong> invited you to join <strong>${opts.accountName}</strong> on Sellora as a <strong>${opts.role}</strong>.</p>
    <p style="color:#555;margin-bottom:24px">Accept the invite to help manage their store.</p>
    <a href="${opts.acceptUrl}" style="${btnStyle}">Accept invite</a>
    <p style="${mutedStyle}">If you weren't expecting this, you can ignore this email.</p>
    <p style="color:#bbb;font-size:11px">Link: ${opts.acceptUrl}</p>
  </div>`;
}

export { appUrl };
