"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, Megaphone, Send, Clock, CreditCard, Settings } from "lucide-react";

const TABS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Send SMS", href: "/send", icon: Send },
  { label: "History", href: "/history", icon: Clock },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function MessagingTabNav() {
  const path = usePathname();

  return (
    <div className="mb-6 rounded-2xl bg-white border border-gray-100 p-1.5 inline-flex shadow-sm">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/"
            ? path === "/"
            : path.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
