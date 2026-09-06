"use server";

import { revalidatePath } from "next/cache";
import { setupRegistrationProfile } from "@/lib/registration";
import { deductInventoryForOrderItems } from "@/lib/order-inventory";
import {
  buildOrderEmailPayload,
  sendOrderEmails,
} from "@/lib/order-emails";
import { calculateShipping } from "@/lib/checkout-constants";
import {
  normalizePaymentStatus,
  resolveCheckoutStatuses,
} from "@/lib/order-status";
import { createAdminClient, hasAdminCredentials } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Address, CartItem, Order, PaymentMethod, Profile } from "@/lib/types";

export type CheckoutCustomerData = {
  isLoggedIn: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
  } | null;
  addresses: Address[];
};

export type PlaceOrderInput = {
  mode: "registered" | "guest";
  email: string;
  subscribeNews?: boolean;
  password?: string;
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  paymentMethod: PaymentMethod;
  cardPaymentOutcome?: "success" | "failed" | "incomplete";
  saveAddress?: boolean;
  savedAddressId?: string;
  items: CartItem[];
};

export type PlaceOrderResult = {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  error?: string;
};

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VEL-${timestamp}-${randomSuffix}`;
}

function normalizeAddressField(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function addressesMatch(
  existing: {
    full_name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  },
  incoming: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  },
): boolean {
  return (
    normalizeAddressField(existing.full_name) ===
      normalizeAddressField(incoming.fullName) &&
    normalizeAddressField(existing.line1) === normalizeAddressField(incoming.line1) &&
    normalizeAddressField(existing.line2) === normalizeAddressField(incoming.line2) &&
    normalizeAddressField(existing.city) === normalizeAddressField(incoming.city) &&
    normalizeAddressField(existing.state) === normalizeAddressField(incoming.state) &&
    normalizeAddressField(existing.postal_code) ===
      normalizeAddressField(incoming.postalCode) &&
    normalizeAddressField(existing.country) === normalizeAddressField(incoming.country)
  );
}

export async function getCheckoutCustomerData(): Promise<CheckoutCustomerData> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isLoggedIn: false,
        user: null,
        addresses: [],
      };
    }

    const [{ data: profile }, { data: addresses }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    const fullName = profile?.full_name || user.user_metadata?.full_name || "";
    const phone = profile?.phone || user.user_metadata?.phone || "";

    return {
      isLoggedIn: true,
      user: {
        id: user.id,
        email: user.email || "",
        fullName,
        phone,
      },
      addresses: (addresses as Address[]) || [],
    };
  } catch {
    return {
      isLoggedIn: false,
      user: null,
      addresses: [],
    };
  }
}

export type CustomerAuthResult = {
  success: boolean;
  isNewUser?: boolean;
  isRegistered?: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  addresses?: Address[];
  error?: string;
};

export async function checkEmailRegistered(
  email: string,
): Promise<{ isRegistered: boolean; fullName?: string }> {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      return { isRegistered: false };
    }

    if (hasAdminCredentials()) {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("full_name")
        .ilike("email", trimmed)
        .maybeSingle();

      if (data) {
        return { isRegistered: true, fullName: data.full_name || "" };
      }

      try {
        const { data: userData } = await admin.auth.admin.listUsers();
        const found = userData?.users?.find(
          (u) => u.email?.toLowerCase() === trimmed,
        );
        if (found) {
          return {
            isRegistered: true,
            fullName: found.user_metadata?.full_name || "",
          };
        }
      } catch {
        // Ignore listUsers error
      }
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .ilike("email", trimmed)
        .maybeSingle();

      if (data) {
        return { isRegistered: true, fullName: data.full_name || "" };
      }
    }

    return { isRegistered: false };
  } catch {
    return { isRegistered: false };
  }
}

export async function authenticateOrRegisterCustomer(
  email: string,
  password: string,
): Promise<CustomerAuthResult> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address in Contact above." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Please enter your password (minimum 6 characters)." };
  }

  try {
    const supabase = await createClient();

    // 1. First attempt to sign in (Existing User)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

    if (!authError && authData.user) {
      const userId = authData.user.id;
      const [{ data: profile }, { data: addresses }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone, created_at, updated_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", userId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      const fullName =
        profile?.full_name || authData.user.user_metadata?.full_name || "";
      const phone = profile?.phone || authData.user.user_metadata?.phone || "";
      const names = fullName.trim().split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";

      return {
        success: true,
        isNewUser: false,
        isRegistered: true,
        user: {
          id: userId,
          email: authData.user.email || trimmedEmail,
          fullName,
          firstName,
          lastName,
          phone,
        },
        addresses: (addresses as Address[]) || [],
      };
    }

    // 2. Sign in failed: check if user already exists (wrong password)
    const checkRes = await checkEmailRegistered(trimmedEmail);
    if (checkRes.isRegistered) {
      return {
        success: false,
        error: "Incorrect password for this registered account. Please check your password or reset it.",
      };
    }

    // 3. New User Registration
    if (password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters to create a new account.",
      };
    }

    if (hasAdminCredentials()) {
      const admin = createAdminClient();
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: trimmedEmail,
          password,
          email_confirm: true,
        });

      if (createError) {
        if (createError.message.toLowerCase().includes("already registered")) {
          return {
            success: false,
            error: "Incorrect password for this registered account.",
          };
        }
        return { success: false, error: createError.message };
      }

      if (created.user) {
        await setupRegistrationProfile(admin, created.user.id, trimmedEmail, {
          fullName: "",
          phone: "",
        });

        // Sign in session cookies
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        return {
          success: true,
          isNewUser: true,
          isRegistered: true,
          user: {
            id: created.user.id,
            email: trimmedEmail,
            fullName: "",
            firstName: "",
            lastName: "",
            phone: "",
          },
          addresses: [],
        };
      }
    } else {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (signUpData.user) {
        await setupRegistrationProfile(
          supabase,
          signUpData.user.id,
          trimmedEmail,
          { fullName: "", phone: "" },
        );

        return {
          success: true,
          isNewUser: true,
          isRegistered: true,
          user: {
            id: signUpData.user.id,
            email: trimmedEmail,
            fullName: "",
            firstName: "",
            lastName: "",
            phone: "",
          },
          addresses: [],
        };
      }
    }

    return {
      success: false,
      error: "Unable to complete sign in or registration. Please try again.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function authenticateAndFetchCustomer(
  email: string,
  password: string,
): Promise<CustomerAuthResult> {
  return authenticateOrRegisterCustomer(email, password);
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  try {
    // 1. Validate items
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Your bag is empty. Please add items before checking out." };
    }

    // 2. Validate contact & delivery details
    const email = input.email.trim();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const line1 = input.line1.trim();
    const city = input.city.trim();
    const state = input.state.trim();
    const postalCode = input.postalCode.trim();
    const country = input.country.trim() || "Sri Lanka";
    const phone = input.phone.trim();

    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!firstName || !lastName) {
      return { success: false, error: "First name and last name are required." };
    }

    if (!line1) {
      return { success: false, error: "Delivery address is required." };
    }

    if (!city || !state || !postalCode) {
      return { success: false, error: "City, State/Province, and Postal Code are required." };
    }

    if (!phone || phone.length < 7) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let userId: string | null = currentUser?.id ?? null;
    let isGuest = input.mode === "guest";

    // 3. Handle Registration or Sign-in if user selected Registered mode but is not yet logged in
    if (input.mode === "registered" && !userId) {
      const password = input.password ?? "";
      if (!password || password.length < 6) {
        return {
          success: false,
          error: "Password is required to checkout as a registered member.",
        };
      }

      // Try signing in first if this email already exists
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInData?.user) {
        userId = signInData.user.id;
        isGuest = false;

        // Ensure profile has name/phone if empty
        try {
          const dbClient = hasAdminCredentials() ? createAdminClient() : supabase;
          await dbClient.from("profiles").upsert(
            {
              id: userId,
              full_name: fullName,
              email,
              phone,
            },
            { onConflict: "id" },
          );
        } catch {
          // Non-blocking
        }
      } else {
        // User does not exist yet with this password -> create new account
        if (password.length < 8) {
          return {
            success: false,
            error: "Password must be at least 8 characters to create a new account.",
          };
        }

        if (hasAdminCredentials()) {
          const admin = createAdminClient();

          const { data: created, error: createError } =
            await admin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                phone,
              },
            });

          if (createError) {
            if (createError.message.toLowerCase().includes("already registered")) {
              return {
                success: false,
                error:
                  "Incorrect password for this registered account. Please check your password or reset it.",
              };
            }
            return { success: false, error: createError.message };
          }

          if (created.user) {
            userId = created.user.id;
            isGuest = false;

            await setupRegistrationProfile(admin, userId, email, {
              fullName,
              phone,
            });

            // Sign in session cookies
            await supabase.auth.signInWithPassword({
              email,
              password,
            });
          }
        } else {
          const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                  phone,
                },
              },
            });

          if (signUpError) {
            if (signUpError.message.toLowerCase().includes("already registered")) {
              return {
                success: false,
                error:
                  "Incorrect password for this registered account. Please check your password or reset it.",
              };
            }
            return { success: false, error: signUpError.message };
          }

          if (signUpData.user) {
            userId = signUpData.user.id;
            isGuest = false;

            await setupRegistrationProfile(
              supabase,
              signUpData.user.id,
              email,
              { fullName, phone },
            );
          }
        }
      }
    }

    // 4. Optionally save a new address when the customer explicitly opts in
    if (userId && input.saveAddress && !input.savedAddressId) {
      try {
        const { data: existingAddresses } = await supabase
          .from("addresses")
          .select("id, full_name, line1, line2, city, state, postal_code, country")
          .eq("user_id", userId);

        const incomingAddress = {
          fullName,
          line1,
          line2: input.line2?.trim(),
          city,
          state,
          postalCode,
          country,
        };

        const alreadySaved = (existingAddresses ?? []).some((address) =>
          addressesMatch(address, incomingAddress),
        );

        if (!alreadySaved) {
          const isFirst = !existingAddresses || existingAddresses.length === 0;

          await supabase.from("addresses").insert({
            user_id: userId,
            label: "Default Delivery",
            full_name: fullName,
            line1,
            line2: input.line2?.trim() || null,
            city,
            state,
            postal_code: postalCode,
            country,
            is_default: isFirst,
            updated_at: new Date().toISOString(),
          });
        }
      } catch {
        // Address save is non-blocking for order completion
      }
    }

    // 5. Calculate Subtotal, Shipping, and Total
    const subtotal = input.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    const orderNumber = generateOrderNumber();

    const shippingAddressJson = {
      fullName,
      firstName,
      lastName,
      company: input.company?.trim() || "",
      line1,
      line2: input.line2?.trim() || "",
      city,
      state,
      postalCode,
      country,
      phone,
      email,
    };

    // 6. Deduct inventory before creating the order
    const dbClient = hasAdminCredentials() ? createAdminClient() : supabase;

    const inventoryResult = await deductInventoryForOrderItems(
      dbClient,
      input.items,
    );

    if (!inventoryResult.success) {
      return {
        success: false,
        error:
          inventoryResult.error ||
          "Some items are no longer in stock. Please review your bag and try again.",
      };
    }

    const paymentMethod = input.paymentMethod;
    const { status, paymentStatus } = resolveCheckoutStatuses(
      paymentMethod,
      paymentMethod === "card"
        ? (input.cardPaymentOutcome ?? "incomplete")
        : "incomplete",
    );

    const orderPayload = {
      user_id: userId,
      customer_email: email,
      customer_name: fullName,
      customer_phone: phone,
      order_number: orderNumber,
      status,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      is_guest: isGuest,
      subtotal,
      shipping,
      total,
      shipping_address: shippingAddressJson,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: orderData, error: orderError } = await dbClient
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderError || !orderData) {
      console.error("Failed to insert order:", orderError?.message);
      return {
        success: false,
        error: orderError?.message || "Failed to process order. Please try again.",
      };
    }

    const orderId = orderData.id;

    // 7. Insert Order Items
    const itemRows = input.items.map((item) => ({
      order_id: orderId,
      product_name: item.name,
      product_slug: item.slug,
      image: item.image,
      color: item.colorName || item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.price,
      created_at: new Date().toISOString(),
    }));

    const { error: itemsError } = await dbClient
      .from("order_items")
      .insert(itemRows);

    if (itemsError) {
      console.error("Failed to insert order items:", itemsError.message);
    }

    // 8. Clear registered user cart from DB
    if (userId) {
      try {
        await dbClient.from("cart_items").delete().eq("user_id", userId);
      } catch {
        // Ignore
      }
    }

    // 9. Confirmation email to customer + new-order alert to admin
    try {
      const emailPayload = buildOrderEmailPayload({
        orderId,
        orderNumber,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        paymentMethod,
        paymentStatus,
        orderStatus: status,
        subtotal,
        shipping,
        total,
        shippingAddress: {
          fullName,
          line1,
          line2: input.line2?.trim() || "",
          city,
          state,
          postalCode,
          country,
          phone,
          email,
        },
        items: input.items,
      });

      await sendOrderEmails(emailPayload);
    } catch (emailError) {
      console.error("Failed to send order emails:", emailError);
    }

    revalidatePath("/account/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/shop");
    revalidatePath("/");

    for (const slug of inventoryResult.slugs ?? []) {
      revalidatePath(`/products/${slug}`);
    }

    return {
      success: true,
      orderNumber,
      orderId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Unexpected checkout error:", message);
    return {
      success: false,
      error: "An unexpected error occurred while placing your order. Please try again.",
    };
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  try {
    const dbClient = hasAdminCredentials() ? createAdminClient() : await createClient();

    const { data, error } = await dbClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ...(data as Order),
      payment_status: normalizePaymentStatus(
        (data as Order).payment_status,
      ),
    };
  } catch {
    return null;
  }
}
