"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Radio, Trash2, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import { Skeleton } from "../../../../components/ui/skeleton";
import { adminGet, adminPost, adminPatch, adminDelete } from "../../../../lib/adminApi";

const KEY = ["admin-sender-ids"];

function priorityBody(priority) {
  const trimmed = String(priority ?? "").trim();
  if (!trimmed) return { global_priority: null };
  const number = Number(trimmed);
  if (!Number.isInteger(number) || number < 1) throw new Error("Priority must be a positive whole number.");
  return { global_priority: number };
}

export default function SenderIdsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => adminGet("/sender-ids") });
  const senderIds = data?.sender_ids || [];
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: ["admin-stores"] });
  };

  const createMut = useMutation({
    mutationFn: () => adminPost("/sender-ids", {
      value: value.trim(),
      label: label.trim() || null,
      ...priorityBody(priority),
    }),
    onSuccess: () => { toast.success("Sender ID added."); setValue(""); setLabel(""); setPriority(""); invalidate(); },
    onError: (e) => toast.error(e.message || "Could not add sender ID."),
  });
  const patchMut = useMutation({
    mutationFn: ({ id, body }) => adminPatch(`/sender-ids/${id}`, body),
    onSuccess: () => { toast.success("Sender ID updated."); invalidate(); },
    onError: (e) => toast.error(e.message || "Update failed."),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminDelete(`/sender-ids/${id}`),
    onSuccess: () => { toast.success("Sender ID removed."); invalidate(); },
    onError: (e) => toast.error(e.message || "Delete failed."),
  });

  const savePriority = (id, nextPriority) => {
    try { patchMut.mutate({ id, body: priorityBody(nextPriority) }); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Sender IDs</h1>
        <p className="text-sm text-gray-500">
          Anbernet-approved sender IDs. Stores use their assigned ID first; after an explicit sender-ID rejection, active global IDs are tried in priority order.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Add a sender ID</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><label className="mb-1.5 block text-[13px] font-medium text-gray-700">Value</label><Input placeholder="e.g. 8809639884422 or SELORAX" value={value} onChange={(e) => setValue(e.target.value)} /></div>
            <div className="flex-1"><label className="mb-1.5 block text-[13px] font-medium text-gray-700">Label (optional)</label><Input placeholder="e.g. Transactional long code" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
            <div className="w-full sm:w-40"><label className="mb-1.5 block text-[13px] font-medium text-gray-700">Global priority</label><Input type="number" min="1" placeholder="Optional" value={priority} onChange={(e) => setPriority(e.target.value)} /></div>
            <Button type="button" disabled={createMut.isPending} className="shrink-0" onClick={() => { if (!value.trim()) return toast.error("Enter a sender ID value."); try { priorityBody(priority); createMut.mutate(); } catch (e) { toast.error(e.message); } }}><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="space-y-2 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div> : senderIds.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center"><div className="rounded-2xl bg-gray-50 p-4"><Radio className="h-6 w-6 text-gray-400" /></div><div className="text-sm font-medium text-gray-700">No sender IDs yet</div><div className="text-xs text-gray-500">Add your first Anbernet-approved sender ID above.</div></div>
          ) : <div className="divide-y divide-gray-100">
            {senderIds.map((s) => <div key={s.sender_id_pk} className="flex flex-wrap items-center gap-3 px-6 py-4">
              <div className="flex-1 min-w-[180px]"><div className="flex items-center gap-2"><span className="font-medium text-gray-900">{s.value}</span><Badge variant="secondary">{s.type}</Badge>{s.global_priority && <Badge variant="success">Global #{s.global_priority}</Badge>}{!s.is_active && <Badge variant="outline">Inactive</Badge>}</div>{s.label && <div className="text-xs text-gray-500">{s.label}</div>}</div>
              <div className="w-36"><Input type="number" min="1" placeholder="Not global" defaultValue={s.global_priority || ""} disabled={!s.is_active || patchMut.isPending} onBlur={(e) => savePriority(s.sender_id_pk, e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs text-gray-500"><Switch checked={!!s.is_active} onCheckedChange={(v) => patchMut.mutate({ id: s.sender_id_pk, body: { is_active: v } })} />Active</label>
              <button onClick={() => { if (confirm(`Remove sender ID "${s.value}"?`)) deleteMut.mutate(s.sender_id_pk); }} className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600" title="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>)}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
