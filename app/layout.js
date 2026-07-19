"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppBridgeProvider } from "../contexts/AppBridgeContext";
import MessagingSidebar from "../components/MessagingSidebar";
import { LogoIcon } from "../components/Logo";
import { msgGet } from "../lib/api";
import {
  addPendingTopupCharge,
  clearPendingTopupCharge,
  getPendingTopupCharges,
  isCreditedChargeStatus,
  isTerminalFailedChargeStatus,
  normalizePaymentStatus,
} from "../lib/payment-return-state.mjs";

function PaymentReturnHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [handledKey, setHandledKey] = useState(null);

  useEffect(() => {
    const paymentStatus = normalizePaymentStatus(
      searchParams.get("payment") || searchParams.get("status")
    );
    // Accept either name — backend EPS callback may emit charge_id (numeric
    // platform ID) or tran_id (merchant_transaction_id). The verify endpoint
    // accepts both via the same path param.
    const chargeId =
      searchParams.get("charge_id") ||
      searchParams.get("chargeId") ||
      searchParams.get("tran_id") ||
      searchParams.get("tranId");
    const pendingChargeIds = getPendingTopupCharges();
    const chargeIds = [...new Set([chargeId, ...pendingChargeIds].filter(Boolean).map(String))];

    if (paymentStatus === "success" && chargeId) {
      addPendingTopupCharge(chargeId);
    }

    if (chargeIds.length === 0) return;

    const currentKey = `${paymentStatus || "pending"}:${chargeIds.join(",")}:${pathname}`;
    if (handledKey === currentKey) return;
    setHandledKey(currentKey);

    const finalizeReturn = async () => {
      const shouldPoll = paymentStatus === "success";
      const maxAttempts = shouldPoll ? 6 : 1;
      let credited = false;

      for (const id of chargeIds) {
        // Poll verify up to 6 times (every 5s, ~30s total) because the
        // EPS → platform charge-status propagation can lag behind the redirect.
        // Each verify call also triggers the backend's `creditPurchase` flow
        // once the charge flips to active, so polling here is what actually
        // credits the store's balance when there is a delay.
        const DELAY_MS = 5000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const res = await msgGet(`/payment/verify/${id}`);
          const s = res?.data?.status;

          if (isCreditedChargeStatus(s)) {
            credited = true;
            clearPendingTopupCharge(id);
            break;
          }
          if (isTerminalFailedChargeStatus(s) || paymentStatus === "failed" || paymentStatus === "cancelled") {
            clearPendingTopupCharge(id);
            break;
          }
          if (attempt < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, DELAY_MS));
          }
        }
      }

      if (credited) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] }),
          queryClient.invalidateQueries({ queryKey: ["messaging-purchases"] }),
          queryClient.invalidateQueries({ queryKey: ["messaging-stats"] }),
          queryClient.invalidateQueries({ queryKey: ["messaging-logs-recent"] }),
          queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] }),
        ]);
      }

      // Don't strip the query params on the dedicated /billing/callback page —
      // that page renders its UI based on `?payment=` and would flip to the
      // "Payment Cancelled" state if we remove them here.
      if (paymentStatus && pathname !== "/billing/callback") {
        router.replace(pathname);
      }
    };

    finalizeReturn();
  }, [handledKey, pathname, queryClient, router, searchParams]);

  return null;
}

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MessagingSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile-only top bar (sidebar hidden below md) */}
        <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 md:hidden">
          <LogoIcon size={32} />
          <div>
            <h1
              className="text-sm font-bold leading-tight tracking-tight text-gray-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Messaging
            </h1>
            <p className="text-[10px] leading-tight text-gray-500">by SeloraX</p>
          </div>
        </header>

        <PaymentReturnHandler />
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

/**
 * Detect if we're inside an iframe (opened from SeloraX dashboard).
 * If on "/" inside iframe, redirect to /dashboard immediately.
 */
function IframeRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/" && typeof window !== "undefined" && window.self !== window.top) {
      const search = window.location.search || "";
      router.replace(`/dashboard${search}`);
    }
  }, [pathname, router]);

  return null;
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [isIframe, setIsIframe] = useState(false);
  const isLanding = pathname === "/";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
    }
  }, []);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  // The /admin panel is a standalone owner surface with its own auth + chrome
  // (app/admin/layout.js). It must NOT get the embedded store app's AppBridge or
  // AppShell — and it is never loaded inside the dashboard iframe. Exclude it here.
  const isAdmin = pathname?.startsWith("/admin");

  // If in iframe: ALWAYS wrap with AppBridgeProvider (even on "/")
  // If standalone: only wrap non-landing pages
  const needsAuth = !isAdmin && (!isLanding || isIframe);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {needsAuth ? (
            <AppBridgeProvider>
              <IframeRedirect />
              {isLanding ? null : <AppShell>{children}</AppShell>}
            </AppBridgeProvider>
          ) : (
            children
          )}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500 },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
