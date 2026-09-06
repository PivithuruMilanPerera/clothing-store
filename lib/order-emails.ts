import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resend } from "resend";
import {
  formatPaymentMethodLabel,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  normalizePaymentStatus,
} from "@/lib/order-status";
import type { CartItem, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const LOGO_CONTENT_ID = "velvorz-logo";

export type OrderEmailItem = {
  name: string;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
};

export type OrderEmailPayload = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
  };
  items: OrderEmailItem[];
  createdAt: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function getFromAddress() {
  const email = process.env.RESEND_FROM_EMAIL?.trim() || "noreply@velvorz.com";
  const name = process.env.RESEND_FROM_NAME?.trim() || "VELVORZ";
  return `${name} <${email}>`;
}

/** Local (dev) vs live (production deployment) admin inbox. */
export function getOrderAdminEmail(): string | null {
  const isLive =
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV);

  const email = (
    isLive
      ? process.env.ORDER_ADMIN_EMAIL_LIVE
      : process.env.ORDER_ADMIN_EMAIL_LOCAL
  )?.trim();

  return email || null;
}

function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function getLogoAttachment() {
  const logoPath = join(process.cwd(), "app", "logo_gray.png");
  const content = readFileSync(logoPath);

  return {
    filename: "logo_gray.png",
    content,
    contentId: LOGO_CONTENT_ID,
    contentType: "image/png",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatAddress(address: OrderEmailPayload["shippingAddress"]) {
  const lines = [
    address.fullName,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
    address.phone ? `Phone: ${address.phone}` : "",
    address.email ? `Email: ${address.email}` : "",
  ].filter((line): line is string => Boolean(line));

  return lines.map((line) => escapeHtml(line)).join("<br />");
}

function renderItemRows(items: OrderEmailItem[]) {
  return items
    .map((item) => {
      const meta = [item.color, item.size]
        .filter((value): value is string => Boolean(value))
        .join(" · ");
      const lineTotal = item.unitPrice * item.quantity;

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
            <strong>${escapeHtml(item.name)}</strong>
            ${meta ? `<div style="margin-top:4px;color:#666;font-size:12px;">${escapeHtml(meta)}</div>` : ""}
            <div style="margin-top:4px;color:#666;font-size:12px;">Qty ${item.quantity} · ${escapeHtml(formatPrice(item.unitPrice))}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;text-align:right;white-space:nowrap;vertical-align:top;">
            ${escapeHtml(formatPrice(lineTotal))}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderEmailShell(options: {
  title: string;
  intro: string;
  order: OrderEmailPayload;
  footerNote: string;
  highlightLabel?: string;
}) {
  const { title, intro, order, footerNote, highlightLabel } = options;
  const paymentStatus = normalizePaymentStatus(order.paymentStatus);
  const orderDate = new Date(order.createdAt).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const siteUrl = getSiteUrl();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e5e5;">
            <tr>
              <td style="background:#f9f9f9;padding:28px 32px;text-align:center;border-bottom:1px solid #cfc4c5;">
                <img src="cid:${LOGO_CONTENT_ID}" alt="Velvorz" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
                ${
                  highlightLabel
                    ? `<p style="margin:0 0 12px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#166534;font-weight:700;">${escapeHtml(highlightLabel)}</p>`
                    : ""
                }
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#111;text-transform:uppercase;letter-spacing:0.02em;">${escapeHtml(title)}</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#555;">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f7;border:1px solid #ececec;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#777;font-weight:700;">Order reference</p>
                      <p style="margin:6px 0 0;font-size:18px;color:#111;font-weight:700;">${escapeHtml(order.orderNumber)}</p>
                      <p style="margin:8px 0 0;font-size:12px;color:#666;">Placed ${escapeHtml(orderDate)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 12px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#111;">Invoice details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;width:40%;">Customer</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(order.customerName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Email</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(order.customerEmail)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Phone</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(order.customerPhone || "—")}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Payment</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(formatPaymentMethodLabel(order.paymentMethod))} · ${escapeHtml(PAYMENT_STATUS_LABELS[paymentStatus])}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Order status</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(ORDER_STATUS_LABELS[order.orderStatus])}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 8px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#111;">Items</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${renderItemRows(order.items)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Subtotal</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${escapeHtml(formatPrice(order.subtotal))}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Shipping</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;">${order.shipping === 0 ? "Free" : escapeHtml(formatPrice(order.shipping))}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 0;font-size:15px;color:#111;font-weight:700;border-top:1px solid #e8e8e8;">Total</td>
                    <td style="padding:12px 0 0;font-size:15px;color:#111;font-weight:700;text-align:right;border-top:1px solid #e8e8e8;">${escapeHtml(formatPrice(order.total))}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 10px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#111;">Delivery address</h2>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">${formatAddress(order.shippingAddress)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">${escapeHtml(footerNote)}</p>
                <p style="margin:16px 0 0;font-size:12px;color:#999;">
                  <a href="${escapeHtml(siteUrl)}" style="color:#111;text-decoration:underline;">velvorz.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildCustomerHtml(order: OrderEmailPayload) {
  return renderEmailShell({
    title: "Order confirmed",
    intro: `Hi ${order.customerName.split(" ")[0] || "there"}, thank you for shopping with VELVORZ. Here is your order invoice and confirmation details.`,
    order,
    highlightLabel: "Confirmation",
    footerNote:
      "We will update you when your order ships. If you have any questions, reply to this email or contact our support team.",
  });
}

function buildAdminHtml(order: OrderEmailPayload) {
  return renderEmailShell({
    title: "New order received",
    intro: `A new order ${order.orderNumber} was placed by ${order.customerName} (${order.customerEmail}). Review the invoice details below.`,
    order,
    highlightLabel: "Admin alert",
    footerNote:
      "Open the admin orders dashboard to update fulfillment and payment status.",
  });
}

export function buildOrderEmailPayload(input: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: OrderEmailPayload["shippingAddress"];
  items: CartItem[];
}): OrderEmailPayload {
  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    orderStatus: input.orderStatus,
    subtotal: input.subtotal,
    shipping: input.shipping,
    total: input.total,
    shippingAddress: input.shippingAddress,
    createdAt: new Date().toISOString(),
    items: input.items.map((item) => ({
      name: item.name,
      color: item.colorName || item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
  };
}

/**
 * Sends customer confirmation + admin new-order emails.
 * Failures are logged and never throw — checkout must still succeed.
 */
export async function sendOrderEmails(order: OrderEmailPayload): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.error("Order emails skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const from = getFromAddress();
  const adminEmail = getOrderAdminEmail();
  const logo = getLogoAttachment();

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: order.customerEmail,
      subject: `Order confirmed — ${order.orderNumber} | VELVORZ`,
      html: buildCustomerHtml(order),
      attachments: [logo],
    }),
    adminEmail
      ? resend.emails.send({
          from,
          to: adminEmail,
          replyTo: order.customerEmail,
          subject: `New order — ${order.orderNumber} | VELVORZ`,
          html: buildAdminHtml(order),
          attachments: [logo],
        })
      : Promise.reject(new Error("ORDER_ADMIN_EMAIL is not configured.")),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Order email failed:", result.reason);
      continue;
    }

    const value = result.value as { error?: { message?: string } | null };
    if (value?.error) {
      console.error("Order email API error:", value.error.message || value.error);
    }
  }
}
