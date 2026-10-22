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
import { LOW_STOCK_THRESHOLD, type LowStockAlert } from "@/lib/inventory";
import {
  fillTemplate,
  type EmailTemplateContent,
  type EmailTemplateKey,
} from "@/lib/email-template-defaults";
import { getEmailTemplate } from "@/lib/email-templates";

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
  trackingNumber?: string | null;
  couponCode?: string | null;
  discount?: number;
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

function getLogoBuffer() {
  return readFileSync(join(process.cwd(), "app", "logo_gray.png"));
}

function getLogoAttachment() {
  const content = getLogoBuffer();

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
                  ${
                    order.trackingNumber
                      ? `<tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Tracking number</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;font-weight:700;">${escapeHtml(order.trackingNumber)}</td>
                  </tr>`
                      : ""
                  }
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
                  ${
                    order.discount && order.discount > 0
                      ? `<tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;">Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td>
                    <td style="padding:6px 0;font-size:13px;color:#166534;text-align:right;">-${escapeHtml(formatPrice(order.discount))}</td>
                  </tr>`
                      : ""
                  }
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

function orderTemplateVariables(order: OrderEmailPayload) {
  return {
    first_name: order.customerName.split(" ")[0] || "there",
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    order_number: order.orderNumber,
    order_status: ORDER_STATUS_LABELS[order.orderStatus],
    tracking_number: order.trackingNumber || "",
    order_total: formatPrice(order.total),
  };
}

function renderOrderTemplate(
  template: EmailTemplateContent,
  order: OrderEmailPayload,
  highlightLabel: string,
) {
  const variables = orderTemplateVariables(order);

  return {
    subject: fillTemplate(template.subject, variables),
    html: renderEmailShell({
      title: fillTemplate(template.heading, variables),
      intro: fillTemplate(template.intro, variables),
      footerNote: fillTemplate(template.footer, variables),
      order,
      highlightLabel,
    }),
  };
}

const STATUS_TEMPLATE_KEYS: Partial<Record<OrderStatus, EmailTemplateKey>> = {
  processing: "order_processing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
  returned: "order_returned",
};

async function buildStatusUpdateEmail(order: OrderEmailPayload) {
  const key = STATUS_TEMPLATE_KEYS[order.orderStatus];

  if (!key) {
    const label = ORDER_STATUS_LABELS[order.orderStatus];
    return {
      enabled: true,
      ...renderOrderTemplate(
        {
          subject: `Order ${label.toLowerCase()} — {{order_number}} | VELVORZ`,
          heading: "Order status updated",
          intro:
            "Hi {{first_name}}, the status of your order {{order_number}} is now {{order_status}}.",
          footer:
            "If you have any questions, reply to this email or contact our support team.",
          is_enabled: true,
        },
        order,
        "Status update",
      ),
    };
  }

  const template = await getEmailTemplate(key);
  return {
    enabled: template.is_enabled,
    ...renderOrderTemplate(template, order, ORDER_STATUS_LABELS[order.orderStatus]),
  };
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
  trackingNumber?: string | null;
  couponCode?: string | null;
  discount?: number;
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
    trackingNumber: input.trackingNumber?.trim() || null,
    couponCode: input.couponCode ?? null,
    discount: input.discount ?? 0,
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

function readShippingField(
  address: Record<string, string> | null | undefined,
  ...keys: string[]
) {
  if (!address) {
    return "";
  }

  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

/** Builds an email payload from a persisted order + line items. */
export function buildOrderEmailPayloadFromOrder(order: {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  payment_method?: PaymentMethod | string | null;
  payment_status?: PaymentStatus | string | null;
  status: OrderStatus;
  tracking_number?: string | null;
  coupon_code?: string | null;
  discount?: number | null;
  subtotal: number;
  shipping: number;
  total: number;
  shipping_address?: Record<string, string> | null;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    color: string | null;
    size: string | null;
    quantity: number;
    unit_price: number;
  }>;
}): OrderEmailPayload {
  const address = order.shipping_address ?? null;
  const fullName =
    readShippingField(address, "fullName") ||
    [readShippingField(address, "firstName"), readShippingField(address, "lastName")]
      .filter(Boolean)
      .join(" ") ||
    order.customer_name?.trim() ||
    "Customer";
  const email =
    order.customer_email?.trim() ||
    readShippingField(address, "email");
  const phone =
    order.customer_phone?.trim() ||
    readShippingField(address, "phone");

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    customerName: fullName,
    customerEmail: email,
    customerPhone: phone,
    paymentMethod: order.payment_method || "cash_on_delivery",
    paymentStatus: normalizePaymentStatus(order.payment_status),
    orderStatus: order.status,
    trackingNumber: order.tracking_number?.trim() || null,
    couponCode: order.coupon_code ?? null,
    discount: Number(order.discount) || 0,
    subtotal: Number(order.subtotal) || 0,
    shipping: Number(order.shipping) || 0,
    total: Number(order.total) || 0,
    shippingAddress: {
      fullName,
      line1: readShippingField(address, "line1"),
      line2: readShippingField(address, "line2"),
      city: readShippingField(address, "city"),
      state: readShippingField(address, "state"),
      postalCode: readShippingField(address, "postalCode", "postal_code"),
      country: readShippingField(address, "country") || "Sri Lanka",
      phone,
      email,
    },
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item) => ({
      name: item.product_name,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price) || 0,
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
  const [customerTemplate, adminTemplate] = await Promise.all([
    getEmailTemplate("order_confirmation"),
    getEmailTemplate("order_admin_alert"),
  ]);
  const customerEmail = renderOrderTemplate(customerTemplate, order, "Confirmation");
  const adminAlert = renderOrderTemplate(adminTemplate, order, "Admin alert");

  const results = await Promise.allSettled([
    customerTemplate.is_enabled
      ? resend.emails.send({
          from,
          to: order.customerEmail,
          subject: customerEmail.subject,
          html: customerEmail.html,
          attachments: [logo],
        })
      : Promise.resolve(null),
    !adminTemplate.is_enabled
      ? Promise.resolve(null)
      : adminEmail
        ? resend.emails.send({
            from,
            to: adminEmail,
            replyTo: order.customerEmail,
            subject: adminAlert.subject,
            html: adminAlert.html,
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

/**
 * Notifies the customer when an admin updates order fulfillment status.
 * Failures are logged and never throw — status updates must still succeed.
 */
export async function sendOrderStatusUpdateEmail(
  order: OrderEmailPayload,
): Promise<void> {
  if (!order.customerEmail?.trim()) {
    console.error(
      `Order status email skipped for ${order.orderNumber}: missing customer email.`,
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error(
      "Order status email skipped: RESEND_API_KEY is not configured.",
    );
    return;
  }

  try {
    const email = await buildStatusUpdateEmail(order);
    if (!email.enabled) {
      return;
    }

    const result = await resend.emails.send({
      from: getFromAddress(),
      to: order.customerEmail,
      subject: email.subject,
      html: email.html,
      attachments: [getLogoAttachment()],
    });

    if (result.error) {
      console.error(
        "Order status email API error:",
        result.error.message || result.error,
      );
    }
  } catch (error) {
    console.error("Order status email failed:", error);
  }
}

export type ReturnRequestEmailPayload = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  reason: string;
  details?: string | null;
  itemLabel?: string | null;
  submittedAt: string;
};

type NoticeRow = { label: string; value: string; emphasize?: boolean };

/** Compact layout for notices that are not order invoices (returns, stock alerts). */
function renderNoticeShell(options: {
  highlightLabel: string;
  highlightColor?: string;
  title: string;
  intro: string;
  rows?: NoticeRow[];
  bodyHtml?: string;
  footerNote: string;
  cta?: { label: string; href: string };
}) {
  const siteUrl = getSiteUrl();
  const rows = (options.rows ?? [])
    .map(
      (row, index) => `<tr>
                    <td style="padding:6px 0;font-size:13px;color:#666;${index === 0 ? "width:40%;" : ""}">${escapeHtml(row.label)}</td>
                    <td style="padding:6px 0;font-size:13px;color:#111;text-align:right;${row.emphasize ? "font-weight:700;" : ""}">${escapeHtml(row.value)}</td>
                  </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
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
                <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${options.highlightColor ?? "#166534"};font-weight:700;">${escapeHtml(options.highlightLabel)}</p>
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#111;text-transform:uppercase;letter-spacing:0.02em;">${escapeHtml(options.title)}</h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#555;">${escapeHtml(options.intro)}</p>
              </td>
            </tr>
            ${
              rows
                ? `<tr>
              <td style="padding:24px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${rows}
                </table>
              </td>
            </tr>`
                : ""
            }
            ${options.bodyHtml ?? ""}
            <tr>
              <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#666;">${escapeHtml(options.footerNote)}</p>
                ${
                  options.cta
                    ? `<p style="margin:16px 0 0;">
                  <a href="${escapeHtml(options.cta.href)}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(options.cta.label)}</a>
                </p>`
                    : ""
                }
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

function renderDetailsBlock(heading: string, text: string | null | undefined) {
  const value = text?.trim();
  if (!value) return "";

  return `<tr>
              <td style="padding:24px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 10px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#111;">${escapeHtml(heading)}</h2>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">${escapeHtml(value)}</p>
              </td>
            </tr>`;
}

function returnTemplateVariables(payload: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  adminNote?: string | null;
}) {
  return {
    first_name: payload.customerName.split(" ")[0] || "there",
    customer_name: payload.customerName,
    customer_email: payload.customerEmail,
    order_number: payload.orderNumber,
    reason: payload.reason,
    admin_note: payload.adminNote?.trim() || "",
  };
}

function buildReturnRequestAdminEmail(
  template: EmailTemplateContent,
  payload: ReturnRequestEmailPayload,
) {
  const submittedAt = new Date(payload.submittedAt).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const variables = returnTemplateVariables(payload);

  return {
    subject: fillTemplate(template.subject, variables),
    html: renderNoticeShell({
      highlightLabel: "Admin alert",
      title: fillTemplate(template.heading, variables),
      intro: fillTemplate(template.intro, variables),
      footerNote: fillTemplate(template.footer, variables),
      rows: [
        { label: "Order", value: payload.orderNumber, emphasize: true },
        ...(payload.itemLabel
          ? [{ label: "Item", value: payload.itemLabel, emphasize: true }]
          : []),
        { label: "Customer", value: payload.customerName },
        { label: "Email", value: payload.customerEmail || "—" },
        { label: "Phone", value: payload.customerPhone?.trim() || "—" },
        { label: "Reason", value: payload.reason },
        { label: "Submitted", value: submittedAt },
      ],
      bodyHtml: renderDetailsBlock("Additional details", payload.details),
      cta: { label: "Review returns", href: `${getSiteUrl()}/admin/returns` },
    }),
  };
}

/**
 * Notifies the admin inbox when a customer submits a return request.
 * Failures are logged and never throw — the return request must still succeed.
 */
export async function sendReturnRequestAdminEmail(
  payload: ReturnRequestEmailPayload,
): Promise<void> {
  const adminEmail = getOrderAdminEmail();
  if (!adminEmail) {
    console.error(
      "Return request email skipped: ORDER_ADMIN_EMAIL is not configured.",
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error(
      "Return request email skipped: RESEND_API_KEY is not configured.",
    );
    return;
  }

  try {
    const template = await getEmailTemplate("return_request_admin");
    if (!template.is_enabled) {
      return;
    }

    const email = buildReturnRequestAdminEmail(template, payload);
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      replyTo: payload.customerEmail || undefined,
      subject: email.subject,
      html: email.html,
      attachments: [getLogoAttachment()],
    });

    if (result.error) {
      console.error(
        "Return request email API error:",
        result.error.message || result.error,
      );
    }
  } catch (error) {
    console.error("Return request email failed:", error);
  }
}

export type ReturnDecisionEmailPayload = {
  decision: "approved" | "rejected";
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  adminNote?: string | null;
};

function buildReturnDecisionEmail(
  template: EmailTemplateContent,
  payload: ReturnDecisionEmailPayload,
) {
  const variables = returnTemplateVariables(payload);
  const approved = payload.decision === "approved";

  return {
    subject: fillTemplate(template.subject, variables),
    html: renderNoticeShell({
      highlightLabel: approved ? "Return approved" : "Return update",
      highlightColor: approved ? "#166534" : "#b91c1c",
      title: fillTemplate(template.heading, variables),
      intro: fillTemplate(template.intro, variables),
      footerNote: fillTemplate(template.footer, variables),
      rows: [
        { label: "Order", value: payload.orderNumber, emphasize: true },
        { label: "Reason", value: payload.reason },
        { label: "Decision", value: approved ? "Approved" : "Declined" },
      ],
    }),
  };
}

/** Notifies the customer when an admin approves or rejects a return request. Never throws. */
export async function sendReturnDecisionEmail(
  payload: ReturnDecisionEmailPayload,
): Promise<void> {
  if (!payload.customerEmail?.trim()) {
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("Return decision email skipped: RESEND_API_KEY is not configured.");
    return;
  }

  try {
    const template = await getEmailTemplate(
      payload.decision === "approved" ? "return_approved" : "return_rejected",
    );
    if (!template.is_enabled) {
      return;
    }

    const email = buildReturnDecisionEmail(template, payload);
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: payload.customerEmail,
      subject: email.subject,
      html: email.html,
      attachments: [getLogoAttachment()],
    });

    if (result.error) {
      console.error(
        "Return decision email API error:",
        result.error.message || result.error,
      );
    }
  } catch (error) {
    console.error("Return decision email failed:", error);
  }
}

function buildLowStockAdminEmail(
  template: EmailTemplateContent,
  alerts: LowStockAlert[],
) {
  const siteUrl = getSiteUrl();
  const variables = {
    item_count: alerts.length,
    first_item: alerts[0]?.productName ?? "product",
  };
  const alertRows = alerts
    .map((alert) => {
      const meta = [alert.color, alert.size]
        .filter((value): value is string => Boolean(value))
        .join(" · ");
      const threshold = alert.threshold ?? LOW_STOCK_THRESHOLD;

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
            <a href="${escapeHtml(`${siteUrl}/admin/products?q=${encodeURIComponent(alert.productSlug)}`)}" style="color:#111;text-decoration:none;"><strong>${escapeHtml(alert.productName)}</strong></a>
            ${meta ? `<div style="margin-top:4px;color:#666;font-size:12px;">${escapeHtml(meta)}</div>` : ""}
            <div style="margin-top:4px;color:#666;font-size:12px;">Alert threshold: ${threshold}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#b45309;text-align:right;white-space:nowrap;vertical-align:top;font-weight:700;">
            ${alert.remaining} left
          </td>
        </tr>`;
    })
    .join("");

  return {
    subject: fillTemplate(template.subject, variables),
    html: renderNoticeShell({
      highlightLabel: "Admin alert",
      highlightColor: "#b45309",
      title: fillTemplate(template.heading, variables),
      intro: fillTemplate(template.intro, variables),
      footerNote: fillTemplate(template.footer, variables),
      bodyHtml: `<tr>
              <td style="padding:24px 28px 0;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${alertRows}
                </table>
              </td>
            </tr>`,
      cta: { label: "Open products", href: `${siteUrl}/admin/products?stock=low-stock` },
    }),
  };
}

/**
 * Notifies the admin inbox when stock crosses from in-stock into the low-stock range.
 * Failures are logged and never throw — checkout must still succeed.
 */
export async function sendLowStockAdminEmail(
  alerts: LowStockAlert[],
): Promise<void> {
  if (alerts.length === 0) {
    return;
  }

  const adminEmail = getOrderAdminEmail();
  if (!adminEmail) {
    console.error(
      "Low stock email skipped: ORDER_ADMIN_EMAIL is not configured.",
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error(
      "Low stock email skipped: RESEND_API_KEY is not configured.",
    );
    return;
  }

  try {
    const template = await getEmailTemplate("low_stock_admin");
    if (!template.is_enabled) {
      return;
    }

    const email = buildLowStockAdminEmail(template, alerts);
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: adminEmail,
      subject: email.subject,
      html: email.html,
      attachments: [getLogoAttachment()],
    });

    if (result.error) {
      console.error(
        "Low stock email API error:",
        result.error.message || result.error,
      );
      return;
    }

    console.info(
      `Low stock email sent to ${adminEmail} for ${alerts.length} item(s).`,
    );
  } catch (error) {
    console.error("Low stock email failed:", error);
  }
}

const PREVIEW_ORDER: OrderEmailPayload = {
  orderId: "preview",
  orderNumber: "VEL-123456-7890",
  customerName: "Amaya Perera",
  customerEmail: "amaya@example.com",
  customerPhone: "077 123 4567",
  paymentMethod: "cash_on_delivery",
  paymentStatus: "pending",
  orderStatus: "processing",
  trackingNumber: "TRK-998877",
  couponCode: "WELCOME10",
  discount: 450,
  subtotal: 4500,
  shipping: 350,
  total: 4400,
  shippingAddress: {
    fullName: "Amaya Perera",
    line1: "42 Flower Road",
    city: "Colombo",
    state: "Western Province",
    postalCode: "00700",
    country: "Sri Lanka",
    phone: "077 123 4567",
    email: "amaya@example.com",
  },
  items: [
    { name: "Classic Oxford Shirt", color: "White", size: "M", quantity: 1, unitPrice: 2500 },
    { name: "Relaxed Chino", color: "Beige", size: "32", quantity: 1, unitPrice: 2000 },
  ],
  createdAt: new Date().toISOString(),
};

const PREVIEW_STATUS: Partial<Record<EmailTemplateKey, OrderStatus>> = {
  order_processing: "processing",
  order_shipped: "shipped",
  order_delivered: "delivered",
  order_cancelled: "cancelled",
  order_returned: "returned",
};

/** Renders a template with sample data for the admin editor (logo inlined as a data URI). */
export function buildEmailPreview(
  key: EmailTemplateKey,
  content: EmailTemplateContent,
): { subject: string; html: string } {
  const sampleReturn = {
    orderNumber: PREVIEW_ORDER.orderNumber,
    customerName: PREVIEW_ORDER.customerName,
    customerEmail: PREVIEW_ORDER.customerEmail,
    customerPhone: PREVIEW_ORDER.customerPhone,
    reason: "Size too small",
    details: "Would like to exchange for a larger size.",
    submittedAt: new Date().toISOString(),
    adminNote: "Please ship the items back within 7 days.",
  };

  let email: { subject: string; html: string };

  switch (key) {
    case "order_confirmation":
      email = renderOrderTemplate(content, PREVIEW_ORDER, "Confirmation");
      break;
    case "order_admin_alert":
      email = renderOrderTemplate(content, PREVIEW_ORDER, "Admin alert");
      break;
    case "return_request_admin":
      email = buildReturnRequestAdminEmail(content, sampleReturn);
      break;
    case "return_approved":
    case "return_rejected":
      email = buildReturnDecisionEmail(content, {
        ...sampleReturn,
        decision: key === "return_approved" ? "approved" : "rejected",
      });
      break;
    case "low_stock_admin":
      email = buildLowStockAdminEmail(content, [
        {
          productName: "Classic Oxford Shirt",
          productSlug: "classic-oxford-shirt",
          color: "White",
          size: "M",
          remaining: 3,
          threshold: 5,
        },
      ]);
      break;
    default: {
      const status = PREVIEW_STATUS[key] ?? "processing";
      email = renderOrderTemplate(
        content,
        { ...PREVIEW_ORDER, orderStatus: status },
        ORDER_STATUS_LABELS[status],
      );
    }
  }

  const logoDataUri = `data:image/png;base64,${getLogoBuffer().toString("base64")}`;
  return {
    subject: email.subject,
    html: email.html.replaceAll(`cid:${LOGO_CONTENT_ID}`, logoDataUri),
  };
}

