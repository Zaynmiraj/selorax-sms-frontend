"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Users, Trash2, Plus, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { Switch } from "../../../../components/ui/switch";
import { Skeleton } from "../../../../components/ui/skeleton";
import { RequireSmsAdmin, useSmsAdmin } from "../../../../contexts/SmsAdminContext";
import { adminGet, adminPost, adminPatch, adminDelete } from "../../../../lib/adminApi";

const KEY = ["admin-admins"];

function AdminsInner() {
  const qc = useQueryClient();
  const { admin: me } = useSmsAdmin();
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => adminGet("/admins") });
  const admins = data?.admins || [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("admin");

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const createMut = useMutation({
    mutationFn: () => adminPost("/admins", { name: name.trim() || null, phone: phone.trim(), role }),
    onSuccess: () => { toast.success("Admin added."); setName(""); setPhone(""); setRole("admin"); invalidate(); },
    onError: (e) => toast.error(e.message || "Could not add admin."),
  });

  const patchMut = useMutation({
    mutationFn: ({ id, body }) => adminPatch(`/admins/${id}`, body),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e.message || "Update failed."),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminDelete(`/admins/${id}`),
    onSuccess: () => { toast.success("Admin removed."); invalidate(); },
    onError: (e) => toast.error(e.message || "Delete failed."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Admins
        </h1>
        <p className="text-sm text-gray-500">Super admins can add and control other admins. Admins log in with their phone via OTP.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add an admin</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Name (optional)</label>
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Phone</label>
              <Input placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </div>
            <Button
              type="button"
              disabled={createMut.isPending}
              className="shrink-0"
              onClick={() => { if (!phone.trim()) return toast.error("Enter a phone number."); createMut.mutate(); }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="rounded-2xl bg-gray-50 p-4"><Users className="h-6 w-6 text-gray-400" /></div>
              <div className="text-sm font-medium text-gray-700">No admins</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {admins.map((a) => {
                const isMe = me?.admin_id === a.admin_id;
                return (
                  <div key={a.admin_id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{a.name || a.phone}</span>
                        {a.role === "super_admin" && (
                          <Badge variant="success"><ShieldCheck className="mr-1 h-3 w-3" />Super admin</Badge>
                        )}
                        {isMe && <Badge variant="secondary">You</Badge>}
                        {!a.is_active && <Badge variant="outline">Disabled</Badge>}
                      </div>
                      <div className="text-xs text-gray-500">{a.phone}</div>
                    </div>

                    <select
                      value={a.role}
                      disabled={isMe || patchMut.isPending}
                      onChange={(e) => patchMut.mutate({ id: a.admin_id, body: { role: e.target.value } })}
                      className="h-9 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-800 disabled:opacity-50 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>

                    <label className="flex items-center gap-2 text-xs text-gray-500">
                      <Switch
                        checked={!!a.is_active}
                        onCheckedChange={(v) => !isMe && patchMut.mutate({ id: a.admin_id, body: { is_active: v } })}
                      />
                      Active
                    </label>

                    <button
                      onClick={() => { if (!isMe && confirm(`Remove admin ${a.name || a.phone}?`)) deleteMut.mutate(a.admin_id); }}
                      disabled={isMe}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                      title={isMe ? "You can't remove yourself" : "Remove"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminsPage() {
  return (
    <RequireSmsAdmin superAdminOnly>
      <AdminsInner />
    </RequireSmsAdmin>
  );
}
