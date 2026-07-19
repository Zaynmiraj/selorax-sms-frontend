"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { LogoIcon } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSmsAdmin } from "@/contexts/SmsAdminContext";
import { adminRequestOtp, adminVerifyOtp, adminForgotPassword, adminLoginWithPassword, adminSetPassword } from "@/lib/adminApi";

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/stores";
  const { admin, isAuthenticated, isLoading, refresh } = useSmsAdmin();

  const [step, setStep] = useState("phone"); // 'phone' | 'password' | 'otp' | 'set_password'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Already logged in → bounce to the panel, unless they need to set a password.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (admin && admin.has_password === false) {
        setStep("set_password");
      } else if (step !== "set_password") {
        router.replace(from);
      }
    }
  }, [isLoading, isAuthenticated, admin, from, router, step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const checkPhone = async (e) => {
    e?.preventDefault();
    if (!phone.trim()) return toast.error("Enter your phone number.");
    setBusy(true);
    try {
      const res = await adminRequestOtp(phone.trim());
      if (res.step === 'password') {
        setStep("password");
        setPassword("");
      } else {
        setStep("otp");
        setOtp("");
        setCountdown(60);
        toast.success("OTP sent to your phone.");
      }
    } catch (err) {
      toast.error(err.message || "Could not proceed.");
    } finally {
      setBusy(false);
    }
  };

  const requestForgotPassword = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    try {
      await adminForgotPassword(phone.trim());
      setStep("otp");
      setOtp("");
      setCountdown(60);
      toast.success("OTP sent to your phone.");
    } catch (err) {
      toast.error(err.message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const loginWithPassword = async (e) => {
    e?.preventDefault();
    if (!password) return toast.error("Enter your password.");
    setBusy(true);
    try {
      await adminLoginWithPassword(phone.trim(), password);
      await refresh();
      toast.success("Welcome back.");
      router.replace(from);
    } catch (err) {
      toast.error(err.message || "Invalid password.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e?.preventDefault();
    if (otp.length !== 4) return toast.error("Enter the 4-digit code.");
    setBusy(true);
    try {
      const res = await adminVerifyOtp(phone.trim(), otp);
      await refresh(); 
      if (res.admin && !res.admin.has_password) {
        setStep("set_password");
        setPassword("");
      } else {
        toast.success("Welcome back.");
        router.replace(from);
      }
    } catch (err) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setBusy(false);
    }
  };

  const setupPassword = async (e) => {
    e?.preventDefault();
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await adminSetPassword(password);
      await refresh();
      toast.success("Password set successfully. Welcome.");
      router.replace(from);
    } catch (err) {
      toast.error(err.message || "Could not set password.");
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
          {step === "phone" && (
            <form onSubmit={checkPhone} className="space-y-4">
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
                {busy ? "Proceeding…" : "Continue"}
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={loginWithPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  autoFocus
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <div className="flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setPassword(""); }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={requestForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          {step === "otp" && (
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
                {busy ? "Verifying…" : "Verify code"}
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
                  onClick={requestForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {step === "set_password" && (
            <form onSubmit={setupPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Set a Password</label>
                <p className="mb-3 text-[13px] text-gray-500">
                  Please set a password for your future logins.
                </p>
                <Input
                  type="password"
                  autoFocus
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Saving…" : "Save Password & Continue"}
              </Button>
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
