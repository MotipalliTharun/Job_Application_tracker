/**
 * API Utility Functions
 * 
 * In production (Vercel): Uses relative paths /api/applications
 * In development: Uses Vite proxy to localhost:4000 (configured in vite.config.ts)
 */

// Use environment variable if set, otherwise use relative path for production
// Vite proxy handles /api in development, Vercel handles it in production
const API_BASE = import.meta.env.VITE_API_URL || '/api/applications';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  console.log('[API] Request:', options?.method || 'GET', url);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  console.log('[API] Response:', response.status, response.statusText);

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('[API ERROR] Error response:', errorData);
      } catch (e) {
        // Ignore JSON parse errors
        console.error('[API ERROR] Failed to parse error response');
      }
    } else {
      const text = await response.text();
      console.error('[API ERROR] Non-JSON error response:', text.substring(0, 200));
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    console.log('[API SUCCESS] Response data:', Array.isArray(data) ? `${data.length} items` : 'object');
    return data;
  }
  
  const text = await response.text();
  return text as T;
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: any) => 
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

