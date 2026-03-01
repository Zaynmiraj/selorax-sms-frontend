"use client";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppBridgeProvider } from "../contexts/AppBridgeContext";
import MessagingTabNav from "../components/MessagingTabNav";
import { useState } from "react";

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <AppBridgeProvider>
            <div className="p-6 max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-2">Messaging</h1>
              <p className="text-gray-500 mb-4 text-sm">
                SMS notifications for your store
              </p>
              <MessagingTabNav />
              <div>{children}</div>
            </div>
          </AppBridgeProvider>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
