"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  authenticateOrRegisterCustomer,
  checkEmailRegistered,
  getCheckoutCustomerData,
  placeOrder,
  type CheckoutCustomerData,
} from "@/app/checkout/actions";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui";
import {
  COUNTRIES,
  SRI_LANKA_PROVINCES,
  US_STATES,
  calculateShipping,
} from "@/lib/checkout-constants";
import { getColorLabel } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";
import type { Address, CheckoutMode } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart, isHydrated, hasOutOfStockItems } = useCart();

  // Customer & Auth state
  const [customerData, setCustomerData] = useState<CheckoutCustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  // Mode: "registered" or "guest" (The 2-tab segmented toggle replacing Ship/Pickup)
  const [mode, setMode] = useState<CheckoutMode>("guest");

  // Contact fields
  const [email, setEmail] = useState("");
  const [subscribeNews, setSubscribeNews] = useState(true);

  // Password for new registration in "registered" mode
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Delivery / Address fields
  const [country, setCountry] = useState("Sri Lanka");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Western Province");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);

  // Saved address selection for logged-in user
  const [selectedAddressId, setSelectedAddressId] = useState<string | "custom">("custom");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Inline Quick Sign In Modal / Drawer
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Password verification & Autofill state
  const [isEmailRegistered, setIsEmailRegistered] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const shippingCost = calculateShipping(subtotal);
  const total = subtotal + shippingCost;

  // Check if entered email is already registered in the system
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || customerData?.isLoggedIn) {
      setIsEmailRegistered(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const res = await checkEmailRegistered(trimmed);
        setIsEmailRegistered(res.isRegistered);
        if (res.isRegistered) {
          setMode("registered");
          setPasswordFeedback({
            type: "info",
            message: "Existing account found! Enter your password to sign in and autofill your details.",
          });
        } else {
          setPasswordFeedback({ type: null, message: "" });
        }
      } catch {
        // Ignore
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email, customerData?.isLoggedIn]);

  useEffect(() => {
    if (customerData?.isLoggedIn) {
      if (selectedAddressId !== "custom") {
        setSaveAddress(false);
      }
      return;
    }

    setSaveAddress(mode === "registered");
  }, [mode, customerData?.isLoggedIn, selectedAddressId]);

  // Authenticate or Register customer and automatically fill details when password is provided
  async function handleVerifyAndAutofill(candidatePassword?: string) {
    const passToTest = candidatePassword !== undefined ? candidatePassword : password;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setPasswordFeedback({
        type: "error",
        message: "Please enter your email address in the Contact section above.",
      });
      return;
    }

    if (!passToTest) {
      setPasswordFeedback({
        type: "error",
        message: "Please enter a password.",
      });
      return;
    }

    if (customerData?.isLoggedIn) {
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordFeedback({
      type: "info",
      message: "Checking account & processing...",
    });

    try {
      const res = await authenticateOrRegisterCustomer(trimmedEmail, passToTest);

      if (res.success && res.user) {
        setCustomerData({
          isLoggedIn: true,
          user: {
            id: res.user.id,
            email: res.user.email,
            fullName: res.user.fullName,
            phone: res.user.phone,
          },
          addresses: res.addresses || [],
        });

        // Autofill Name and Phone if available
        if (res.user.firstName) setFirstName(res.user.firstName);
        if (res.user.lastName) setLastName(res.user.lastName);
        if (res.user.phone) setPhone(res.user.phone);

        // Autofill default address if available
        if (res.addresses && res.addresses.length > 0) {
          const defaultAddr =
            res.addresses.find((a) => a.is_default) || res.addresses[0];
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
          setIsEditingAddress(false);
        }

        if (res.isNewUser) {
          setPasswordFeedback({
            type: "success",
            message:
              "✓ Account created & signed in! Please enter your delivery name and address below.",
          });
        } else {
          setPasswordFeedback({
            type: "success",
            message: `✓ Logged in! Welcome back ${res.user.fullName || res.user.email}. Saved details and address auto-filled.`,
          });
        }

        // Clear password field
        setPassword("");
        setConfirmPassword("");
      } else {
        setPasswordFeedback({
          type: "error",
          message: res.error || "Unable to sign in or register with this password.",
        });
      }
    } catch {
      setPasswordFeedback({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsVerifyingPassword(false);
    }
  }

  // Load customer session, profile & saved addresses on mount
  useEffect(() => {
    async function loadCustomer() {
      try {
        const data = await getCheckoutCustomerData();
        setCustomerData(data);

        if (data.isLoggedIn && data.user) {
          setMode("registered");
          setEmail(data.user.email);

          // Split full name into first and last
          const names = data.user.fullName.trim().split(" ");
          const first = names[0] || "";
          const last = names.slice(1).join(" ") || "";
          setFirstName(first);
          setLastName(last);
          if (data.user.phone) {
            setPhone(data.user.phone);
          }

          // Auto-fill default address if available
          if (data.addresses && data.addresses.length > 0) {
            const defaultAddr =
              data.addresses.find((a) => a.is_default) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            applyAddress(defaultAddr);
            setSaveAddress(false);
          }
        }
      } catch (err) {
        console.error("Failed to load customer data:", err);
      } finally {
        setIsLoadingCustomer(false);
      }
    }

    void loadCustomer();
  }, []);

  function applyAddress(addr: Address) {
    const names = addr.full_name.trim().split(" ");
    setFirstName(names[0] || "");
    setLastName(names.slice(1).join(" ") || "");
    setLine1(addr.line1 || "");
    setLine2(addr.line2 || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setPostalCode(addr.postal_code || "");
    setCountry(addr.country || "Sri Lanka");
  }

  function handleAddressSelect(addrId: string) {
    setSelectedAddressId(addrId);
    if (addrId === "custom") {
      setIsEditingAddress(true);
      setSaveAddress(false);
      setLine1("");
      setLine2("");
      setCity("");
      setState("Western Province");
      setPostalCode("");
    } else {
      const found = customerData?.addresses.find((a) => a.id === addrId);
      if (found) {
        applyAddress(found);
        setIsEditingAddress(false);
        setSaveAddress(false);
      }
    }
  }

  // Handle Quick Inline Sign In
  async function handleInlineSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError("");
    setIsSigningIn(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim(),
        password: signInPassword,
      });

      if (error) {
        setSignInError(error.message || "Invalid email or password.");
        setIsSigningIn(false);
        return;
      }

      // Reload customer details and auto-fill
      const refreshed = await getCheckoutCustomerData();
      setCustomerData(refreshed);
      setShowSignInModal(false);
      setMode("registered");

      if (refreshed.user) {
        setEmail(refreshed.user.email);
        const names = refreshed.user.fullName.trim().split(" ");
        setFirstName(names[0] || "");
        setLastName(names.slice(1).join(" ") || "");
        if (refreshed.user.phone) setPhone(refreshed.user.phone);

        if (refreshed.addresses && refreshed.addresses.length > 0) {
          const defaultAddr =
            refreshed.addresses.find((a) => a.is_default) || refreshed.addresses[0];
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
          setSaveAddress(false);
        }
      }
    } catch {
      setSignInError("Unable to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  // Handle Sign Out from checkout
  async function handleSignOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setCustomerData({ isLoggedIn: false, user: null, addresses: [] });
      setMode("guest");
      setPassword("");
      setConfirmPassword("");
    } catch {
      // Ignore
    }
  }

  // Submit Order
  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage("Your shopping bag is empty.");
      return;
    }

    if (hasOutOfStockItems) {
      setErrorMessage("Some items in your bag are out of stock. Please remove them to proceed.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please provide your first and last name.");
      return;
    }

    if (!line1.trim()) {
      setErrorMessage("Please provide your street address.");
      return;
    }

    if (!city.trim() || !state.trim() || !postalCode.trim()) {
      setErrorMessage("Please complete your city, state/province, and postal code.");
      return;
    }

    if (!phone.trim() || phone.length < 7) {
      setErrorMessage("Please enter a valid phone number for delivery coordination.");
      return;
    }

    // If registered mode and not logged in, authenticate or register user
    if (mode === "registered" && !customerData?.isLoggedIn) {
      if (!password || password.length < 6) {
        setErrorMessage(
          "Please enter your password under the Registered section (or choose 'Guest' to checkout without an account).",
        );
        return;
      }

      setIsVerifyingPassword(true);
      try {
        const res = await authenticateOrRegisterCustomer(email.trim(), password);
        if (!res.success || !res.user) {
          setIsVerifyingPassword(false);
          setErrorMessage(
            res.error || "Unable to sign in or register with this password. Please check and try again.",
          );
          return;
        }

        setCustomerData({
          isLoggedIn: true,
          user: {
            id: res.user.id,
            email: res.user.email,
            fullName: res.user.fullName,
            phone: res.user.phone,
          },
          addresses: res.addresses || [],
        });
      } catch {
        setIsVerifyingPassword(false);
        setErrorMessage("Unable to process account login/registration. Please try again.");
        return;
      } finally {
        setIsVerifyingPassword(false);
      }
    }

    setIsSubmitting(true);

    try {
      const res = await placeOrder({
        mode,
        email,
        subscribeNews,
        password: mode === "registered" && !customerData?.isLoggedIn ? password : undefined,
        firstName,
        lastName,
        company,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        phone,
        paymentMethod: "cash_on_delivery",
        saveAddress,
        savedAddressId:
          selectedAddressId !== "custom" ? selectedAddressId : undefined,
        items,
      });

      if (!res.success || !res.orderNumber) {
        setErrorMessage(res.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Order placed successfully! Clear cart & navigate to confirmation
      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(res.orderNumber)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  if (!isHydrated || isLoadingCustomer) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 font-body text-sm text-on-surface-variant">
          Preparing checkout...
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-headline text-3xl font-extrabold uppercase text-on-surface">
          Your Bag Is Empty
        </h1>
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          Add items to your bag before checking out.
        </p>
        <Button href="/shop" className="mt-6">
          Explore Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,26rem)] lg:gap-14">
      {/* ── Left Column: Checkout Details Form ── */}
      <div>
        {/* Express / Brand header */}
        <div className="mb-6 flex items-center justify-between border-b border-outline-variant pb-4">
          <Link
            href="/cart"
            className="font-body text-xs font-semibold text-on-surface-variant hover:text-on-surface underline underline-offset-4"
          >
            ← Return to Bag
          </Link>
          <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Secure 256-Bit SSL Checkout
          </span>
        </div>

        {/* Express options pill banner */}
        <div className="mb-8 rounded-sm border border-outline-variant bg-surface-container-low p-4 text-center">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            Express Checkout / Instant Payment
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="flex h-10 items-center justify-center rounded-md bg-[#5a31f4] px-6 text-sm font-bold text-white shadow-sm hover:opacity-90"
              title="Shop Pay"
            >
              <span className="font-semibold tracking-wide">shop</span>
              <span className="ml-0.5 rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold">Pay</span>
            </button>
            <button
              type="button"
              className="flex h-10 items-center justify-center rounded-md bg-[#ffc439] px-6 text-sm font-bold text-[#003087] shadow-sm hover:opacity-90"
              title="PayPal"
            >
              <span className="font-bold italic">Pay</span>
              <span className="font-bold italic text-[#0079C1]">Pal</span>
            </button>
            <button
              type="button"
              className="flex h-10 items-center justify-center rounded-md border border-outline-variant bg-black px-6 text-sm font-bold text-white shadow-sm hover:opacity-90"
              title="Google Pay"
            >
              <span className="text-white font-medium">G</span>
              <span className="ml-1 text-white font-bold">Pay</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-container-low px-3 font-label text-[10px] font-bold tracking-[0.2em] text-on-surface-variant">
                OR
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* ── 1. Contact Section ── */}
          <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
                Contact
              </h2>

              {customerData?.isLoggedIn && customerData.user ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-body text-on-surface-variant">
                    Signed in as <strong className="text-on-surface">{customerData.user.email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="font-body text-xs font-semibold text-primary underline hover:opacity-80"
                  >
                    (Sign out)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSignInModal(true)}
                  className="font-body text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Sign in
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="checkout-email"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    Email Address *
                  </label>
                  {isCheckingEmail ? (
                    <span className="font-body text-[11px] text-primary animate-pulse">
                      Checking email...
                    </span>
                  ) : !customerData?.isLoggedIn && email && isEmailRegistered ? (
                    <span className="font-label rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      Existing Member Found
                    </span>
                  ) : null}
                </div>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribeNews}
                  onChange={(e) => setSubscribeNews(e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="font-body text-xs text-on-surface-variant">
                  Email me with news, exclusive drops and promotional offers
                </span>
              </label>
            </div>
          </section>

          {/* ── 2. Delivery & Checkout Mode Section ── */}
          <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
              Delivery
            </h2>

            {/* Segmented Toggle: Registered vs Guest */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-1.5 border border-outline-variant">
              <button
                type="button"
                onClick={() => setMode("registered")}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md py-2.5 px-3 text-center transition-all",
                  mode === "registered"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest",
                )}
                aria-pressed={mode === "registered"}
              >
                <div className="flex items-center justify-center gap-1.5 w-full text-center">
                  <span className="text-sm leading-none">👤</span>
                  <span className="font-label text-xs font-bold uppercase tracking-[0.1em]">
                    Registered
                  </span>
                </div>
                <span
                  className={cn(
                    "font-body text-[11px] normal-case tracking-normal text-center w-full block",
                    mode === "registered" ? "text-on-primary/80" : "text-on-surface-variant/70",
                  )}
                >
                  Check out as user
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("guest")}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-md py-2.5 px-3 text-center transition-all",
                  mode === "guest"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest",
                )}
                aria-pressed={mode === "guest"}
              >
                <div className="flex items-center justify-center gap-1.5 w-full text-center">
                  <span className="text-sm leading-none">🛍️</span>
                  <span className="font-label text-xs font-bold uppercase tracking-[0.1em]">
                    Guest
                  </span>
                </div>
                <span
                  className={cn(
                    "font-body text-[11px] normal-case tracking-normal text-center w-full block",
                    mode === "guest" ? "text-on-primary/80" : "text-on-surface-variant/70",
                  )}
                >
                  Check out as guest
                </span>
              </button>
            </div>

            {/* Registered Mode: Single Unified Login & Register Form */}
            {mode === "registered" && !customerData?.isLoggedIn && (
              <div className="mt-5 rounded-md border border-outline-variant bg-surface-container-low/70 p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔐</span>
                    <div>
                      <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-on-surface">
                        Account Password (Login / Register)
                      </h3>
                      <p className="font-body text-xs text-on-surface-variant">
                        Enter your password to sign in & autofill your details (existing user) or register a new account.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login/forgot-password"
                    target="_blank"
                    className="font-body text-xs text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label
                      htmlFor="checkout-password-unified"
                      className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                    >
                      Password *
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="checkout-password-unified"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordFeedback.type === "error") {
                            setPasswordFeedback({ type: null, message: "" });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleVerifyAndAutofill();
                          }
                        }}
                        placeholder="Enter password (min 8 chars for new accounts)"
                        className="font-body w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 pr-14 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      disabled={isVerifyingPassword || !password}
                      onClick={() => void handleVerifyAndAutofill()}
                      className="font-label h-[42px] w-full sm:w-auto rounded-md bg-primary px-5 text-xs font-bold uppercase tracking-[0.12em] text-on-primary transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifyingPassword ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        "Log In / Register & Autofill"
                      )}
                    </button>
                  </div>
                </div>

                {passwordFeedback.message ? (
                  <p
                    className={cn(
                      "font-body text-xs font-medium pt-1",
                      passwordFeedback.type === "error"
                        ? "text-error"
                        : passwordFeedback.type === "success"
                          ? "text-green-600"
                          : "text-primary",
                    )}
                  >
                    {passwordFeedback.message}
                  </p>
                ) : null}
              </div>
            )}

            {/* Logged-In User Success Banner under Registered toggle */}
            {customerData?.isLoggedIn && customerData.user && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-green-600/30 bg-green-600/10 p-3 text-xs text-green-700">
                <span className="font-body">
                  ✓ <strong>{customerData.user.fullName || customerData.user.email}</strong> — details & saved address auto-filled. You can edit any field below.
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-label text-[11px] font-bold uppercase tracking-wider text-error underline hover:opacity-80"
                >
                  Sign out
                </button>
              </div>
            )}

            {/* Saved Addresses Picker for logged in users */}
            {customerData?.isLoggedIn &&
            customerData.addresses &&
            customerData.addresses.length > 0 && (
              <div className="mt-6 border-b border-outline-variant pb-6">
                <div className="flex items-center justify-between">
                  <label className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                    Saved Addresses
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(!isEditingAddress);
                      if (!isEditingAddress) {
                        setSelectedAddressId("custom");
                      }
                    }}
                    className="font-body text-xs font-semibold text-primary underline"
                  >
                    {isEditingAddress ? "Use saved address" : "+ Add or edit address"}
                  </button>
                </div>

                {!isEditingAddress ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {customerData.addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleAddressSelect(addr.id)}
                          className={cn(
                            "flex flex-col items-start rounded-md border p-3 text-left transition",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-outline-variant hover:border-primary/50",
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-label text-xs font-bold uppercase text-on-surface">
                              {addr.label || "Address"}
                            </span>
                            {addr.is_default ? (
                              <span className="rounded bg-surface-container-low px-1.5 py-0.5 text-[9px] font-bold uppercase text-on-surface-variant">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="font-body mt-1 text-xs text-on-surface">
                            {addr.full_name}
                          </p>
                          <p className="font-body text-xs text-on-surface-variant">
                            {addr.line1}, {addr.city}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {/* Delivery Inputs */}
            <div className="mt-6 space-y-4">
              {/* Country / Region */}
              <div>
                <label
                  htmlFor="checkout-country"
                  className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                >
                  Country / Region *
                </label>
                <select
                  id="checkout-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* First Name & Last Name */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="checkout-firstname"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    First Name *
                  </label>
                  <input
                    id="checkout-firstname"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Leo"
                    className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-lastname"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    Last Name *
                  </label>
                  <input
                    id="checkout-lastname"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Johnson"
                    className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Company (Optional) */}
              <div>
                <label
                  htmlFor="checkout-company"
                  className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                >
                  Company (Optional)
                </label>
                <input
                  id="checkout-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label
                  htmlFor="checkout-address1"
                  className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                >
                  Address Line 1 *
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="checkout-address1"
                    type="text"
                    required
                    autoComplete="address-line1"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="Street address, house/building number, P.O. box"
                    className="font-body w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 pr-10 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant">
                    🔍
                  </span>
                </div>
              </div>

              {/* Address Line 2 */}
              <div>
                <label
                  htmlFor="checkout-address2"
                  className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                >
                  Address Line 2 (Optional)
                </label>
                <input
                  id="checkout-address2"
                  type="text"
                  autoComplete="address-line2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apartment, suite, unit, floor, building, etc."
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* City, Province/State, Postal Code */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="checkout-city"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    City *
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-state"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    Province / State *
                  </label>
                  {country === "Sri Lanka" ? (
                    <select
                      id="checkout-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {SRI_LANKA_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  ) : country === "United States" ? (
                    <select
                      id="checkout-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="checkout-state"
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Province or State"
                      className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-postal"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    Postal Code / ZIP *
                  </label>
                  <input
                    id="checkout-postal"
                    type="text"
                    required
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="123"
                    className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="checkout-phone"
                  className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                >
                  Phone Number *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="mt-1 font-body text-[11px] text-on-surface-variant">
                  In case the delivery agent needs to reach you for drop-off.
                </p>
              </div>

              {/* Save Address Option */}
              {mode === "registered" &&
              (isEditingAddress ||
                selectedAddressId === "custom" ||
                !customerData?.isLoggedIn) && (
                <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="font-body text-xs text-on-surface-variant">
                    {customerData?.isLoggedIn
                      ? "Save this address for future orders"
                      : "Save this address to my new account"}
                  </span>
                </label>
              )}
            </div>
          </section>

          {/* ── 3. Payment Method (Cash on Delivery) ── */}
          <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
              Payment Method
            </h2>

            {/* Payment Method - Cash on Delivery */}
            <div className="mt-4 rounded-md border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full border-4 border-primary bg-surface-container-lowest" />
                  <div>
                    <p className="font-headline text-sm font-bold text-on-surface">
                      Cash on Delivery (COD)
                    </p>
                    <p className="font-body mt-1 text-xs text-on-surface-variant leading-relaxed">
                      Pay in cash directly to the courier when your package arrives at your delivery address. No advance payment required.
                    </p>
                  </div>
                </div>
                <span className="font-label rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary shrink-0">
                  Active
                </span>
              </div>
            </div>
          </section>

          {/* Error Banner */}
          {errorMessage ? (
            <div className="rounded-md border border-error/30 bg-error/10 p-4">
              <p className="font-body text-sm font-semibold text-error">
                {errorMessage}
              </p>
            </div>
          ) : null}

          {/* Complete Order Button (Mobile fallback) */}
          <div className="lg:hidden">
            <Button
              type="submit"
              disabled={isSubmitting || hasOutOfStockItems}
              className="w-full py-4 text-xs font-bold uppercase tracking-[0.15em]"
            >
              {isSubmitting ? "Processing Order..." : `Complete Order • ${formatPrice(total)}`}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Right Column: Order Summary Sidebar ── */}
      <div>
        <div className="sticky top-24 rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
          <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
            Order Summary
          </h2>

          <ul className="mt-6 divide-y divide-outline-variant">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-outline-variant bg-surface-container-low">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover object-center"
                  />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                    {item.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-headline text-xs font-bold uppercase text-on-surface truncate">
                    {item.name}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">
                    {getColorLabel(item.color, undefined, item.colorName)} / {item.size}
                  </p>
                </div>

                <p className="font-body text-sm font-semibold tabular-nums text-on-surface shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between text-sm">
              <dt className="font-body text-on-surface-variant">Subtotal</dt>
              <dd className="font-body font-medium text-on-surface tabular-nums">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="font-body text-on-surface-variant">Shipping</dt>
              <dd className="font-body font-medium text-on-surface tabular-nums">
                {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant pt-3">
              <dt className="font-headline text-base font-bold uppercase text-on-surface">
                Total
              </dt>
              <dd className="font-headline text-xl font-extrabold text-on-surface tabular-nums">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <Button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting || hasOutOfStockItems || items.length === 0}
              className="w-full py-4 text-xs font-bold uppercase tracking-[0.15em]"
            >
              {isSubmitting ? "Placing Order..." : "Place Order (Cash on Delivery)"}
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-on-surface-variant">
            <span className="text-xs">🔒</span>
            <span className="font-label text-[10px] uppercase tracking-[0.1em]">
              Safe & Guaranteed Cash on Delivery
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Sign In Modal ── */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowSignInModal(false)}
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="font-headline text-lg font-bold uppercase text-on-surface">
              Sign In to Your Account
            </h3>
            <p className="font-body mt-1 text-xs text-on-surface-variant">
              Log in to load your saved addresses and order history.
            </p>

            <form onSubmit={handleInlineSignIn} className="mt-4 space-y-4">
              <div>
                <label className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {signInError ? (
                <p className="font-body text-xs font-semibold text-error">
                  {signInError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3 text-xs font-bold uppercase tracking-[0.12em]"
              >
                {isSigningIn ? "Signing In..." : "Sign In & Continue"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
