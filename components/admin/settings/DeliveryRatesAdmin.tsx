"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  addMissingDistrictsAction,
  deleteDeliveryRateAction,
  saveDeliveryRateAction,
  saveShippingSettingsAction,
} from "@/app/admin/(dashboard)/settings/delivery/actions";
import {
  AdminBadge,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "@/components/admin/AdminUi";
import { SRI_LANKA_DISTRICTS } from "@/lib/checkout-constants";
import type { DeliveryAreaType, DeliveryRate, ShippingSettings } from "@/lib/delivery";
import { cn, formatPrice } from "@/lib/utils";

type RateDraft = {
  id?: string;
  areaType: DeliveryAreaType;
  name: string;
  rate: string;
  freeShippingThreshold: string;
  estimatedDays: string;
  isActive: boolean;
};

const EMPTY_DRAFT: RateDraft = {
  areaType: "district",
  name: "",
  rate: "",
  freeShippingThreshold: "",
  estimatedDays: "",
  isActive: true,
};

function toDraft(rate: DeliveryRate): RateDraft {
  return {
    id: rate.id,
    areaType: rate.area_type,
    name: rate.name,
    rate: String(rate.rate),
    freeShippingThreshold:
      rate.free_shipping_threshold === null ? "" : String(rate.free_shipping_threshold),
    estimatedDays: rate.estimated_days,
    isActive: rate.is_active,
  };
}

function RateForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  draft: RateDraft;
  setDraft: (draft: RateDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="grid gap-3 md:grid-cols-12 md:items-end"
    >
      <label className="block md:col-span-2">
        <span className={adminLabelClass}>Area type</span>
        <select
          value={draft.areaType}
          onChange={(event) =>
            setDraft({ ...draft, areaType: event.target.value as DeliveryAreaType, name: "" })
          }
          className={adminInputClass}
        >
          <option value="district">District</option>
          <option value="city">City</option>
        </select>
      </label>
      <label className="block md:col-span-3">
        <span className={adminLabelClass}>{draft.areaType === "district" ? "District" : "City"}</span>
        {draft.areaType === "district" ? (
          <select
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className={adminInputClass}
          >
            <option value="">Select district</option>
            {SRI_LANKA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="e.g. Nugegoda"
            className={adminInputClass}
          />
        )}
      </label>
      <label className="block md:col-span-2">
        <span className={adminLabelClass}>Rate (Rs.)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draft.rate}
          onChange={(event) => setDraft({ ...draft, rate: event.target.value })}
          className={adminInputClass}
        />
      </label>
      <label className="block md:col-span-2">
        <span className={adminLabelClass}>Free over (Rs.)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={draft.freeShippingThreshold}
          onChange={(event) => setDraft({ ...draft, freeShippingThreshold: event.target.value })}
          placeholder="Store default"
          className={adminInputClass}
        />
      </label>
      <label className="block md:col-span-2">
        <span className={adminLabelClass}>Est. delivery</span>
        <input
          value={draft.estimatedDays}
          onChange={(event) => setDraft({ ...draft, estimatedDays: event.target.value })}
          placeholder="1–2 days"
          className={adminInputClass}
        />
      </label>
      <label className="flex items-center gap-2 md:col-span-1 md:pb-2">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
        />
        <span className="font-body text-xs">Active</span>
      </label>
      <div className="flex gap-2 md:col-span-12 md:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className={adminSecondaryButtonClass}>
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={isPending} className={adminPrimaryButtonClass}>
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function DeliveryRatesAdmin({
  rates,
  settings,
  tableReady,
}: {
  rates: DeliveryRate[];
  settings: ShippingSettings;
  tableReady: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [defaultRate, setDefaultRate] = useState(String(settings.defaultRate));
  const [freeThreshold, setFreeThreshold] = useState(
    settings.freeShippingThreshold === null ? "" : String(settings.freeShippingThreshold),
  );
  const [newDraft, setNewDraft] = useState<RateDraft>(EMPTY_DRAFT);
  const [editDraft, setEditDraft] = useState<RateDraft | null>(null);
  const [bulkRate, setBulkRate] = useState(String(settings.defaultRate));
  const [filter, setFilter] = useState<"all" | DeliveryAreaType>("all");
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  function run(
    action: () => Promise<{ success: boolean; error?: string; message?: string }>,
    onSuccess?: () => void,
  ) {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setFeedback({ tone: "error", text: result.error || "Action failed." });
        return;
      }
      if (result.message) setFeedback({ tone: "success", text: result.message });
      onSuccess?.();
      router.refresh();
    });
  }

  const visibleRates = useMemo(
    () => rates.filter((rate) => filter === "all" || rate.area_type === filter),
    [rates, filter],
  );
  const districtCount = rates.filter((rate) => rate.area_type === "district").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Platform settings"
        title="Delivery rates"
        description="Checkout picks the delivery charge from the most specific match: a city rate first, then the customer’s district, then the store default."
      />

      {!tableReady ? (
        <AdminNotice>
          Delivery rate tables aren’t set up yet. Run{" "}
          <code>supabase/milestone-4-admin-migration.sql</code> in the Supabase SQL editor.
        </AdminNotice>
      ) : null}
      {feedback ? <AdminNotice tone={feedback.tone}>{feedback.text}</AdminNotice> : null}

      <AdminPanel
        title="Store defaults"
        description="Used when the address doesn’t match any configured district or city."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() =>
              saveShippingSettingsAction({
                defaultRate,
                freeShippingThreshold: freeThreshold,
              }),
            );
          }}
          className="grid gap-3 sm:grid-cols-3 sm:items-end"
        >
          <label className="block">
            <span className={adminLabelClass}>Default delivery rate (Rs.)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={defaultRate}
              onChange={(event) => setDefaultRate(event.target.value)}
              className={adminInputClass}
            />
          </label>
          <label className="block">
            <span className={adminLabelClass}>Free shipping over (Rs.)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={freeThreshold}
              onChange={(event) => setFreeThreshold(event.target.value)}
              placeholder="Blank = never free"
              className={adminInputClass}
            />
          </label>
          <button type="submit" disabled={isPending || !tableReady} className={adminPrimaryButtonClass}>
            Save defaults
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="Add delivery rate">
        <RateForm
          draft={newDraft}
          setDraft={setNewDraft}
          isPending={isPending}
          submitLabel="Add rate"
          onSubmit={() => run(() => saveDeliveryRateAction(newDraft), () => setNewDraft(EMPTY_DRAFT))}
        />
        {districtCount < SRI_LANKA_DISTRICTS.length ? (
          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-outline-variant pt-5">
            <label className="block">
              <span className={adminLabelClass}>Rate for remaining districts</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bulkRate}
                onChange={(event) => setBulkRate(event.target.value)}
                className={`${adminInputClass} w-40`}
              />
            </label>
            <button
              type="button"
              disabled={isPending || !tableReady}
              onClick={() => run(() => addMissingDistrictsAction(bulkRate))}
              className={adminSecondaryButtonClass}
            >
              Add all {SRI_LANKA_DISTRICTS.length - districtCount} missing districts
            </button>
          </div>
        ) : null}
      </AdminPanel>

      <AdminPanel
        title={`Configured rates (${rates.length})`}
        actions={
          <div className="flex gap-1">
            {(["all", "district", "city"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "font-label border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                  filter === value
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant text-on-surface-variant",
                )}
              >
                {value === "all" ? "All" : `${value}s`}
              </button>
            ))}
          </div>
        }
      >
        {visibleRates.length === 0 ? (
          <AdminEmptyState>No delivery rates configured — the store default applies everywhere.</AdminEmptyState>
        ) : (
          <ul className="divide-y divide-outline-variant">
            {visibleRates.map((rate) =>
              editDraft?.id === rate.id ? (
                <li key={rate.id} className="py-4">
                  <RateForm
                    draft={editDraft}
                    setDraft={setEditDraft}
                    isPending={isPending}
                    submitLabel="Save"
                    onCancel={() => setEditDraft(null)}
                    onSubmit={() => run(() => saveDeliveryRateAction(editDraft), () => setEditDraft(null))}
                  />
                </li>
              ) : (
                <li key={rate.id} className="flex flex-wrap items-center gap-3 py-3">
                  <AdminBadge>{rate.area_type}</AdminBadge>
                  <p className="font-body min-w-32 flex-1 text-sm font-medium text-on-surface">
                    {rate.name}
                    {!rate.is_active ? (
                      <span className="ml-2 text-xs text-on-surface-variant">(inactive)</span>
                    ) : null}
                  </p>
                  <p className="font-body w-24 text-sm tabular-nums">{formatPrice(rate.rate, { decimals: 0 })}</p>
                  <p className="font-body w-40 text-xs text-on-surface-variant">
                    {rate.free_shipping_threshold !== null
                      ? `Free over ${formatPrice(rate.free_shipping_threshold, { decimals: 0 })}`
                      : "Store free-shipping rule"}
                  </p>
                  <p className="font-body w-24 text-xs text-on-surface-variant">
                    {rate.estimated_days || "—"}
                  </p>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditDraft(toDraft(rate))}
                      className={adminSecondaryButtonClass}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => deleteDeliveryRateAction(rate.id))}
                      className="font-label px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-error"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
