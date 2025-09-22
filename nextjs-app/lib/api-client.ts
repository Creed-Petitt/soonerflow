import { auth } from './firebase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Convert /api/* URLs to direct backend calls
  const backendUrl = url.startsWith('/api/')
    ? `${BACKEND_URL}${url}`
    : url.startsWith('http')
    ? url
    : `${BACKEND_URL}/api${url}`

  const headers = await getAuthHeaders();

  const response = await fetch(backendUrl, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response
}

export async function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Firebase ID token if user is authenticated
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get Firebase ID token:', error);
  }

  return headers;
}