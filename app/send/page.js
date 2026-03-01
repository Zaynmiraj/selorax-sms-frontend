"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import SendSmsForm from "../../components/SendSmsForm";

export default function SendPage() {
  const queryClient = useQueryClient();

  const { data: walletData, isLoading: loadingWallet } = useQuery({
    queryKey: ["messaging-wallet"],
    queryFn: () => msgGet("/wallet"),
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["messaging-manual-logs"],
    queryFn: () => msgGet("/logs", { limit: 20, status: "" }),
  });

  const wallet = walletData?.data;
  const logs = logsData?.data?.logs || [];
  // Filter to show manual sends
  const manualLogs = logs.filter((l) => l.event_topic === "manual" || !l.event_topic);

  const handleSent = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-manual-logs"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
  };

  return (
    <div className="space-y-6">
      {loadingWallet ? (
        <Skeleton className="h-48 rounded-lg" />
      ) : (
        <SendSmsForm wallet={wallet} onSent={handleSent} />
      )}

      {/* Recent Manual Sends */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm">Recent Sends</h3>
          </div>
          {loadingLogs ? (
            <Skeleton className="h-24 m-4 rounded-lg" />
          ) : manualLogs.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No manual SMS sent yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="text-sm">{log.phone}</TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">{log.message}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString("en-BD")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
