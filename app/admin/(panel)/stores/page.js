"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Store, Plus } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Skeleton } from "../../../../components/ui/skeleton";
import { useSmsAdmin } from "../../../../contexts/SmsAdminContext";
import { adminGet, adminPatch } from "../../../../lib/adminApi";

const STORES_KEY = ["admin-stores"];

function CreditControl({ pending, onAdd }) {
  const [amount, setAmount] = useState("");
  const submit = () => {
    const n = parseInt(amount, 10);
    if (!Number.isFinite(n) || n === 0) return toast.error("Enter a credit amount.");
    onAdd(n);
    setAmount("");
  };
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        placeholder="± credits"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-9 w-24"
      />
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={submit} title="Add/deduct credits">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function StoresPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useSmsAdmin();
  const { data: storesData, isLoading } = useQuery({ queryKey: STORES_KEY, queryFn: () => adminGet("/stores") });
  const { data: sidData } = useQuery({ queryKey: ["admin-sender-ids"], queryFn: () => adminGet("/sender-ids") });

  const stores = storesData?.stores || [];
  const globalDefault = storesData?.global_default || null;
  const activeSenderIds = (sidData?.sender_ids || []).filter((s) => s.is_active);

  const assignMut = useMutation({
    mutationFn: ({ storeId, value }) => adminPatch(`/stores/${storeId}/sender-id`, { value }),
    onSuccess: () => { toast.success("Sender ID updated."); qc.invalidateQueries({ queryKey: STORES_KEY }); },
    onError: (e) => toast.error(e.message || "Could not update."),
  });

  const creditMut = useMutation({
    mutationFn: ({ storeId, amount }) => adminPatch(`/stores/${storeId}/credits`, { mode: "add", amount }),
    onSuccess: (res) => { toast.success(`Credits updated (${res.sms_credits}).`); qc.invalidateQueries({ queryKey: STORES_KEY }); },
    onError: (e) => toast.error(e.message || "Could not update credits."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Stores
        </h1>
        <p className="text-sm text-gray-500">
          Every store using the app. Assign each a sender ID, or leave on the global default
          {globalDefault ? ` (${globalDefault})` : " (none set)"}.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="rounded-2xl bg-gray-50 p-4"><Store className="h-6 w-6 text-gray-400" /></div>
              <div className="text-sm font-medium text-gray-700">No stores yet</div>
              <div className="text-xs text-gray-500">Stores appear here once they install the app.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stores.map((s) => (
                <div key={s.store_id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.name || `Store #${s.store_id}`}</span>
                      {!s.is_enabled && <Badge variant="outline">Disabled</Badge>}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{s.store_id}
                      {s.domain ? ` · ${s.domain}` : ""} · {s.sms_credits} credits
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Sends as</span>
                    <span className="font-mono text-xs text-gray-700">{s.effective_sender_id || "—"}</span>
                    {!s.assigned_sender_id && s.effective_sender_id && (
                      <Badge variant="secondary">default</Badge>
                    )}
                  </div>

                  <select
                    value={s.assigned_sender_id || ""}
                    disabled={assignMut.isPending}
                    onChange={(e) => assignMut.mutate({ storeId: s.store_id, value: e.target.value })}
                    className="h-9 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Global default</option>
                    {activeSenderIds.map((sid) => (
                      <option key={sid.sender_id_pk} value={sid.value}>
                        {sid.value}{sid.label ? ` — ${sid.label}` : ""}
                      </option>
                    ))}
                  </select>

                  {isSuperAdmin && (
                    <CreditControl
                      pending={creditMut.isPending}
                      onAdd={(amount) => creditMut.mutate({ storeId: s.store_id, amount })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
