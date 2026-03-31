"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  hasCredentials,
  sendReady,
  waitForToken,
  getToken,
  getStoreId,
  requestSessionToken,
} from "../lib/app-bridge";

const AppBridgeContext = createContext({
  ready: false,
  token: "",
  storeId: "",
  refreshToken: async () => "",
});

export function AppBridgeProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [storeId, setStoreId] = useState("");

  /**
   * Request a fresh session token from the parent dashboard.
   * Session tokens expire after 60 seconds.
   */
  const refreshToken = useCallback(async () => {
    try {
      const newToken = await requestSessionToken();
      setToken(newToken);
      return newToken;
    } catch (err) {
      console.error("[AppBridge] Failed to refresh session token:", err.message);
      return "";
    }
  }, []);

  useEffect(() => {
    // Dev bypass: skip handshake when running standalone (not in iframe)
    const isStandalone = typeof window !== "undefined" && window.self === window.top;
    if (isStandalone && !hasCredentials()) {
      setToken("dev_bypass");
      setStoreId("2");
      setReady(true);
      return;
    }

    // Already have credentials from a previous page navigation within the iframe
    if (hasCredentials()) {
      setToken(getToken());
      setStoreId(getStoreId());
      setReady(true);
      return;
    }

    // Initiate postMessage handshake with parent dashboard
    sendReady();
    waitForToken().then(({ token: t, store_id: s }) => {
      setToken(t);
      setStoreId(s);
      setReady(true);
    });
  }, []);

  // Auto-refresh token before expiry (refresh every 9 minutes for 10min TTL)
  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 540000);

    return () => clearInterval(interval);
  }, [ready, refreshToken]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <AppBridgeContext.Provider value={{ ready, token, storeId, refreshToken }}>
      {children}
    </AppBridgeContext.Provider>
  );
}

export function useAppBridge() {
  return useContext(AppBridgeContext);
}
