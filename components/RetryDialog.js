"use client";
import { useState, useEffect } from "react";
import { X, Zap, Clock, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

/**
 * Retry dialog for failed SMS logs.
 *
 * Props:
 *   open           - boolean
 *   onClose        - () => void
 *   onConfirm      - ({ scheduled_at }) => Promise<void>  (scheduled_at is null for immediate)
 *   count          - number of messages the retry will apply to (1 for per-row, N for bulk)
 *   busy           - boolean, disables buttons while the parent request is in flight
 */
export default function RetryDialog({ open, onClose, onConfirm, count = 1, busy = false }) {
  const [mode, setMode] = useState("now"); // 'now' | 'schedule'
  const [datetime, setDatetime] = useState("");

  // Seed the datetime picker with "now + 30 min" (local time) whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDatetime(local);
    setMode("now");
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (mode === "schedule") {
      if (!datetime) return;
      const iso = new Date(datetime).toISOString();
      if (new Date(iso) <= new Date()) return;
      await onConfirm({ scheduled_at: iso });
    } else {
      await onConfirm({ scheduled_at: null });
    }
  };

  const label = count === 1 ? "1 failed message" : `${count} failed messages`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Retry SMS</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-gray-600">
          Retry {label}. Each retry deducts 1 SMS credit if it sends successfully.
        </p>

        <div className="mb-4 space-y-2">
          <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm transition ${mode === "now" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
            <input
              type="radio"
              name="retry-mode"
              value="now"
              checked={mode === "now"}
              onChange={() => setMode("now")}
              className="mt-0.5"
              disabled={busy}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                <Zap className="h-3.5 w-3.5" /> Send now
              </div>
              <div className="text-[11px] text-gray-500">Deliver immediately.</div>
            </div>
          </label>

          <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm transition ${mode === "schedule" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
            <input
              type="radio"
              name="retry-mode"
              value="schedule"
              checked={mode === "schedule"}
              onChange={() => setMode("schedule")}
              className="mt-0.5"
              disabled={busy}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                <Clock className="h-3.5 w-3.5" /> Schedule for later
              </div>
              <div className="text-[11px] text-gray-500 mb-1">Pick a date and time (your local timezone).</div>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                onClick={() => setMode("schedule")}
                min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                disabled={busy}
              />
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={busy || (mode === "schedule" && !datetime)}
            className="min-w-[80px]"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (mode === "schedule" ? "Schedule" : "Retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
