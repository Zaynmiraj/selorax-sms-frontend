"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/adminApi";

function StatusBadge({ status }) {
  return status === "sent" ? <Badge variant="success">sent</Badge> : <Badge variant="destructive">failed</Badge>;
}

function fmt(ts) {
  if (!ts) return "";
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
}

function LogSkeleton() {
  return <div className="space-y-2 p-6">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
}

function StoreLogs() {
  const [status, setStatus] = useState("");
  const [storeId, setStoreId] = useState("");
  const [topic, setTopic] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs-store", status, storeId, topic],
    queryFn: () => {
      const p = new URLSearchParams();
      p.set("limit", "100");
      if (status) p.set("status", status);
      if (storeId) p.set("store_id", storeId);
      if (topic) p.set("event_topic", topic);
      return adminGet(`/logs/store?${p.toString()}`);
    },
  });
  const logs = data?.logs || [];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
        <span className="text-sm font-medium text-gray-700">Customer SMS</span>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            placeholder="Store ID..."
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="h-9 w-32 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="text"
            placeholder="Topic (e.g. order.created)..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-9 w-48 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
      <CardContent className="p-0">
        {isLoading ? (
          <LogSkeleton />
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No SMS logs.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div key={l.log_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[13px]">
                <StatusBadge status={l.status} />
                <span className="font-mono text-gray-700">{l.phone}</span>
                <span className="flex-1 min-w-[160px] truncate text-gray-500">{l.message}</span>
                <span className="text-gray-500">{l.store_name || `#${l.store_id}`}</span>
                {l.event_topic && <Badge variant="secondary">{l.event_topic}</Badge>}
                <span className="text-xs text-gray-400">{fmt(l.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs-admin"],
    queryFn: () => adminGet("/logs/admin?limit=100"),
  });
  const logs = data?.logs || [];

  return (
    <Card>
      <div className="border-b border-gray-100 px-5 py-3">
        <span className="text-sm font-medium text-gray-700">Admin SMS · login OTPs & admin sends</span>
      </div>
      <CardContent className="p-0">
        {isLoading ? (
          <LogSkeleton />
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">No admin SMS yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l) => (
              <div key={l.log_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-[13px]">
                <StatusBadge status={l.status} />
                <span className="font-mono text-gray-700">{l.phone}</span>
                <Badge variant="secondary">{l.purpose}</Badge>
                {l.provider && <span className="text-gray-400">{l.provider}</span>}
                {l.error && <span className="text-red-500">{l.error}</span>}
                <span className="flex-1" />
                <span className="text-xs text-gray-400">{fmt(l.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LogsPage() {
  const [tab, setTab] = useState("store"); // 'store' | 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Logs
        </h1>
        <p className="text-sm text-gray-500">SMS activity across the app.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("store")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition ${
            tab === "store" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ScrollText className="h-4 w-4" /> Customer SMS
        </button>
        <button
          onClick={() => setTab("admin")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition ${
            tab === "admin" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Admin SMS
        </button>
      </div>

      {tab === "store" ? <StoreLogs /> : <AdminLogs />}
    </div>
  );
}
