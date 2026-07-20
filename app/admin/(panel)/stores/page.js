"use client";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Store, Plus, X, Search, Filter } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useSmsAdmin } from "@/contexts/SmsAdminContext";
import { adminGet, adminPatch } from "@/lib/adminApi";

const STORES_KEY = ["admin-stores"];

function CreditModal({ store, pending, onClose, onAdd }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("add"); // add or subtract

  const submit = (e) => {
    e.preventDefault();
    let n = parseInt(amount, 10);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter a valid amount > 0");
    if (mode === "subtract") n = -n;
    onAdd(n);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Manage Credits</h3>
        <p className="text-sm text-gray-500 mb-6">
          Store: <span className="font-medium text-gray-800">{store.name || `#${store.store_id}`}</span>
          <br />
          Current Balance: <span className="font-medium text-blue-600">{store.sms_credits}</span>
        </p>
        
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${mode === 'add' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setMode('add')}
            >
              Add (+)
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${mode === 'subtract' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setMode('subtract')}
            >
              Deduct (-)
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Confirm"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function StoresPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useSmsAdmin();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [creditModalStore, setCreditModalStore] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: storesData, isLoading } = useQuery({ queryKey: STORES_KEY, queryFn: () => adminGet("/stores") });
  const { data: sidData } = useQuery({ queryKey: ["admin-sender-ids"], queryFn: () => adminGet("/sender-ids") });

  const stores = storesData?.stores || [];
  const globalSenderIds = storesData?.global_sender_ids || [];
  const activeSenderIds = (sidData?.sender_ids || []).filter((s) => s.is_active);

  const assignMut = useMutation({
    mutationFn: ({ storeId, value }) => adminPatch(`/stores/${storeId}/sender-id`, { value }),
    onSuccess: () => { toast.success("Sender ID updated."); qc.invalidateQueries({ queryKey: STORES_KEY }); },
    onError: (e) => toast.error(e.message || "Could not update."),
  });

  const creditMut = useMutation({
    mutationFn: ({ storeId, amount }) => adminPatch(`/stores/${storeId}/credits`, { mode: "add", amount }),
    onSuccess: (res) => { 
      toast.success(`Credits updated (${res.sms_credits}).`); 
      qc.invalidateQueries({ queryKey: STORES_KEY });
      setCreditModalStore(null);
    },
    onError: (e) => toast.error(e.message || "Could not update credits."),
  });

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      if (filter === "enabled" && !s.is_enabled) return false;
      if (filter === "disabled" && s.is_enabled) return false;
      
      if (search) {
        const q = search.toLowerCase();
        const idStr = String(s.store_id);
        const nameStr = (s.name || "").toLowerCase();
        if (!idStr.includes(q) && !nameStr.includes(q)) return false;
      }
      return true;
    });
  }, [stores, search, filter]);

  const totalPages = Math.ceil(filteredStores.length / PAGE_SIZE) || 1;
  const paginatedStores = filteredStores.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Stores
        </h1>
        <p className="text-sm text-gray-500">
          Every store using the app. Assign a sender ID, or use the global fallback pool
          {globalSenderIds.length ? ` (${globalSenderIds.map((sender) => `#${sender.global_priority} ${sender.value}`).join(", ")})` : " (none configured)"}.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Search by Store ID or Name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="rounded-2xl bg-gray-50 p-4"><Store className="h-6 w-6 text-gray-400" /></div>
              <div className="text-sm font-medium text-gray-700">No stores found</div>
              <div className="text-xs text-gray-500">Adjust your search or filter criteria.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedStores.map((s) => (
                <div key={s.store_id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/stores/${s.store_id}`} className="font-medium text-blue-600 hover:underline">
                        {s.name || `Store #${s.store_id}`}
                      </Link>
                      {!s.is_enabled && <Badge variant="outline">Disabled</Badge>}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{s.store_id}
                      {s.domain ? ` · ${s.domain}` : ""} · <span className="font-medium">{s.sms_credits}</span> credits
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Sends as</span>
                    <span className="font-mono text-xs text-gray-700">{(s.sender_attempt_order || []).join(" → ") || "—"}</span>
                    {!s.assigned_sender_id && s.effective_sender_id && (
                      <Badge variant="secondary">global pool</Badge>
                    )}
                  </div>

                  <select
                    value={s.assigned_sender_id || ""}
                    disabled={assignMut.isPending}
                    onChange={(e) => assignMut.mutate({ storeId: s.store_id, value: e.target.value })}
                    className="h-9 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Use global fallback pool</option>
                    {activeSenderIds
                      .map((sid) => (
                      <option key={sid.sender_id_pk} value={sid.value}>
                        {sid.value}{sid.label ? ` — ${sid.label}` : ""}
                      </option>
                    ))}
                  </select>

                  {isSuperAdmin && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setCreditModalStore(s)}
                    >
                      Manage Credits
                    </Button>
                  )}
                </div>
              ))}
              
              {totalPages > 1 && (
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  total={filteredStores.length}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {creditModalStore && (
        <CreditModal 
          store={creditModalStore}
          pending={creditMut.isPending}
          onAdd={(amount) => creditMut.mutate({ storeId: creditModalStore.store_id, amount })}
          onClose={() => setCreditModalStore(null)}
        />
      )}
    </div>
  );
}
