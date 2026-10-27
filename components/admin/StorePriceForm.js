"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPatch } from "@/lib/adminApi";

/**
 * A store's own price per SMS for custom purchases (super admin only).
 * `store.sms_unit_price` null = the store is on the default.
 */
export default function StorePriceForm({ store, defaultPrice, onSaved }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(store.sms_unit_price != null ? String(store.sms_unit_price) : "");

  const mut = useMutation({
    mutationFn: (unit_price) => adminPatch(`/stores/${store.store_id}/sms-price`, { unit_price }),
    onSuccess: (res) => {
      toast.success(
        res.sms_unit_price == null
          ? `Back on the default (৳${res.effective_unit_price} per SMS).`
          : `Price set to ৳${res.sms_unit_price} per SMS.`,
      );
      qc.invalidateQueries({ queryKey: ["admin-stores"] });
      qc.invalidateQueries({ queryKey: ["admin-store", String(store.store_id)] });
      onSaved?.(res);
    },
    onError: (e) => toast.error(e.message || "Could not save the price."),
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return toast.error("Enter a price, or use “Use default”.");
        mut.mutate(value.trim());
      }}
    >
      <label className="block">
        <span className="block text-xs font-medium text-gray-700 mb-1">Price per SMS (৳)</span>
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={defaultPrice != null ? `Default: ${defaultPrice}` : "e.g. 0.65"}
          disabled={mut.isPending}
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={mut.isPending}>
          {mut.isPending ? "Saving..." : "Save price"}
        </Button>
        {store.sms_unit_price != null && (
          <Button type="button" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate(null)}>
            Use default
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Applies to custom SMS purchases only; packages keep their own prices.
      </p>
    </form>
  );
}
