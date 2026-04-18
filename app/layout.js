"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppBridgeProvider } from "../contexts/AppBridgeContext";
import MessagingTabNav from "../components/MessagingTabNav";
import { LogoFull } from "../components/Logo";
import { msgGet } from "../lib/api";

function PaymentReturnHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [handledKey, setHandledKey] = useState(null);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const chargeId = searchParams.get("charge_id");

    if (!paymentStatus || !chargeId) return;

    const currentKey = `${paymentStatus}:${chargeId}:${pathname}`;
    if (handledKey === currentKey) return;
    setHandledKey(currentKey);

    const finalizeReturn = async () => {
      if (paymentStatus === "success") {
        // Poll verify up to 6 times (every 5s, ~30s total) because the
        // EPS → platform charge-status propagation can lag behind the redirect.
        // Each verify call also triggers the backend's `creditPurchase` flow
        // once the charge flips to active, so polling here is what actually
        // credits the store's balance when there is a delay.
        const MAX_ATTEMPTS = 6;
        const DELAY_MS = 5000;
        let credited = false;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const res = await msgGet(`/payment/verify/${chargeId}`);
          const s = res?.data?.status;

          if (s === "active" || s === "completed") {
            credited = true;
            break;
          }
          if (s === "declined" || s === "cancelled" || s === "expired") {
            break;
          }
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, DELAY_MS));
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
      }

      // Don't strip the query params on the dedicated /billing/callback page —
      // that page renders its UI based on `?payment=` and would flip to the
      // "Payment Cancelled" state if we remove them here.
      if (pathname !== "/billing/callback") {
        router.replace(pathname);
      }
    };

    finalizeReturn();
  }, [handledKey, pathname, queryClient, router, searchParams]);

  return null;
}

function AppShell({ children }) {
  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      <LogoFull size={36} />
      <div className="mt-4 mb-2">
        <MessagingTabNav />
      </div>
      <PaymentReturnHandler />
      <main>{children}</main>
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

  // If in iframe: ALWAYS wrap with AppBridgeProvider (even on "/")
  // If standalone: only wrap non-landing pages
  const needsAuth = !isLanding || isIframe;

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
