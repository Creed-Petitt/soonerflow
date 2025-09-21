const BACKEND_URL = 'http://127.0.0.1:8000'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Convert /api/* URLs to direct backend calls
  const backendUrl = url.startsWith('/api/')
    ? `${BACKEND_URL}${url}`
    : url.startsWith('http')
    ? url
    : `${BACKEND_URL}/api${url}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(backendUrl, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response
}

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}