"use client";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { msgGet, msgPost } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Search, ChevronLeft, ChevronRight, MessageSquare, RotateCw, CheckCircle2 } from "lucide-react";
import RetryDialog from "../../components/RetryDialog";

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [eventTopic, setEventTopic] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Retry selection + dialog state. `pendingRetryIds` is what the dialog will act on
  // when confirmed — either [singleLogId] for a per-row retry or the multi-select array
  // for bulk retry.
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [retryOpen, setRetryOpen] = useState(false);
  const [pendingRetryIds, setPendingRetryIds] = useState([]);
  const [retryBusy, setRetryBusy] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messaging-history", page, statusFilter, searchValue, eventTopic, fromDate, toDate],
    queryFn: () => msgGet("/logs", { page, limit: 25, status: statusFilter, phone: searchValue, event_topic: eventTopic, from_date: fromDate, to_date: toDate }),
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  // Failed rows on the current page that haven't already been retried — the pool
  // for select-all + bulk retry. A row with `retried_by_log_id` set has a newer
  // send already accounting for it; retrying it again would double-charge and
  // re-send the same message.
  const failedOnPage = useMemo(
    () => logs.filter((l) => l.status === "failed" && !l.retried_by_log_id),
    [logs],
  );
  const failedIdsOnPage = useMemo(() => failedOnPage.map((l) => l.log_id), [failedOnPage]);
  const allFailedSelected = failedIdsOnPage.length > 0 && failedIdsOnPage.every((id) => selectedIds.has(id));

  const handleSearch = () => {
    setSearchValue(phoneSearch.trim());
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFailed = () => {
    setSelectedIds((prev) => {
      if (allFailedSelected) {
        const next = new Set(prev);
        failedIdsOnPage.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      failedIdsOnPage.forEach((id) => next.add(id));
      return next;
    });
  };

  const openRetrySingle = (log_id) => {
    setPendingRetryIds([log_id]);
    setRetryOpen(true);
  };

  const openRetryBulk = () => {
    const ids = Array.from(selectedIds).filter((id) => failedIdsOnPage.includes(id));
    if (!ids.length) {
      // Fall back to all failed on current page when nothing explicitly selected.
      if (!failedIdsOnPage.length) {
        toast.error("No failed messages on this page.");
        return;
      }
      setPendingRetryIds(failedIdsOnPage);
    } else {
      setPendingRetryIds(ids);
    }
    setRetryOpen(true);
  };

  const handleRetryConfirm = async ({ scheduled_at }) => {
    if (!pendingRetryIds.length) return;
    setRetryBusy(true);
    try {
      let res;
      if (pendingRetryIds.length === 1) {
        res = await msgPost(`/logs/${pendingRetryIds[0]}/retry`, scheduled_at ? { scheduled_at } : {});
        if (res?.status === 200) {
          toast.success(scheduled_at ? "Retry scheduled." : "Retry sent.");
        } else if (res?.status === 402 || res?.code === "insufficient_balance") {
          toast.error("Out of SMS credit. Top up to retry.");
        } else {
          toast.error(res?.message || "Retry failed.");
        }
      } else {
        res = await msgPost(`/logs/retry-bulk`, { log_ids: pendingRetryIds, ...(scheduled_at ? { scheduled_at } : {}) });
        if (res?.status === 200) {
          const r = res.data || {};
          const parts = [];
          if (r.retried) parts.push(`${r.retried} sent`);
          if (r.scheduled) parts.push(`${r.scheduled} scheduled`);
          if (r.insufficient) parts.push(`${r.insufficient} out of credit`);
          if (r.failed) parts.push(`${r.failed} failed`);
          if (r.skipped) parts.push(`${r.skipped} skipped`);
          toast.success(parts.length ? parts.join(", ") : "Bulk retry processed.");
        } else {
          toast.error(res?.message || "Bulk retry failed.");
        }
      }
      setSelectedIds(new Set());
      setRetryOpen(false);
      // Refresh the list + wallet (credit was likely deducted).
      queryClient.invalidateQueries({ queryKey: ["messaging-history"] });
      queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    } catch (err) {
      toast.error(err?.message || "Retry failed.");
    } finally {
      setRetryBusy(false);
    }
  };

  const statuses = ["", "sent", "failed"];
  const selectedCount = Array.from(selectedIds).filter((id) => failedIdsOnPage.includes(id)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium text-sm">SMS History</h3>
          <p className="text-xs text-gray-500">{total} total messages</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {statuses.map((s) => (
              <Button
                key={s || "all"}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(s); setPage(1); setSelectedIds(new Set()); }}
                className="text-xs"
              >
                {s || "All"}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              placeholder="Search phone..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-36 text-xs h-8"
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-3 w-3" />
            </Button>
          </div>
          <select value={eventTopic} onChange={(e) => { setEventTopic(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">All Events</option>
            <option value="order.confirmed">Order Confirmed</option>
            <option value="order.shipped">Order Shipped</option>
            <option value="order.delivered">Order Delivered</option>
            <option value="order.cancelled">Order Cancelled</option>
            <option value="order.refunded">Order Refunded</option>
            <option value="order.payment_received">Payment Received</option>
            <option value="order.payment_recovery">Payment Recovery</option>
            <option value="customer.welcome">New Customer</option>
            <option value="campaign">Campaign</option>
            <option value="manual">Manual</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          {failedIdsOnPage.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={openRetryBulk}
              className="text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-50"
              title={selectedCount > 0 ? `Retry ${selectedCount} selected` : `Retry all ${failedIdsOnPage.length} failed on this page`}
            >
              <RotateCw className="h-3 w-3" />
              Retry {selectedCount > 0 ? `${selectedCount} selected` : `all failed (${failedIdsOnPage.length})`}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card><CardContent className="p-4 text-sm text-red-600">Failed to load SMS history.</CardContent></Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No messages found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      {failedIdsOnPage.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allFailedSelected}
                          onChange={toggleSelectAllFailed}
                          title="Select all failed on this page"
                          className="cursor-pointer"
                        />
                      )}
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isFailed = log.status === "failed";
                    const alreadyRetried = !!log.retried_by_log_id;
                    const retrySucceeded = alreadyRetried && log.retried_status === "sent";
                    return (
                      <TableRow key={log.log_id}>
                        <TableCell>
                          {isFailed && !alreadyRetried && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(log.log_id)}
                              onChange={() => toggleSelect(log.log_id)}
                              className="cursor-pointer"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{log.phone}</TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-[200px] truncate" title={log.message}>
                          {log.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{log.event_topic || "manual"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-BD")}
                        </TableCell>
                        <TableCell>
                          {isFailed && alreadyRetried && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                retrySucceeded
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 bg-gray-50 text-gray-600"
                              }`}
                              title={`Retried on ${new Date(log.retried_at).toLocaleString("en-BD")}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {retrySucceeded ? "Retried" : "Retry attempted"}
                            </span>
                          )}
                          {isFailed && !alreadyRetried && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRetrySingle(log.log_id)}
                              className="h-7 px-2 text-[11px] gap-1 border-amber-300 text-amber-800 hover:bg-amber-50"
                              title="Retry this SMS"
                            >
                              <RotateCw className="h-3 w-3" />
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <RetryDialog
        open={retryOpen}
        onClose={() => (retryBusy ? null : setRetryOpen(false))}
        onConfirm={handleRetryConfirm}
        count={pendingRetryIds.length}
        busy={retryBusy}
      />
    </div>
  );
}
