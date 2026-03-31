"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { X, MessageSquare, Check } from "lucide-react";
import { msgPost, msgGet } from "../lib/api";
import { sendBillingRedirect } from "../lib/app-bridge";
import toast from "react-hot-toast";

export default function TopUpDialog({ open, onOpenChange, onSuccess, packages = [] }) {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Clean up polling on unmount or dialog close
  useEffect(() => {
    if (!open && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (!open) setSelectedPkg(null);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const handlePurchase = async () => {
    if (!selectedPkg) {
      toast.error("Please select a package");
      return;
    }

    setLoading(true);
    const res = await msgPost("/payment/topup", { package_id: selectedPkg.package_id });

    if (res?.data?.confirmation_url) {
      sendBillingRedirect(res.data.confirmation_url);
      toast.success("Redirecting to payment...");

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
        <p className="text-sm text-gray-500 mb-5">Select a package to add SMS credits</p>

        <div className="grid gap-3">
          {packages.map((pkg) => {
            const isSelected = selectedPkg?.package_id === pkg.package_id;
            return (
              <button
                key={pkg.package_id}
                onClick={() => setSelectedPkg(pkg)}
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

        {packages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No packages available</p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePurchase} disabled={loading || !selectedPkg}>
            {loading
              ? "Processing..."
              : selectedPkg
              ? `Buy ${selectedPkg.name} — ৳${Number(selectedPkg.total_price).toLocaleString()}`
              : "Select a package"}
          </Button>
        </div>
      </div>
    </div>
  );
}
