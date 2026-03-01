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
        return { ...retryErr?.response?.data };
      }
    }
    return { ...e?.response?.data };
  }
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
