"use server";

export type ContactState = {
  error?: string;
  success?: string;
};

export async function submitContactForm(
  _prevState: ContactState | null,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !subject || !message) {
    return { error: "Please fill in all required fields." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (message.length < 10) {
    return { error: "Message must be at least 10 characters." };
  }

  // Placeholder for email or CRM integration.
  console.info("Contact form submission:", {
    name,
    email,
    subject,
    orderNumber: orderNumber || null,
    message,
  });

  return {
    success:
      "Thank you for reaching out. Our team will respond within 1–2 business days.",
  };
}
