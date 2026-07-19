"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Radio, Store, ScrollText, Users, LogOut, LayoutDashboard } from "lucide-react";
import { LogoIcon } from "../Logo";
import { useSmsAdmin } from "../../contexts/SmsAdminContext";

const NAV = [
  { label: "Dashboard", href: "/admin", exact: true, icon: LayoutDashboard },
  { label: "Sender IDs", href: "/admin/sender-ids", icon: Radio },
  { label: "Stores", href: "/admin/stores", icon: Store },
  { label: "Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Admins", href: "/admin/admins", icon: Users, superAdminOnly: true },
];

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();
  const { admin, isSuperAdmin, logout } = useSmsAdmin();

  const items = NAV.filter((n) => !n.superAdminOnly || isSuperAdmin);

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoIcon size={30} />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            SMS Admin
          </div>
          <div className="text-[11px] text-gray-400">by SeloraX</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Manage
        </div>
        {items.map((tab) => {
          const isActive = tab.exact ? path === tab.href : path.startsWith(tab.href);
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
        })}
      </nav>

      {/* Account / logout */}
      <div className="border-t border-gray-100 p-3">
        <div className="mb-2 px-2">
          <div className="truncate text-[13px] font-medium text-gray-800">{admin?.name || admin?.phone}</div>
          <div className="text-[11px] capitalize text-gray-400">{admin?.role?.replace("_", " ")}</div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400" strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
