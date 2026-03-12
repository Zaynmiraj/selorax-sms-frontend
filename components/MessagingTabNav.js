"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { title: "Dashboard", href: "/" },
  { title: "Templates", href: "/templates" },
  { title: "Send SMS", href: "/send" },
  { title: "History", href: "/history" },
  { title: "Scheduled", href: "/scheduled" },
  { title: "Billing", href: "/billing" },
];

export default function MessagingTabNav() {
  const path = usePathname();

  return (
    <div className="mb-4 border-0 rounded-lg bg-gray-50 p-1 shadow-sm inline-flex">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/"
            ? path === "/"
            : path.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}
