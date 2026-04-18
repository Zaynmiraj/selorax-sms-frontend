import axios from "axios";
import { getToken, requestSessionToken } from "./app-bridge";

const MESSAGING_URL = () =>
  process.env.NEXT_PUBLIC_MESSAGING_API_URL || "http://localhost:5002/api/messaging";

const headers = () => ({
  "Content-Type": "application/json",
  "X-Session-Token": getToken(),
});

/**
 * Handle 401 responses by requesting a fresh session token and retrying once.
 */
async function handleResponse(requestFn) {
  try {
    const res = await requestFn();
    return res.data;
  } catch (e) {
    // If 401, try refreshing the session token and retry once
    if (e?.response?.status === 401) {
      try {
        await requestSessionToken();
        const res = await requestFn();
        return res.data;
      } catch (retryErr) {
        return toErrorShape(retryErr);
      }
    }
    return toErrorShape(e);
  }
}

/**
 * Normalise any caught error into a structured shape. Previously the catch
 * returned `{...err.response.data}`, which became `{}` when the error had no
 * response body (e.g. "Not in iframe" from requestSessionToken), silently
 * swallowing failures and leaving callers with nothing to inspect.
 */
function toErrorShape(err) {
  if (err?.response?.data && typeof err.response.data === "object") {
    return { ...err.response.data };
  }
  return {
    status: err?.response?.status || 0,
    message: err?.message || "Request failed",
  };
}

export const msgGet = async (path, params = {}) => {
  let url = `${MESSAGING_URL()}${path}`;
  if (Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }
  return handleResponse(() => axios.get(url, { headers: headers() }));
};

export const msgPost = async (path, payload = {}) =>
  handleResponse(() =>
    axios.post(`${MESSAGING_URL()}${path}`, payload, { headers: headers() })
  );

export const msgPut = async (path, payload = {}) =>
  handleResponse(() =>
    axios.put(`${MESSAGING_URL()}${path}`, payload, { headers: headers() })
  );

export const msgDelete = async (path) =>
  handleResponse(() =>
    axios.delete(`${MESSAGING_URL()}${path}`, { headers: headers() })
  );
