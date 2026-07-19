"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { LogoIcon } from "../../../components/Logo";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useSmsAdmin } from "../../../contexts/SmsAdminContext";
import { adminRequestOtp, adminVerifyOtp } from "../../../lib/adminApi";

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/stores";
  const { isAuthenticated, isLoading, refresh } = useSmsAdmin();

  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Already logged in → bounce to the panel.
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(from);
  }, [isLoading, isAuthenticated, from, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) return toast.error("Enter your phone number.");
    setBusy(true);
    try {
      await adminRequestOtp(phone.trim());
      setStep("otp");
      setCountdown(60);
      toast.success("OTP sent to your phone.");
    } catch (err) {
      toast.error(err.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 4) return toast.error("Enter the 4-digit code.");
    setBusy(true);
    try {
      await adminVerifyOtp(phone.trim(), otp);
      await refresh(); // populate context from the freshly-set cookie
      toast.success("Welcome back.");
      router.replace(from);
    } catch (err) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoIcon size={44} />
          <h1
            className="mt-3 text-xl font-semibold text-gray-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            SMS Admin
          </h1>
          <p className="text-sm text-gray-400">Sign in to manage the SMS app</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm shadow-gray-200/50">
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Phone number</label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                  Enter the code sent to {phone}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={4}
                  placeholder="0000"
                  className="text-center text-lg tracking-[0.5em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Verifying…" : "Verify & sign in"}
              </Button>
              <div className="flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  disabled={countdown > 0 || busy}
                  onClick={sendOtp}
                  className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
