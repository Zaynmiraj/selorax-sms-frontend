"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPut } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import WalletCard from "../components/WalletCard";
import TopUpDialog from "../components/TopUpDialog";
import toast from "react-hot-toast";
import { MessageSquare, Send, CheckCircle, XCircle } from "lucide-react";

export default function MessagingDashboard() {
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data: walletData, isLoading: loadingWallet, isError: walletError } = useQuery({
    queryKey: ["messaging-wallet"],
    queryFn: () => msgGet("/wallet"),
  });

  const { data: statsData, isLoading: loadingStats, isError: statsError } = useQuery({
    queryKey: ["messaging-stats"],
    queryFn: () => msgGet("/stats"),
  });

  const { data: settingsData, isError: settingsError } = useQuery({
    queryKey: ["messaging-settings"],
    queryFn: () => msgGet("/settings"),
  });

  const { data: logsData, isError: logsError } = useQuery({
    queryKey: ["messaging-logs-recent"],
    queryFn: () => msgGet("/logs", { limit: 10 }),
  });

  const wallet = walletData?.data;
  const stats = statsData?.data;
  const settings = settingsData?.data;
  const logs = logsData?.data?.logs || [];

  const toggleAutoSms = async (checked) => {
    const res = await msgPut("/settings", { auto_sms_enabled: checked ? 1 : 0 });
    if (res?.status === 200) {
      toast.success(`Auto-SMS ${checked ? "enabled" : "disabled"}`);
      queryClient.invalidateQueries({ queryKey: ["messaging-settings"] });
    }
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-logs-recent"] });
  };

  return (
    <div className="space-y-6">
      {/* Wallet */}
      {loadingWallet ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : walletError ? (
        <Card><CardContent className="p-4 text-sm text-red-600">Failed to load wallet data. Please refresh.</CardContent></Card>
      ) : (
        <WalletCard wallet={wallet} onTopUp={() => setTopUpOpen(true)} />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))
        ) : statsError ? (
          <div className="col-span-full text-sm text-red-600 p-4">Failed to load stats.</div>
        ) : (
          <>
            <StatCard icon={<MessageSquare className="h-5 w-5 text-blue-500" />} label="Total Sent" value={stats?.total_sent || 0} />
            <StatCard icon={<Send className="h-5 w-5 text-purple-500" />} label="This Month" value={stats?.this_month || 0} />
            <StatCard icon={<CheckCircle className="h-5 w-5 text-green-500" />} label="Success Rate" value={`${stats?.success_rate || 0}%`} />
            <StatCard icon={<XCircle className="h-5 w-5 text-red-500" />} label="Failed" value={stats?.total_failed || 0} />
          </>
        )}
      </div>

      {/* Settings Card */}
      {settings && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Auto-SMS on Order Events</h3>
              <p className="text-xs text-gray-500">
                Automatically send SMS when orders are confirmed, shipped, or delivered
              </p>
            </div>
            <Switch
              checked={!!settings.auto_sms_enabled}
              onCheckedChange={toggleAutoSms}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm">Recent SMS Logs</h3>
          </div>
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No SMS sent yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="text-sm">{log.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{log.event_topic || "manual"}</Badge>
                    </TableCell>
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

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onSuccess={refreshAll}
      />
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
