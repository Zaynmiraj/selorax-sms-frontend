import { NextResponse } from "next/server";

/**
 * Proxy for SeloraX dashboard extension actions.
 *
 * The platform resolves an extension's relative action_url against the app's
 * registered app_url, which is this frontend — so the platform calls
 * `<app_url>/api/messaging/extensions/<action>`. The handlers themselves live on
 * the messaging backend, so this forwards the call there and returns the
 * directive body ({ update_state, show_toast, ... }) untouched.
 *
 * Auth: the platform signs the request as `Authorization: Bearer <session_token>`,
 * but the backend's auth middleware reads `X-Session-Token`. Map between them here.
 */

const ALLOWED_ACTIONS = new Set(["widget-data", "quick-send", "order-sms"]);

const API_BASE =
  process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:5002/api/messaging";

export async function POST(request, { params }) {
  const { action } = params;

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ message: "Unknown extension action." }, { status: 404 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Platform sends an empty body for loaders with no params.
  }

  const bearer = request.headers.get("authorization") || "";
  const sessionToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";

  const headers = { "Content-Type": "application/json" };
  if (sessionToken) headers["X-Session-Token"] = sessionToken;

  const storeId = request.headers.get("x-selorax-store-id");
  if (storeId) headers["X-Store-Id"] = storeId;

  try {
    const res = await fetch(`${API_BASE}/extensions/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { message: `Messaging backend unreachable: ${err.message}` },
      { status: 502 }
    );
  }
}
