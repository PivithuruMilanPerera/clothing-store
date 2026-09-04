"use client";

import { Lock, ShieldCheck, ShoppingBag, User } from "lucide-react";
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
  const [mode, setMode] = useState<CheckoutMode>("registered");

  // Contact fields
  const [email, setEmail] = useState("");

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
            message: "Existing account found. Sign in above, or enter your password below to continue.",
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

          // Auto-fill default address if available; keep form collapsed unless details are missing
          if (data.addresses && data.addresses.length > 0) {
            const defaultAddr =
              data.addresses.find((a) => a.is_default) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            applyAddress(defaultAddr);
            setSaveAddress(false);
            setIsEditingAddress(false);
          } else {
            // No saved address — open the form so they can enter details
            setIsEditingAddress(true);
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
      setSaveAddress(true);
      setLine1("");
      setLine2("");
      setCity("");
      setState("Western Province");
      setPostalCode("");
    } else {
      const found = customerData?.addresses.find((a) => a.id === addrId);
      if (found) {
        applyAddress(found);
        setSaveAddress(false);
      }
    }
  }

  function startEditAddress() {
    setIsEditingAddress(true);
    if (selectedAddressId === "custom" && customerData?.addresses?.length) {
      const defaultAddr =
        customerData.addresses.find((a) => a.is_default) || customerData.addresses[0];
      setSelectedAddressId(defaultAddr.id);
      applyAddress(defaultAddr);
      setSaveAddress(false);
    }
  }

  function startAddAddress() {
    setSelectedAddressId("custom");
    setIsEditingAddress(true);
    setSaveAddress(true);
    setLine1("");
    setLine2("");
    setCity("");
    setState("Western Province");
    setPostalCode("");
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
          setIsEditingAddress(false);
        } else {
          setIsEditingAddress(true);
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
      setMode("registered");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsEditingAddress(false);
      setSelectedAddressId("custom");
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
          "Please enter a password to create your account.",
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

      // Navigate first, then clear — clearing before navigation re-renders
      // the empty-bag state on this page and can interrupt the thank-you redirect.
      const successUrl = `/checkout/success?orderNumber=${encodeURIComponent(res.orderNumber)}`;
      router.replace(successUrl);
      clearCart();
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

  // Keep showing a loading state while redirecting after a successful order
  // (cart is cleared before the success page mounts).
  if (items.length === 0 && isSubmitting) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 font-body text-sm text-on-surface-variant">
          Confirming your order...
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
        {/* Checkout header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cart"
            className="font-body text-xs font-semibold text-on-surface-variant hover:text-on-surface underline underline-offset-4"
          >
            ← Return to Bag
          </Link>
          <span className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Secure 256-Bit SSL Checkout
          </span>
        </div>

        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* ── 1. Account ── */}
          <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            {customerData?.isLoggedIn && customerData.user ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-sm text-on-surface-variant">
                  Signed in as{" "}
                  <strong className="text-on-surface">{customerData.user.email}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-body text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setShowSignInModal(true)}
                  className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Sign in
                </button>{" "}
                to use your saved details and checkout faster.
              </p>
            )}
          </section>

          {/* ── 2. Delivery & Checkout Mode Section ── */}
          <section className="rounded-sm border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-headline text-lg font-bold uppercase text-on-surface">
                Delivery
              </h2>
              {customerData?.isLoggedIn ? (
                <div className="flex items-center gap-4">
                  {isEditingAddress ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                      className="font-body text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                    >
                      Done
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startEditAddress}
                        className="font-body text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={startAddAddress}
                        className="font-body text-sm font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        Add
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Segmented Toggle: Registered vs Guest — guests / signed-out only */}
            {!customerData?.isLoggedIn ? (
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
                    <User
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        mode === "registered" ? "text-on-primary" : "text-on-surface-variant",
                      )}
                      aria-hidden="true"
                    />
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
                    <ShoppingBag
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        mode === "guest" ? "text-on-primary" : "text-on-surface-variant",
                      )}
                      aria-hidden="true"
                    />
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
            ) : null}

            {/* Logged-in: collapsed delivery summary (form hidden until Edit) */}
            {customerData?.isLoggedIn && !isEditingAddress ? (
              <div className="mt-4 space-y-1 rounded-md border border-outline-variant bg-surface-container-low/40 p-4">
                <p className="font-body text-sm font-semibold text-on-surface">
                  {[firstName, lastName].filter(Boolean).join(" ") ||
                    customerData.user?.fullName ||
                    "—"}
                </p>
                {company ? (
                  <p className="font-body text-sm text-on-surface-variant">{company}</p>
                ) : null}
                <p className="font-body text-sm text-on-surface-variant">
                  {[line1, line2].filter(Boolean).join(", ") || "No address on file"}
                </p>
                <p className="font-body text-sm text-on-surface-variant">
                  {[city, state, postalCode].filter(Boolean).join(", ")}
                  {country ? (city || state || postalCode ? ` · ${country}` : country) : ""}
                </p>
                {phone ? (
                  <p className="font-body text-sm text-on-surface-variant">Phone: {phone}</p>
                ) : null}
                {email ? (
                  <p className="font-body text-sm text-on-surface-variant">{email}</p>
                ) : null}
              </div>
            ) : null}

            {/* Saved Addresses Picker — while editing an existing address */}
            {customerData?.isLoggedIn &&
            isEditingAddress &&
            selectedAddressId !== "custom" &&
            customerData.addresses &&
            customerData.addresses.length > 0 && (
              <div className="mt-6 border-b border-outline-variant pb-6">
                <label className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Saved Addresses
                </label>

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
              </div>
            )}

            {/* New address label when adding */}
            {customerData?.isLoggedIn &&
            isEditingAddress &&
            selectedAddressId === "custom" ? (
              <p className="mt-4 font-label text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                New Address
              </p>
            ) : null}

            {/* Delivery Inputs — always for guests; logged-in only when editing */}
            {(!customerData?.isLoggedIn || isEditingAddress) ? (
            <div className="mt-6 space-y-4">
              {!customerData?.isLoggedIn ? (
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="checkout-email"
                      className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                    >
                      Email for Order Updates *
                    </label>
                    {isCheckingEmail ? (
                      <span className="font-body text-[11px] text-primary animate-pulse">
                        Checking email...
                      </span>
                    ) : email && isEmailRegistered ? (
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
              ) : null}

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
                <input
                  id="checkout-address1"
                  type="text"
                  required
                  autoComplete="address-line1"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street address, house/building number, P.O. box"
                  className="font-body mt-1.5 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
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
            ) : null}

            {/* Register Account Password — bottom of Delivery */}
            {mode === "registered" && !customerData?.isLoggedIn && (
              <div className="mt-6 border-t border-outline-variant pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-sm font-bold uppercase text-on-surface">
                      Create Account Password
                    </h3>
                    <p className="font-body mt-1 text-xs text-on-surface-variant">
                      Choose a password to register your account when you place this order.
                    </p>
                    <p className="font-body mt-2 text-sm text-on-surface-variant">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setShowSignInModal(true)}
                        className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="checkout-password-register"
                    className="font-label block text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant"
                  >
                    Password *
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="checkout-password-register"
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
                      placeholder="Minimum 6 characters"
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

                {passwordFeedback.message ? (
                  <p
                    className={cn(
                      "font-body mt-3 text-xs font-medium",
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
                <div className="relative h-16 w-16 shrink-0">
                  <div className="relative h-full w-full overflow-hidden rounded-md border border-outline-variant bg-surface-container-low">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover object-center"
                    />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
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
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
