/**
 * API Client utilities for making authenticated requests to the backend
 * Uses API Key authentication for simplicity and security
 */

// Get the API key from environment variable
const API_KEY = process.env.NEXT_PUBLIC_API_KEY

// Debug logging
console.log('API Key being used:', API_KEY)

/**
 * Make an authenticated fetch request to the backend API
 * Automatically adds the X-API-Key header
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Add the API key header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'X-API-Key': API_KEY,
  }
  
  console.log('Fetching with headers:', headers)
  
  // Make the request with the API key
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
 * Helper to get auth headers for fetch requests
 * Use this when you need to manually construct fetch calls
 */
export function getAuthHeaders() {
  return {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  }
}