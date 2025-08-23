/**
 * API Client utilities for making authenticated requests to the backend
 * Uses API Key authentication for simplicity and security
 */

// API key is now handled server-side in the proxy for security

/**
 * Make a fetch request to the backend API via the NextJS proxy
 * Authentication is handled server-side for security
 */
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

/**
 * Helper to get headers for fetch requests
 * Authentication is now handled server-side
 */
export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  }
}