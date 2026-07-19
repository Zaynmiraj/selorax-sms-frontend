"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminMe, adminLogout } from "../lib/adminApi";
import { LogoIcon } from "../components/Logo";

const SmsAdminContext = createContext(null);

export function SmsAdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await adminMe();
      setAdmin(res?.admin || null);
    } catch (e) {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      // ignore — clear locally regardless
    }
    setAdmin(null);
  }, []);

  const value = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    isSuperAdmin: admin?.role === "super_admin",
    setAdmin,
    refresh,
    logout,
  };

  return <SmsAdminContext.Provider value={value}>{children}</SmsAdminContext.Provider>;
}

export function useSmsAdmin() {
  const ctx = useContext(SmsAdminContext);
  if (!ctx) throw new Error("useSmsAdmin must be used within SmsAdminProvider");
  return ctx;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <LogoIcon size={40} className="animate-pulse" />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    </div>
  );
}

/**
 * Gate for authenticated pages. Redirects unauthenticated visitors to
 * /admin/login. Optionally restricts to super_admin (superAdminOnly).
 */
export function RequireSmsAdmin({ children, superAdminOnly = false }) {
  const { admin, isLoading, isSuperAdmin } = useSmsAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      const from = encodeURIComponent(pathname || "/admin");
      router.replace(`/admin/login?from=${from}`);
    } else if (superAdminOnly && !isSuperAdmin) {
      router.replace("/admin/stores");
    }
  }, [admin, isLoading, isSuperAdmin, superAdminOnly, pathname, router]);

  if (isLoading || !admin || (superAdminOnly && !isSuperAdmin)) {
    return <FullScreenLoader />;
  }
  return children;
}
