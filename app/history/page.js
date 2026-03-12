"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Search, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messaging-history", page, statusFilter, searchValue],
    queryFn: () => msgGet("/logs", {
      page,
      limit: 25,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchValue ? { phone: searchValue } : {}),
    }),
  });

  const logs = data?.data?.logs || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  const handleSearch = () => {
    setSearchValue(phoneSearch.trim());
    setPage(1);
  };

  const statuses = ["", "sent", "failed"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-medium text-sm">SMS History</h3>
          <p className="text-xs text-gray-500">{total} total messages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {statuses.map((s) => (
              <Button
                key={s || "all"}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(s); setPage(1); }}
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.log_id}>
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
                    </TableRow>
                  ))}
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
    </div>
  );
}
