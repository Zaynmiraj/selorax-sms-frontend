"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Store, Coins, MessageSquare, ArrowLeft, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSmsAdmin } from "@/contexts/SmsAdminContext";
import { adminGet, adminPatch } from "@/lib/adminApi";

export default function StoreDetailsPage() {
  const params = useParams();
  const storeId = params.store_id;
  const qc = useQueryClient();
  const { isSuperAdmin } = useSmsAdmin();

  const STORE_KEY = ["admin-store", storeId];
  const LOGS_KEY = ["admin-store-logs", storeId];

  const { data: storeData, isLoading: storeLoading } = useQuery({ 
    queryKey: STORE_KEY, 
    queryFn: () => adminGet(`/stores/${storeId}`) 
  });
  
  const { data: sidData } = useQuery({ 
    queryKey: ["admin-sender-ids"], 
    queryFn: () => adminGet("/sender-ids") 
  });
  
  const { data: logsData, isLoading: logsLoading } = useQuery({ 
    queryKey: LOGS_KEY, 
    queryFn: () => adminGet(`/logs/store?store_id=${storeId}&limit=10`) 
  });

  const assignMut = useMutation({
    mutationFn: (value) => adminPatch(`/stores/${storeId}/sender-id`, { value }),
    onSuccess: () => { 
      toast.success("Sender ID updated."); 
      qc.invalidateQueries({ queryKey: STORE_KEY }); 
    },
    onError: (e) => toast.error(e.message || "Could not update sender ID."),
  });

  if (storeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!storeData?.store) {
    return <div className="text-red-500">Store not found.</div>;
  }

  const store = storeData.store;
  const logs = logsData?.logs || [];
  const activeSenderIds = (sidData?.sender_ids || []).filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/stores" className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {store.name || `Store #${store.store_id}`}
            {!store.is_enabled && <Badge variant="outline">Disabled</Badge>}
          </h1>
          <p className="text-sm text-gray-500">
            #{store.store_id} {store.domain ? `· ${store.domain}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">SMS Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Coins className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-700">Current Balance</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{store.sms_credits}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <span className="font-medium text-gray-700">Total SMS Sent</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{store.sms_sent_total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sender ID Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Sender ID</label>
              <select
                value={store.assigned_sender_id || ""}
                disabled={assignMut.isPending}
                onChange={(e) => assignMut.mutate(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">Use global fallback pool</option>
                {activeSenderIds.map((sid) => (
                  <option key={sid.sender_id_pk} value={sid.value}>
                    {sid.value}{sid.label ? ` — ${sid.label}` : ""}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-gray-500 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <span className="block font-medium text-gray-700 mb-1">Sender attempt order:</span>
              <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">{(store.sender_attempt_order || []).join(" → ") || "—"}</code>
              {!store.assigned_sender_id && store.effective_sender_id && (
                <span className="block mt-1 text-xs">This store uses the global fallback pool. The next sender is tried only after Anbernet explicitly rejects the current sender ID.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent SMS Logs</CardTitle>
          <Link href={`/admin/logs?store_id=${store.store_id}`} className="text-sm text-blue-600 hover:underline font-medium">
            View All
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No recent messages found for this store.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Recipient</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-3 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-mono">{log.phone}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {log.status === 'sent' && <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5"/> Sent</span>}
                        {log.status === 'failed' && <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5"/> Failed</span>}
                        {log.status === 'pending' && <span className="inline-flex items-center gap-1 text-yellow-600"><RefreshCw className="h-3.5 w-3.5 animate-spin"/> Pending</span>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">{log.event_topic || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
