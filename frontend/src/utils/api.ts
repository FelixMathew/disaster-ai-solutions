/**
 * Returns the backend base URL.
 * - In development: empty string (Vite proxy handles /api/* → localhost:8000)
 * - In production (Railway/Vercel): reads VITE_API_URL env variable
 *   Set VITE_API_URL=https://your-app.up.railway.app in your .env.production
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? "";

/**
 * Build a full API path.
 * Usage: apiUrl("/api/login") → "https://your-app.up.railway.app/api/login"
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
