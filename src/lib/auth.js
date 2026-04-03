export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

export function getAuthHeaders(headers = {}) {
  const token = getToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
}