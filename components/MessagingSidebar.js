"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { msgGet } from "../lib/api";
import { LogoIcon } from "./Logo";
import {
  LayoutDashboard,
  Zap,
  Megaphone,
  Send,
  Clock,
  CreditCard,
  Settings,
  Plus,
} from "lucide-react";

const TABS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Automations", href: "/automations", icon: Zap, group: "main" },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone, group: "main" },
  { label: "Send SMS", href: "/send", icon: Send, group: "main" },
  { label: "History", href: "/history", icon: Clock, group: "main" },
  { label: "Billing", href: "/billing", icon: CreditCard, group: "account" },
  { label: "Settings", href: "/settings", icon: Settings, group: "account" },
];

export default function MessagingSidebar() {
  const path = usePathname();
  const { data: walletData } = useQuery({
    queryKey: ["messaging-wallet"],
    queryFn: () => msgGet("/wallet"),
  });
  const credits = walletData?.data?.sms_credits;

  const mainItems = TABS.filter((t) => t.group === "main");
  const accountItems = TABS.filter((t) => t.group === "account");

  const renderItem = (tab) => {
    const isActive = tab.href === "/" ? path === "/" : path.startsWith(tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          }`}
          strokeWidth={isActive ? 2.25 : 2}
        />
        <span className="truncate">{tab.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex w-[232px] shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* Brand */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <LogoIcon size={36} />
          <div className="min-w-0">
            <h1
              className="text-[15px] font-bold leading-tight tracking-tight text-gray-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Messaging
            </h1>
            <p className="text-[11px] leading-tight text-gray-500">by SeloraX</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Workspace
        </p>
        <div className="space-y-0.5">{mainItems.map(renderItem)}</div>

        <p className="px-3 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Account
        </p>
        <div className="space-y-0.5">{accountItems.map(renderItem)}</div>
      </nav>

      {/* SMS Credits widget */}
      <div className="border-t border-gray-100 p-3">
        <Link
          href="/billing"
          className="block overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-4 text-white shadow-md shadow-blue-500/20 transition-shadow hover:shadow-lg hover:shadow-blue-500/30"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
            SMS Credits
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="text-3xl font-bold tracking-tight">
              {credits != null ? Number(credits).toLocaleString() : "—"}
            </p>
            <p className="text-[11px] text-blue-200">SMS</p>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-[10px] text-blue-200">70 chars = 1 credit</p>
            <span className="inline-flex items-center gap-0.5 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              <Plus className="h-2.5 w-2.5" />
              Top up
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
