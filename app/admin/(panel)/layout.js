"use client";
import { RequireSmsAdmin } from "../../../contexts/SmsAdminContext";
import AdminSidebar from "../../../components/admin/AdminSidebar";

// Protected shell for the admin panel. Everything under app/admin/(panel)/ is
// gated by RequireSmsAdmin (redirects to /admin/login when not authenticated).
export default function PanelLayout({ children }) {
  return (
    <RequireSmsAdmin>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 px-5 py-6 sm:px-7 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </RequireSmsAdmin>
  );
}
