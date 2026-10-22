export type EmailTemplateKey =
  | "order_confirmation"
  | "order_admin_alert"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_returned"
  | "return_request_admin"
  | "return_approved"
  | "return_rejected"
  | "low_stock_admin";

export type EmailTemplateContent = {
  subject: string;
  heading: string;
  intro: string;
  footer: string;
  is_enabled: boolean;
};

export type EmailTemplateDefinition = EmailTemplateContent & {
  key: EmailTemplateKey;
  label: string;
  audience: "customer" | "admin";
  description: string;
  variables: string[];
};

const ORDER_VARIABLES = [
  "first_name",
  "customer_name",
  "customer_email",
  "order_number",
  "order_status",
  "tracking_number",
  "order_total",
];

const RETURN_VARIABLES = [
  "first_name",
  "customer_name",
  "customer_email",
  "order_number",
  "reason",
  "admin_note",
];

const SUPPORT_FOOTER =
  "If you have any questions, reply to this email or contact our support team.";

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  {
    key: "order_confirmation",
    label: "Order confirmation",
    audience: "customer",
    description: "Sent to the customer right after checkout.",
    variables: ORDER_VARIABLES,
    subject: "Order confirmed — {{order_number}} | VELVORZ",
    heading: "Order confirmed",
    intro:
      "Hi {{first_name}}, thank you for shopping with VELVORZ. Here is your order invoice and confirmation details.",
    footer:
      "We will update you when your order ships. If you have any questions, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "order_admin_alert",
    label: "New order alert",
    audience: "admin",
    description: "Sent to the admin inbox for every new order.",
    variables: ORDER_VARIABLES,
    subject: "New order — {{order_number}} | VELVORZ",
    heading: "New order received",
    intro:
      "A new order {{order_number}} was placed by {{customer_name}} ({{customer_email}}). Review the invoice details below.",
    footer: "Open the admin orders dashboard to update fulfillment and payment status.",
    is_enabled: true,
  },
  {
    key: "order_processing",
    label: "Order processing",
    audience: "customer",
    description: "Sent when an order moves to Processing.",
    variables: ORDER_VARIABLES,
    subject: "Order processing — {{order_number}} | VELVORZ",
    heading: "Order is processing",
    intro:
      "Hi {{first_name}}, your order {{order_number}} is now being prepared. We'll notify you again when it ships.",
    footer:
      "You can track this order from your account. If you have any questions, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "order_shipped",
    label: "Order shipped",
    audience: "customer",
    description: "Sent when an order is marked Shipped (includes tracking number).",
    variables: ORDER_VARIABLES,
    subject: "Order shipped — {{order_number}} | VELVORZ",
    heading: "Order has shipped",
    intro:
      "Hi {{first_name}}, great news — your order {{order_number}} is on its way. Your tracking number is {{tracking_number}}.",
    footer:
      "Use the tracking number above to follow your delivery. If you have any questions, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "order_delivered",
    label: "Order delivered",
    audience: "customer",
    description: "Sent when an order is marked Delivered.",
    variables: ORDER_VARIABLES,
    subject: "Order delivered — {{order_number}} | VELVORZ",
    heading: "Order delivered",
    intro:
      "Hi {{first_name}}, your order {{order_number}} has been marked as delivered. We hope you love it.",
    footer:
      "Thank you for shopping with VELVORZ. If anything looks off with your order, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "order_cancelled",
    label: "Order cancelled",
    audience: "customer",
    description: "Sent when an order is cancelled.",
    variables: ORDER_VARIABLES,
    subject: "Order cancelled — {{order_number}} | VELVORZ",
    heading: "Order cancelled",
    intro: "Hi {{first_name}}, your order {{order_number}} has been cancelled.",
    footer:
      "If you did not expect this change or need help with a replacement order, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "order_returned",
    label: "Order returned",
    audience: "customer",
    description: "Sent when an order is marked Returned.",
    variables: ORDER_VARIABLES,
    subject: "Order returned — {{order_number}} | VELVORZ",
    heading: "Order returned",
    intro: "Hi {{first_name}}, your return for order {{order_number}} has been completed.",
    footer:
      "If you have questions about your return or refund, reply to this email or contact our support team.",
    is_enabled: true,
  },
  {
    key: "return_request_admin",
    label: "Return request alert",
    audience: "admin",
    description: "Sent to the admin inbox when a customer submits a return request.",
    variables: RETURN_VARIABLES,
    subject: "Return request received — {{order_number}} | VELVORZ",
    heading: "Return request received",
    intro: "A customer submitted a return request for order {{order_number}}.",
    footer: "Review this return request and update the customer when a decision is made.",
    is_enabled: true,
  },
  {
    key: "return_approved",
    label: "Return approved",
    audience: "customer",
    description: "Sent to the customer when an admin approves their return request.",
    variables: RETURN_VARIABLES,
    subject: "Return approved — {{order_number}} | VELVORZ",
    heading: "Return approved",
    intro:
      "Hi {{first_name}}, your return request for order {{order_number}} has been approved. {{admin_note}}",
    footer: `Please keep the items in their original condition. ${SUPPORT_FOOTER}`,
    is_enabled: true,
  },
  {
    key: "return_rejected",
    label: "Return rejected",
    audience: "customer",
    description: "Sent to the customer when an admin rejects their return request.",
    variables: RETURN_VARIABLES,
    subject: "Return request update — {{order_number}} | VELVORZ",
    heading: "Return request declined",
    intro:
      "Hi {{first_name}}, unfortunately we could not approve your return request for order {{order_number}}. {{admin_note}}",
    footer: SUPPORT_FOOTER,
    is_enabled: true,
  },
  {
    key: "low_stock_admin",
    label: "Low stock alert",
    audience: "admin",
    description: "Sent to the admin inbox when items drop into the low-stock range.",
    variables: ["item_count"],
    subject: "Low stock — {{item_count}} item(s) | VELVORZ",
    heading: "Low stock reminder",
    intro:
      "Inventory just dropped to or below its low-stock threshold (still in stock). Restock soon to avoid selling out.",
    footer: "Review and update stock in the admin products panel.",
    is_enabled: true,
  },
];

export function getEmailTemplateDefinition(
  key: EmailTemplateKey,
): EmailTemplateDefinition {
  return EMAIL_TEMPLATE_DEFINITIONS.find((definition) => definition.key === key)!;
}

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return EMAIL_TEMPLATE_DEFINITIONS.some((definition) => definition.key === value);
}

export function fillTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>,
): string {
  return template
    .replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_match, name: string) => {
      const value = variables[name.toLowerCase()];
      return value === null || value === undefined ? "" : String(value);
    })
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
