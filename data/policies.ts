export type PolicySection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  ordered?: boolean;
};

export type PolicyDocument = {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PolicySection[];
};

const STORE_NAME = "VELVORZ";
const RETURN_WINDOW_DAYS = 14;
const PROCESSING_BUSINESS_DAYS = 7;
const MINIMUM_AGE = 18;

export const refundPolicy: PolicyDocument = {
  eyebrow: "Legal",
  title: "Refund Policy",
  lastUpdated: "October 2, 2026",
  intro: [
    `Thank you for shopping at ${STORE_NAME}. We value your satisfaction and strive to provide you with the best online shopping experience possible. If, for any reason, you are not completely satisfied with your purchase, we are here to help.`,
  ],
  sections: [
    {
      title: "Returns",
      paragraphs: [
        `We accept returns within ${RETURN_WINDOW_DAYS} days from the date of purchase. To be eligible for a return, your item must be unused, unworn, unwashed, and in the same condition that you received it, with all tags attached. It must also be in the original packaging.`,
        "You can request a return from the Return Requests section of your account.",
      ],
    },
    {
      title: "Refunds",
      paragraphs: [
        "Once we receive your return and inspect the item, we will notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment. Please note that the refund amount will exclude any shipping charges incurred during the initial purchase.",
      ],
    },
    {
      title: "Exchanges",
      paragraphs: [
        `If you would like to exchange your item for a different size, color, or style, please contact our customer support team within ${RETURN_WINDOW_DAYS} days of receiving your order. We will provide you with further instructions on how to proceed with the exchange.`,
      ],
    },
    {
      title: "Non-Returnable Items",
      paragraphs: [
        "Certain items are non-returnable and non-refundable. These include:",
      ],
      list: [
        "Gift cards",
        "Personalized or custom-made items",
        "Underwear, swimwear, and socks for hygiene reasons",
        "Items marked as final sale",
      ],
    },
    {
      title: "Damaged or Defective Items",
      paragraphs: [
        "In the unfortunate event that your item arrives damaged or defective, please contact us immediately. We will arrange for a replacement or issue a refund, depending on your preference and product availability.",
      ],
    },
    {
      title: "Return Shipping",
      paragraphs: [
        "You will be responsible for paying the shipping costs for returning your item unless the return is due to our error (e.g., wrong item shipped, defective product). In such cases, we will cover the return shipping cost.",
      ],
    },
    {
      title: "Processing Time",
      paragraphs: [
        `Refunds and exchanges will be processed within ${PROCESSING_BUSINESS_DAYS} business days after we receive your returned item. Please note that it may take additional time for the refund to appear in your account, depending on your payment provider.`,
      ],
    },
    {
      title: "Contact Us",
      paragraphs: [
        "If you have any questions or concerns regarding our refund policy, please contact our customer support team. We are here to assist you and ensure your shopping experience with us is enjoyable and hassle-free.",
      ],
    },
  ],
};

export const privacyPolicy: PolicyDocument = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  lastUpdated: "October 2, 2026",
  intro: [
    `At ${STORE_NAME}, we are committed to protecting the privacy and security of our customers' personal information. This Privacy Policy outlines how we collect, use, and safeguard your information when you visit or make a purchase on our website. By using our website, you consent to the practices described in this policy.`,
  ],
  sections: [
    {
      title: "Information We Collect",
      paragraphs: [
        "When you visit our website, we may collect certain information about you, including:",
      ],
      list: [
        "Personal identification information (such as your name, email address, phone number, and shipping address) provided voluntarily by you during the registration or checkout process.",
        "Payment and billing information necessary to process your orders, including card details, which are securely handled by trusted third-party payment processors such as PayHere. We do not store your full card details.",
        "Browsing information, such as your IP address, browser type, and device information, collected automatically using cookies and similar technologies.",
      ],
    },
    {
      title: "Use of Information",
      paragraphs: [
        "We may use the collected information for the following purposes:",
      ],
      list: [
        "To process and fulfill your orders, including shipping and delivery.",
        "To communicate with you regarding your purchases, provide customer support, and respond to inquiries or requests.",
        "To personalize your shopping experience and present relevant product recommendations and promotions.",
        "To improve our website, products, and services based on your feedback and browsing patterns.",
        "To detect and prevent fraud, unauthorized activities, and abuse of our website.",
      ],
    },
    {
      title: "Information Sharing",
      paragraphs: [
        "We respect your privacy and do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:",
      ],
      list: [
        "Trusted service providers: We may share your information with third-party service providers who assist us in operating our website, processing payments, and delivering products. These providers are contractually obligated to handle your data securely and confidentially.",
        "Legal requirements: We may disclose your information if required to do so by law or in response to valid legal requests or orders.",
      ],
    },
    {
      title: "Data Security",
      paragraphs: [
        "We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      title: "Cookies and Tracking Technologies",
      paragraphs: [
        "We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and gather information about your preferences and interactions with our website. You have the option to disable cookies through your browser settings, but this may limit certain features and functionality of our website.",
      ],
    },
    {
      title: "Changes to the Privacy Policy",
      paragraphs: [
        'We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with a revised "last updated" date. We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information.',
      ],
    },
    {
      title: "Contact Us",
      paragraphs: [
        "If you have any questions, concerns, or requests regarding our Privacy Policy or the handling of your personal information, please contact us using the details below.",
      ],
    },
  ],
};

export const termsAndConditions: PolicyDocument = {
  eyebrow: "Legal",
  title: "Terms & Conditions",
  lastUpdated: "October 2, 2026",
  intro: [
    `Welcome to ${STORE_NAME}. These Terms and Conditions govern your use of our website and the purchase and sale of products from our platform. By accessing and using our website, you agree to comply with these terms. Please read them carefully before proceeding with any transactions.`,
  ],
  sections: [
    {
      title: "Use of the Website",
      ordered: true,
      list: [
        `You must be at least ${MINIMUM_AGE} years old to use our website or make purchases.`,
        "You are responsible for maintaining the confidentiality of your account information, including your username and password.",
        "You agree to provide accurate and current information during the registration and checkout process.",
        "You may not use our website for any unlawful or unauthorized purposes.",
      ],
    },
    {
      title: "Product Information and Pricing",
      ordered: true,
      list: [
        "We strive to provide accurate product descriptions, images, and pricing information. However, we do not guarantee the accuracy or completeness of such information. Colors may vary slightly depending on your screen.",
        "Prices are subject to change without notice. Any promotions or discounts are valid for a limited time and may be subject to additional terms and conditions.",
      ],
    },
    {
      title: "Orders and Payments",
      ordered: true,
      list: [
        "By placing an order on our website, you are making an offer to purchase the selected products.",
        "We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in pricing or product information, or suspected fraudulent activity.",
        "You agree to provide valid and up-to-date payment information and authorize us to charge the total order amount, including applicable taxes and shipping fees, to your chosen payment method.",
        "We use trusted third-party payment processors to handle your payment information securely. We do not store or have access to your full payment details.",
      ],
    },
    {
      title: "Shipping and Delivery",
      ordered: true,
      list: [
        "We will make reasonable efforts to ensure timely shipping and delivery of your orders.",
        "Shipping and delivery times provided are estimates and may vary based on your location and other factors.",
      ],
    },
    {
      title: "Returns and Refunds",
      ordered: true,
      list: [
        "Our Refund Policy governs the process and conditions for returning products and seeking refunds. Please refer to the Refund Policy page on our website for more information.",
      ],
    },
    {
      title: "Intellectual Property",
      ordered: true,
      list: [
        `All content and materials on our website, including but not limited to text, images, logos, and graphics, are protected by intellectual property rights and are the property of ${STORE_NAME} or its licensors.`,
        "You may not use, reproduce, distribute, or modify any content from our website without our prior written consent.",
      ],
    },
    {
      title: "Limitation of Liability",
      ordered: true,
      list: [
        `In no event shall ${STORE_NAME}, its directors, employees, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with your use of our website or the purchase and use of our products.`,
        "We make no warranties or representations, express or implied, regarding the quality, accuracy, or suitability of the products offered on our website.",
      ],
    },
    {
      title: "Amendments and Termination",
      paragraphs: [
        "We reserve the right to modify, update, or terminate these Terms and Conditions at any time without prior notice. It is your responsibility to review these terms periodically for any changes.",
      ],
    },
  ],
};
