"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBridgeProvider } from "../contexts/AppBridgeContext";
import MessagingTabNav from "../components/MessagingTabNav";
import { LogoFull } from "../components/Logo";

function AppShell({ children }) {
  return (
    <div className="px-6 py-5 max-w-6xl mx-auto">
      <LogoFull size={36} />
      <div className="mt-4 mb-2">
        <MessagingTabNav />
      </div>
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
