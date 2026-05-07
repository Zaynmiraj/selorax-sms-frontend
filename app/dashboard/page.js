"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import TopUpDialog from "../../components/TopUpDialog";
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Zap,
  Megaphone,
  Plus,
  ArrowUpRight,
  Sparkles,
  Inbox,
} from "lucide-react";

export default function MessagingDashboard() {
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data: walletData, isLoading: loadingWallet } = useQuery({
    queryKey: ["messaging-wallet"],
    queryFn: () => msgGet("/wallet"),
  });

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["messaging-stats"],
    queryFn: () => msgGet("/stats"),
  });

  const { data: autoData } = useQuery({
    queryKey: ["messaging-automations"],
    queryFn: () => msgGet("/automations"),
  });

  const { data: campaignData } = useQuery({
    queryKey: ["messaging-campaigns-recent"],
    queryFn: () => msgGet("/campaigns", { limit: 3 }),
  });

  const { data: logsData } = useQuery({
    queryKey: ["messaging-logs-recent"],
    queryFn: () => msgGet("/logs", { limit: 10 }),
  });

  const wallet = walletData?.data;
  const stats = statsData?.data;
  const logs = logsData?.data?.logs || [];
  const automations = autoData?.data?.automations || [];
  const activeAutomations = automations.filter((a) => a.is_active).length;
  const totalAutomations = automations.length;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-logs-recent"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-automations"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] });
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {greeting}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-BD", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setTopUpOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          Buy SMS Credits
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard icon={MessageSquare} label="Total Sent" value={stats?.total_sent || 0} tone="blue" />
            <StatCard icon={Send} label="This Month" value={stats?.this_month || 0} tone="violet" />
            <StatCard icon={CheckCircle} label="Success Rate" value={`${stats?.success_rate || 0}%`} tone="emerald" />
            <StatCard icon={XCircle} label="Failed" value={stats?.total_failed || 0} tone="red" />
          </>
        )}
      </div>

      {/* Hero — wallet + automations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loadingWallet ? (
            <Skeleton className="h-[148px] rounded-2xl" />
          ) : (
            <WalletHero credits={wallet?.sms_credits ?? 0} onTopUp={() => setTopUpOpen(true)} />
          )}
        </div>

        <Link
          href="/automations"
          className="group block rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Automations
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-gray-900">{activeAutomations}</span>
            <span className="text-sm text-gray-500">/ {totalAutomations} active</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-500">Triggered by order &amp; customer events</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction href="/send" icon={Send} label="Send SMS" description="One-off message" tone="blue" />
          <QuickAction href="/campaigns/new" icon={Megaphone} label="New Campaign" description="Bulk SMS" tone="violet" />
          <QuickAction href="/automations" icon={Zap} label="Automations" description="Event triggers" tone="amber" />
          <QuickAction href="/history" icon={Inbox} label="View History" description="Past sends" tone="emerald" />
        </div>
      </div>

      {/* Recent logs */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Recent SMS</h3>
              <p className="mt-0.5 text-xs text-gray-500">Last 10 messages across all flows</p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <Inbox className="h-6 w-6 text-gray-300" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">No SMS sent yet</p>
              <p className="mt-1 text-xs text-gray-500">Send your first message to see it here.</p>
              <Link
                href="/send"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                <Send className="h-3 w-3" />
                Send SMS
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.log_id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-[13px] font-medium text-gray-900">
                      {log.phone}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-200 font-mono text-[10px] text-gray-600">
                        {log.event_topic || "manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={log.status} />
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-gray-500">
                      {new Date(log.created_at).toLocaleString("en-BD", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
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
        packages={wallet?.packages || []}
      />
    </div>
  );
}

const STAT_TONES = {
  blue: { iconBg: "bg-blue-100", iconText: "text-blue-600" },
  violet: { iconBg: "bg-violet-100", iconText: "text-violet-600" },
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
  red: { iconBg: "bg-red-100", iconText: "text-red-600" },
};

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const t = STAT_TONES[tone] || STAT_TONES.blue;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${t.iconBg}`}>
        <Icon className={`h-[18px] w-[18px] ${t.iconText}`} />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

const ACTION_TONES = {
  blue: "from-blue-500 to-indigo-500",
  violet: "from-violet-500 to-purple-500",
  amber: "from-amber-400 to-orange-500",
  emerald: "from-emerald-500 to-teal-500",
};

function QuickAction({ href, icon: Icon, label, description, tone }) {
  const grad = ACTION_TONES[tone] || ACTION_TONES.blue;
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
    >
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${grad} shadow-sm`}>
        <Icon className="h-[18px] w-[18px] text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>
      </div>
      <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-gray-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-900" />
    </Link>
  );
}

function WalletHero({ credits, onTopUp }) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-700 p-5 text-white shadow-lg shadow-blue-500/20">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative flex h-full flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <MessageSquare className="h-[18px] w-[18px]" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">
              SMS Balance
            </p>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-5xl font-bold tracking-tight">{Number(credits).toLocaleString()}</p>
            <p className="text-base font-medium text-blue-200">SMS</p>
          </div>
          <p className="mt-1.5 text-[11px] text-blue-200">
            70 chars = 1 credit · Use anytime, never expires
          </p>
        </div>
        <button
          onClick={onTopUp}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-md shadow-black/10 transition-all hover:bg-blue-50 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Top up
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const config =
    status === "sent"
      ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" }
      : { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text} ${config.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
