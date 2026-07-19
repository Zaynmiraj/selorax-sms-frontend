"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Radio, Star, Trash2, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import { Skeleton } from "../../../../components/ui/skeleton";
import { adminGet, adminPost, adminPatch, adminDelete } from "../../../../lib/adminApi";

const KEY = ["admin-sender-ids"];

export default function SenderIdsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => adminGet("/sender-ids") });
  const senderIds = data?.sender_ids || [];

  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [asDefault, setAsDefault] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createMut = useMutation({
    mutationFn: () => adminPost("/sender-ids", { value: value.trim(), label: label.trim() || null, is_global_default: asDefault }),
    onSuccess: () => { toast.success("Sender ID added."); setValue(""); setLabel(""); setAsDefault(false); invalidate(); },
    onError: (e) => toast.error(e.message || "Could not add sender ID."),
  });

  const patchMut = useMutation({
    mutationFn: ({ id, body }) => adminPatch(`/sender-ids/${id}`, body),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message || "Update failed."),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminDelete(`/sender-ids/${id}`),
    onSuccess: () => { toast.success("Sender ID removed."); invalidate(); },
    onError: (e) => toast.error(e.message || "Delete failed."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Sender IDs
        </h1>
        <p className="text-sm text-gray-500">
          The pool of Anbernet-approved sender IDs. Assign these to stores. One can be the global default for unassigned stores.
        </p>
      </div>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a sender ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Value</label>
              <Input placeholder="e.g. 8809639884422 or SELORAX" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Label (optional)</label>
              <Input placeholder="e.g. Transactional long code" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-[13px] text-gray-600">
              <Switch checked={asDefault} onCheckedChange={setAsDefault} />
              Global default
            </label>
            <Button
              type="button"
              disabled={createMut.isPending}
              className="shrink-0"
              onClick={() => { if (!value.trim()) return toast.error("Enter a sender ID value."); createMut.mutate(); }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : senderIds.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="rounded-2xl bg-gray-50 p-4"><Radio className="h-6 w-6 text-gray-400" /></div>
              <div className="text-sm font-medium text-gray-700">No sender IDs yet</div>
              <div className="text-xs text-gray-500">Add your first Anbernet-approved sender ID above.</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {senderIds.map((s) => (
                <div key={s.sender_id_pk} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{s.value}</span>
                      <Badge variant="secondary">{s.type}</Badge>
                      {!!s.is_global_default && <Badge variant="success">Global default</Badge>}
                      {!s.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    {s.label && <div className="text-xs text-gray-500">{s.label}</div>}
                  </div>

                  <button
                    onClick={() => patchMut.mutate({ id: s.sender_id_pk, body: { is_global_default: true } })}
                    disabled={!!s.is_global_default || !s.is_active}
                    title={s.is_active ? "Set as global default" : "Activate first"}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Star className={`h-3.5 w-3.5 ${s.is_global_default ? "fill-amber-400 text-amber-400" : ""}`} />
                    Default
                  </button>

                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    <Switch
                      checked={!!s.is_active}
                      onCheckedChange={(v) => patchMut.mutate({ id: s.sender_id_pk, body: { is_active: v } })}
                    />
                    Active
                  </label>

                  <button
                    onClick={() => { if (confirm(`Remove sender ID "${s.value}"?`)) deleteMut.mutate(s.sender_id_pk); }}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
