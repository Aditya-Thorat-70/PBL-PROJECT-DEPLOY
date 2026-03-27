const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return trimTrailingSlash(origin);
    }
  }

  return "http://localhost:5000";
};

const resolveSocketUrl = (apiBaseUrl) => {
  const configured = (import.meta.env.VITE_SOCKET_URL || "").trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  return apiBaseUrl;
};

export const API_BASE_URL = resolveApiBaseUrl();
export const SOCKET_URL = resolveSocketUrl(API_BASE_URL);
