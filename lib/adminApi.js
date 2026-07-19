/**
 * Admin-panel API client. Cookie-based (credentials: "include") — mirrors the
 * SeloraX super-admin transport. Completely separate from lib/api.js (which uses
 * the embedded app's session-token). No token is ever stored client-side.
 *
 * The admin base is derived from the same env var the messaging client uses, so
 * deploying the panel needs no extra Vercel env: .../api/messaging -> .../api/admin
 */
const MESSAGING_URL =
  process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:5002/api/messaging";

export const ADMIN_URL = MESSAGING_URL.replace(/\/api\/messaging\/?$/, "/api/admin");

async function req(method, path, body) {
  let res;
  try {
    res = await fetch(`${ADMIN_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const err = new Error("Cannot reach the server. Check your connection.");
    err.code = "network_error";
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export const adminGet = (path) => req("GET", path);
export const adminPost = (path, body) => req("POST", path, body);
export const adminPatch = (path, body) => req("PATCH", path, body);
export const adminDelete = (path) => req("DELETE", path);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const adminRequestOtp = (phone) => adminPost("/auth/login", { phone });
export const adminForgotPassword = (phone) => adminPost("/auth/forgot-password", { phone });
export const adminLoginWithPassword = (phone, password) => adminPost("/auth/login-with-password", { phone, password });
export const adminSetPassword = (password) => adminPost("/auth/set-password", { password });
export const adminVerifyOtp = (phone, otp) => adminPost("/auth/verify-otp", { phone, otp });
export const adminMe = () => adminGet("/auth/me");
export const adminLogout = () => adminPost("/auth/logout");
