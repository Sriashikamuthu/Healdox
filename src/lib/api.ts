export const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = authHeaders(init.headers);
  const body = init.body;

  if (
    body &&
    typeof body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, { ...init, headers });
  return response;
}

export function installApiFetchPatch() {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.startsWith("http://localhost:5000")) {
      url = `${API_BASE}${url.slice("http://localhost:5000".length)}`;
    }

    const headers = authHeaders(
      init?.headers ||
        (typeof input !== "string" && !(input instanceof URL)
          ? input.headers
          : undefined)
    );

    if (typeof input === "string" || input instanceof URL) {
      return nativeFetch(url, { ...init, headers });
    }

    return nativeFetch(url, { ...init, headers });
  };
}
