// Use NEXT_PUBLIC_API_URL for all requests.
// In development, this is usually http://localhost:3001
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const apiCall = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = localStorage.getItem("token");

  // If the url is absolute, keep it. Otherwise prepend API_URL.
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
