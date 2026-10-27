"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmsAdmin } from "@/contexts/SmsAdminContext";
import { adminGet, adminPut } from "@/lib/adminApi";

const PRICING_KEY = ["admin-pricing"];

export default function PricingPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useSmsAdmin();
  const { data, isLoading, isError } = useQuery({ queryKey: PRICING_KEY, queryFn: () => adminGet("/pricing") });
  const [value, setValue] = useState("");

  const current = data?.default_unit_price;
  useEffect(() => {
    if (current !== undefined) setValue(String(current));
  }, [current]);

  const saveMut = useMutation({
    mutationFn: (unit_price) => adminPut("/pricing", { unit_price }),
    onSuccess: (res) => {
      toast.success(`Default price is now ৳${res.default_unit_price} per SMS.`);
      qc.invalidateQueries({ queryKey: PRICING_KEY });
      qc.invalidateQueries({ queryKey: ["admin-stores"] });
    },
    onError: (e) => toast.error(e.message || "Could not save the price."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Pricing
        </h1>
        <p className="text-sm text-gray-500">
          What stores pay per SMS when they buy a custom number of credits. Packages keep their own prices.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Default price per SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 rounded-xl" />
          ) : isError || current === undefined ? (
            <p className="text-sm text-red-600">Could not load the current price. Reload the page to try again.</p>
          ) : (
            <form
              className="flex items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate(value.trim());
              }}
            >
              <label className="flex-1">
                <span className="block text-xs font-medium text-gray-700 mb-1">৳ per SMS</span>
                <Input
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!isSuperAdmin || saveMut.isPending}
                  placeholder="0.70"
                />
              </label>
              {isSuperAdmin && (
                <Button type="submit" disabled={saveMut.isPending || value.trim() === String(current)}>
                  {saveMut.isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </form>
          )}
          <p className="text-xs text-gray-500">
            Used by every store that has no price of its own. Set a store&apos;s own price on the Stores page.
            Purchases already made keep the price they were bought at.
            {!isSuperAdmin && " Only a super admin can change prices."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
