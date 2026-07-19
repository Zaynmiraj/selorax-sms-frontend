"use client";
import { SmsAdminProvider } from "@/contexts/SmsAdminContext";

// Root of the /admin section. Provides the admin auth context to both the public
// login page and the protected panel. Renders raw (no store AppShell / AppBridge)
// because the root app/layout.js excludes /admin from the embedded-app chrome.
export default function AdminRootLayout({ children }) {
  return <SmsAdminProvider>{children}</SmsAdminProvider>;
}
