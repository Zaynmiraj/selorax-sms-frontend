"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X, MessageSquare, Check } from "lucide-react";
import { msgPost, msgGet } from "../lib/api";
import { sendBillingRedirect } from "../lib/app-bridge";
import toast from "react-hot-toast";

const CUSTOM_SMS_UNIT_PRICE = 0.70;

export default function TopUpDialog({ open, onOpenChange, onSuccess, packages = [] }) {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [customSmsCount, setCustomSmsCount] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Clean up polling on unmount or dialog close
  useEffect(() => {
    if (!open && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!open) {
      setSelectedPkg(null);
      setCustomSmsCount("");
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const normalizedCustomCount = Number(customSmsCount);
  const hasValidCustomCount = Number.isInteger(normalizedCustomCount) && normalizedCustomCount > 0;
  const customTotalPrice = hasValidCustomCount
    ? Number((normalizedCustomCount * CUSTOM_SMS_UNIT_PRICE).toFixed(2))
    : 0;
  const purchaseLabel = selectedPkg
    ? `Buy ${selectedPkg.name} — ৳${Number(selectedPkg.total_price).toLocaleString()}`
    : hasValidCustomCount
      ? `Buy ${normalizedCustomCount.toLocaleString()} SMS — ৳${customTotalPrice.toLocaleString()}`
      : "Select a package or enter SMS quantity";

  const handlePurchase = async () => {
    if (!selectedPkg && !hasValidCustomCount) {
      toast.error("Please select a package or enter a custom SMS quantity");
      return;
    }

    setLoading(true);
    const res = await msgPost("/payment/topup", selectedPkg
      ? { package_id: selectedPkg.package_id }
      : { sms_count: normalizedCustomCount });

    if (res?.data?.confirmation_url) {
      const redirected = sendBillingRedirect(res.data.confirmation_url);
      toast.success("Redirecting to payment...");

      if (!redirected) {
        window.location.href = res.data.confirmation_url;
      }

      if (res.data.charge_id) {
        pollCharge(res.data.charge_id);
      }
      onOpenChange(false);
    } else {
      toast.error(res?.message || "Failed to create payment");
    }
    setLoading(false);
  };

  const pollCharge = (chargeId) => {
    let attempts = 0;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 120) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        return;
      }
      const res = await msgGet(`/payment/verify/${chargeId}`);
      if (res?.data?.status === "active") {
        clearInterval(pollRef.current);
        pollRef.current = null;
        toast.success("Payment successful! SMS credits added.");
        onSuccess?.();
      } else if (
        res?.data?.status === "declined" ||
        res?.data?.status === "cancelled" ||
        res?.data?.status === "expired"
      ) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        toast.error("Payment was not completed.");
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 mx-4">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-1">Buy SMS Package</h2>
        <p className="text-sm text-gray-500 mb-5">Choose a package or buy a custom SMS amount</p>

        <div className="grid gap-3">
          {packages.map((pkg) => {
            const isSelected = selectedPkg?.package_id === pkg.package_id;
            return (
              <button
                key={pkg.package_id}
                onClick={() => {
                  setSelectedPkg(pkg);
                  setCustomSmsCount("");
                }}
                className={`relative flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    <p className="text-xs text-gray-500">
                      {Number(pkg.sms_count).toLocaleString()} SMS
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base">৳{Number(pkg.total_price).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    ৳{parseFloat(pkg.price_per_sms).toFixed(2)}/SMS
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Custom SMS quantity</h3>
              <p className="text-xs text-gray-500">Buy exactly the number of SMS you need at ৳0.70 per SMS</p>
            </div>
            {hasValidCustomCount && !selectedPkg && (
              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 mb-1 block">SMS quantity</label>
              <Input
                type="number"
                min={1}
                step={1}
                value={customSmsCount}
                onChange={(e) => {
                  setSelectedPkg(null);
                  setCustomSmsCount(e.target.value);
                }}
                placeholder="e.g. 250"
              />
            </div>
            <div className="min-w-[130px] rounded-lg border border-gray-200 bg-white px-3 py-2">
              <p className="text-[11px] text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-900">
                ৳{customTotalPrice.toLocaleString(undefined, { minimumFractionDigits: hasValidCustomCount && !Number.isInteger(customTotalPrice) ? 2 : 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {packages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No packages available</p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePurchase} disabled={loading || (!selectedPkg && !hasValidCustomCount)}>
            {loading ? "Processing..." : purchaseLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
