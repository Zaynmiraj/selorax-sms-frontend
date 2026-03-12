"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPost } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Clock, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_VARIANTS = {
  pending: "outline",
  processing: "default",
  sent: "default",
  failed: "destructive",
  cancelled: "outline",
};

export default function ScheduledPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messaging-scheduled", page, filter],
    queryFn: () => msgGet("/scheduled", { page, limit: 20, ...(filter ? { status: filter } : {}) }),
  });

  const jobs = data?.data?.jobs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleCancel = async (jobId) => {
    const res = await msgPost(`/scheduled/${jobId}/cancel`);
    if (res?.status === 200) {
      toast.success("Scheduled SMS cancelled");
      queryClient.invalidateQueries({ queryKey: ["messaging-scheduled"] });
    } else {
      toast.error(res?.message || "Failed to cancel");
    }
  };

  const filters = ["", "pending", "sent", "failed", "cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">Scheduled Messages</h3>
          <p className="text-xs text-gray-500">SMS messages queued for delayed or retry delivery</p>
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <Button
              key={f || "all"}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f); setPage(1); }}
              className="text-xs"
            >
              {f || "All"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card><CardContent className="p-4 text-sm text-red-600">Failed to load scheduled messages.</CardContent></Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No scheduled messages</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.job_id}>
                      <TableCell className="text-sm font-mono">{job.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{job.event_topic || "---"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(job.scheduled_at).toLocaleString("en-BD")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[job.status] || "outline"} className="text-xs">
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{job.attempts}/{job.max_attempts}</TableCell>
                      <TableCell>
                        {job.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(job.job_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs gap-1"
                          >
                            <XCircle className="h-3 w-3" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} total)</p>
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
    </div>
  );
}
