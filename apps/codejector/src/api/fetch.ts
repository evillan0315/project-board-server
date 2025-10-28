import { getToken } from '@/stores/authStore'; // Import getToken from authStore

export const API_BASE_URL = `/api`;

export interface ApiError extends Error {
  statusCode?: number;
  message: string;
}

// Augment RequestInit to allow a 'data' field for JSON bodies
interface CustomRequestInit extends RequestInit {
  data?: object; // Custom field to hold JSON body object, which will be stringified
}

// Handles the response from a fetch call, checks for errors, and parses JSON or text.
export const handleResponse = async <T>(response: Response): Promise<T> => {
  // Read the response body once as text to prevent 'Body has already been consumed' errors
  const responseBody = await response.text();

  if (!response.ok) {
    let errorData: any;
    try {
      // Attempt to parse the already-read text as JSON for error details
      errorData = responseBody ? JSON.parse(responseBody) : {};
    } catch (e) {
      // If JSON parsing fails (e.g., empty body or malformed JSON), use the raw text
      errorData = responseBody;
    }

    const errorMessage =
      typeof errorData === 'string'
        ? errorData
        : errorData.message ||
          `API error: ${response.status} ${response.statusText}`;

    const error = new Error(errorMessage);
    error.statusCode = response.status;
    throw error;
  }

  // For OK responses, if there's a body and it's JSON, parse it
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      // Parse the already-read text as JSON
      const data = responseBody ? JSON.parse(responseBody) : {};
      return data as T;
    } catch (error) {
      console.error('Error parsing JSON for successful request:', error);
      throw new Error(
        'Failed to parse JSON response for a successful request.',
      );
    }
  } else {
    // If not JSON, return the raw text
    return responseBody as T;
  }
};

// Generic fetch wrapper with token for authenticated requests
export async function fetchWithAuth(
  url: string,
  options?: CustomRequestInit,
): Promise<Response> {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  let body = options?.body;
  if (options?.data && options.method !== 'GET' && options.method !== 'HEAD') {
    body = JSON.stringify(options.data);
  }

  return fetch(url, { ...options, headers, body });
}

// Generic fetch wrapper with API Key for authenticated requests to SLS API
export async function fetchWithToken(
  input: RequestInfo | URL,
  init?: CustomRequestInit,
): Promise<Response> {
  const token = `${import.meta.env.VITE_SLS_API_KEY}`;
  // Safely append token to the URL, handling existing query parameters
  const url = `${input}${String(input).includes('?') ? '&' : '?'}token=${token}`;
  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  let body = init?.body;
  if (init?.data && init.method !== 'GET' && init.method !== 'HEAD') {
    body = JSON.stringify(init.data);
  }

  return fetch(url, {
    ...init,
    headers,
    body,
  });
}

// Fetch wrapper with Basic Auth for OpenVidu server
export async function fetchWithBasicAuth(
  input: RequestInfo | URL,
  init?: CustomRequestInit,
): Promise<Response> {
  const OPENVIDU_SERVER_SECRET = import.meta.env.VITE_SLS_API_KEY;
  const OPENVIDU_SERVER_USERNAME =
    import.meta.env.VITE_SLS_USERNAME || 'OPENVIDUAPP'; // Default OpenVidu username

  if (!OPENVIDU_SERVER_SECRET) {
    throw new Error(
      'VITE_SLS_API_KEY is not defined in environment variables.',
    );
  }

  const basicAuth = btoa(
    `${OPENVIDU_SERVER_USERNAME}:${OPENVIDU_SERVER_SECRET}`,
  );
  const headers = {
    Authorization: `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    ...init?.headers,
  };

  let body = init?.body;
  if (init?.data && init.method !== 'GET' && init.method !== 'HEAD') {
    body = JSON.stringify(init.data);
  }

  return fetch(input, {
    ...init,
    headers,
    body,
  });
}
