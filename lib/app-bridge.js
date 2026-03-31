/**
 * App Bridge — postMessage protocol for iframe ↔ dashboard communication
 *
 * Shopify-style session token flow:
 * 1. Iframe loads with ?store_id=X&host=base64url(origin)&timestamp=T&hmac=H
 * 2. Iframe sends "app-bridge:ready" to parent
 * 3. Parent responds with "selorax:session-token" containing session_token
 * 4. Iframe stores in sessionStorage for API calls
 * 5. On token expiry, iframe sends "selorax:request-session-token" to parent
 * 6. For billing, iframe sends "selorax:billing-redirect" with URL to parent
 */

const STORAGE_KEY_TOKEN = "sx_session_token";
const STORAGE_KEY_STORE = "sx_app_store_id";
const STORAGE_KEY_HOST = "sx_host_origin";

/**
 * Get store_id from URL params
 */
export function getStoreIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get("store_id");
  if (storeId) {
    sessionStorage.setItem(STORAGE_KEY_STORE, storeId);
    return storeId;
  }
  return sessionStorage.getItem(STORAGE_KEY_STORE) || null;
}

/**
 * Get parent dashboard origin from URL params (base64url encoded)
 */
export function getHostOrigin() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const host = params.get("host");
  if (host) {
    try {
      const normalized = host.replace(/-/g, "+").replace(/_/g, "/");
      const origin = atob(normalized);
      // Persist so it survives internal navigation (e.g., / → /dashboard redirect)
      sessionStorage.setItem(STORAGE_KEY_HOST, origin);
      return origin;
    } catch {
      return null;
    }
  }
  // Fallback: read from sessionStorage (after redirect loses URL params)
  return sessionStorage.getItem(STORAGE_KEY_HOST) || null;
}

/**
 * Send "app-bridge:ready" to parent window
 */
export function sendReady() {
  const hostOrigin = getHostOrigin();
  if (!hostOrigin || !window.parent || window.parent === window) return;

  window.parent.postMessage({ type: "app-bridge:ready" }, hostOrigin);
}

/**
 * Listen for "selorax:session-token" from parent and store credentials
 * @returns {Promise<{token: string, store_id: string}>}
 */
export function waitForToken() {
  return new Promise((resolve) => {
    const hostOrigin = getHostOrigin();

    const handler = (event) => {
      if (hostOrigin && event.origin !== hostOrigin) return;
      if (event.data?.type !== "selorax:session-token") return;

      const { token } = event.data;
      const store_id = getStoreIdFromUrl() || "";

      if (token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
        sessionStorage.setItem(STORAGE_KEY_STORE, store_id);
      }

      window.removeEventListener("message", handler);
      resolve({ token, store_id });
    };

    window.addEventListener("message", handler);
  });
}

/**
 * Request a fresh session token from the parent dashboard.
 * Useful when the current token is expired (60s TTL).
 * @returns {Promise<string>} new session token
 */
export function requestSessionToken() {
  return new Promise((resolve, reject) => {
    const hostOrigin = getHostOrigin();
    if (!hostOrigin || !window.parent || window.parent === window) {
      return reject(new Error("Not in iframe"));
    }

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Session token request timed out"));
    }, 10000);

    const handler = (event) => {
      if (hostOrigin && event.origin !== hostOrigin) return;
      if (event.data?.type !== "selorax:session-token") return;

      clearTimeout(timeout);
      window.removeEventListener("message", handler);

      const { token } = event.data;
      if (token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
        resolve(token);
      } else {
        reject(new Error("No token received"));
      }
    };

    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "selorax:request-session-token" }, hostOrigin);
  });
}

/**
 * Send a billing redirect request to the parent dashboard.
 * The dashboard will navigate to the charge approval page.
 * @param {string} url - The confirmation_url from the platform
 */
export function sendBillingRedirect(url) {
  const hostOrigin = getHostOrigin();
  if (!hostOrigin || !window.parent || window.parent === window) return;

  window.parent.postMessage(
    { type: "selorax:billing-redirect", url },
    hostOrigin
  );
}

/**
 * Get stored session token from sessionStorage
 */
export function getToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(STORAGE_KEY_TOKEN) || "";
}

/**
 * Get stored store_id from sessionStorage
 */
export function getStoreId() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(STORAGE_KEY_STORE) || "";
}

/**
 * Check if we already have credentials (e.g. from internal navigation)
 */
export function hasCredentials() {
  return !!(getToken() && getStoreId());
}
