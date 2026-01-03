/**
 * Get JWT token for WebSocket authentication
 * Since the auth token is httpOnly, we need to fetch it from the API
 */
export async function getTokenForSocket(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/socket-token', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error fetching socket token:', error);
    return null;
  }
}

/**
 * Get JWT token from cookies (client-side) - DEPRECATED
 * Note: This won't work with httpOnly cookies
 */
export function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
}

/**
 * Parse JWT token to get user info (client-side only, for non-sensitive data)
 */
export function parseJWTToken(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}