/**
 * ScrapSetu API Configuration
 * Supports web browsers, production deployed URLs, and native Capacitor Android APKs.
 */

// Deployed Cloud Run default backend URL
export const DEFAULT_PRODUCTION_BACKEND_URL =
  'https://ais-dev-ded3ietedqlo5xtxlyzlxo-189349264008.asia-southeast1.run.app';

const STORAGE_KEY_API_URL = 'scrapsetu_api_base_url';

/**
 * Checks if the application is running inside a native mobile container (Capacitor / Cordova)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  // Capacitor Android WebView schemes
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') return true;
  // Android WebView default localhost without standard port
  if (
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    !window.location.port &&
    window.location.protocol === 'https:'
  ) {
    return true;
  }
  return false;
}

/**
 * Returns the effective API Base URL (empty string for same-origin web, or https://... for native APK / remote backend)
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. User manual override in localStorage
  const savedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim().replace(/\/+$/, '');
  }

  // 2. Vite Environment variable (e.g. VITE_BACKEND_URL or VITE_API_URL)
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. If running inside a Capacitor native APK, default to the live Cloud Run backend
  if (isNativePlatform()) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  // 4. Default for web browser: same origin (relative paths)
  return '';
}

/**
 * Sets a custom API Base URL (e.g. for testing APK against local dev or custom backend)
 */
export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(STORAGE_KEY_API_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_API_URL, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Resolves a full API URL given a relative path like '/api/classify'
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return cleanPath;
  return `${base}${cleanPath}`;
}

/**
 * Checks backend health and Gemini API key status
 */
export async function checkBackendHealth(): Promise<{
  ok: boolean;
  hasGeminiKey: boolean;
  statusText: string;
  sourceUrl: string;
}> {
  const targetUrl = getApiUrl('/api/health');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        ok: false,
        hasGeminiKey: false,
        statusText: `Server responded with HTTP ${res.status}`,
        sourceUrl: targetUrl,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      hasGeminiKey: Boolean(data.hasGeminiKey),
      statusText: data.hasGeminiKey ? 'Gemini AI Vision Active' : 'Connected (No Gemini Key)',
      sourceUrl: targetUrl,
    };
  } catch (err: any) {
    return {
      ok: false,
      hasGeminiKey: false,
      statusText: err?.name === 'AbortError' ? 'Connection Timed Out' : 'Network/CORS Error',
      sourceUrl: targetUrl,
    };
  }
}
