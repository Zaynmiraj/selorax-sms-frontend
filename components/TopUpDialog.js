"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X } from "lucide-react";
import { msgPost, msgGet } from "../lib/api";
import { sendBillingRedirect } from "../lib/app-bridge";
import toast from "react-hot-toast";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function TopUpDialog({ open, onOpenChange, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Clean up polling on unmount or dialog close
  useEffect(() => {
    if (!open && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast.error("Minimum top-up is 10 BDT");
      return;
    }

    setLoading(true);
    const res = await msgPost("/payment/topup", { amount: numAmount });

    if (res?.data?.confirmation_url) {
      sendBillingRedirect(res.data.confirmation_url);
      toast.success("Redirecting to payment approval...");

      if (res.data.charge_id) {
        pollCharge(res.data.charge_id);
      }
      onOpenChange(false);
    } else {
      toast.error(res?.message || "Failed to create payment charge");
    }
    setLoading(false);
  };

  const pollCharge = (chargeId) => {
    let attempts = 0;
    // Clear any existing poll
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
        toast.success("Payment successful! Credits added.");
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
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl border p-6 mx-4">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Top Up SMS Credits</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Amount (BDT)</label>
            <div className="flex gap-2 mb-2">
              {QUICK_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  variant={parseFloat(amount) === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(a.toString())}
                >
                  {a}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={10}
              max={50000}
            />
          </div>
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
            Payment will be processed securely through SeloraX billing. Your wallet will be credited after payment approval.
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTopUp} disabled={loading}>
            {loading ? "Processing..." : `Top Up ${amount ? `${amount} BDT` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
