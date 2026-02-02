// In the browser we prefer same-origin requests (Next rewrites/proxy handle routing).
// Keeping this empty ensures `${API_URL}${path}` stays as a relative path.
export const API_URL = "";

export const apiCall = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = localStorage.getItem("token");

  // If the url is absolute, keep it. Otherwise use same-origin.
  const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;

  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  }

  return response;
};
