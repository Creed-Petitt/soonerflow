export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Headers for the request (API key is added server-side)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Make the request (authentication handled by proxy)
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // Handle auth errors
  if (response.status === 401) {
    throw new Error('Authentication required - invalid API key')
  }
  
  if (response.status === 403) {
    throw new Error('Access denied')
  }
  
  return response
}

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}