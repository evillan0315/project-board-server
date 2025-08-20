const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  const { params, headers, body, ...rest } = options || {};

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(params).toString();
    url = `${url}?${query}`;
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Add authorization header if needed (e.g., from a token store)
    // 'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, {
    headers: { ...defaultHeaders, ...headers },
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'API request failed');
  }

  // Handle cases where no content is expected (e.g., 204 No Content)
  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
