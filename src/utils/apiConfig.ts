/**
 * ScrapSetu API Configuration & Multi-Environment Connector
 * Supports:
 * - Google Cloud Run full-stack container (Express)
 * - Cloudflare Pages & Cloudflare Workers (Edge Functions)
 * - Direct Client Browser Gemini Fallback (Pure Static CDN)
 * - Native Capacitor Android APKs
 */

// Live Cloud Run default backend URL
export const DEFAULT_PRODUCTION_BACKEND_URL =
  'https://ais-dev-vk6old7h2y6g6qk34fcw4x-189349264008.asia-southeast1.run.app';

const STORAGE_KEY_API_URL = 'scrapsetu_api_base_url';
const STORAGE_KEY_GEMINI_KEY = 'scrapsetu_gemini_api_key';

/**
 * Checks if running inside native mobile container (Capacitor / Cordova)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;
  if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') return true;
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
 * Returns user-saved or environment-configured Gemini API Key
 */
export function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  const saved = localStorage.getItem(STORAGE_KEY_GEMINI_KEY);
  if (saved && saved.trim()) return saved.trim();

  // Build-time injected key
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

/**
 * Stores or clears custom Gemini API Key in browser storage
 */
export function setStoredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key || !key.trim()) {
    localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
  }
}

/**
 * Returns true if a direct Gemini API key is available in browser
 */
export function hasDirectGeminiKey(): boolean {
  return Boolean(getStoredGeminiApiKey());
}

/**
 * Returns the effective API Base URL
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

  // 3. If running inside a Capacitor native APK, default to live Cloud Run backend
  if (isNativePlatform()) {
    return DEFAULT_PRODUCTION_BACKEND_URL;
  }

  // 4. Default for web browser: same origin (relative paths)
  return '';
}

/**
 * Sets a custom API Base URL
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
  isCloudflareOrEdge: boolean;
}> {
  const targetUrl = getApiUrl('/api/health');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Returned HTML (e.g. Cloudflare Pages SPA 404 fallback)
      return {
        ok: false,
        hasGeminiKey: hasDirectGeminiKey(),
        statusText: hasDirectGeminiKey()
          ? 'Static Host (Direct Gemini Active)'
          : 'Static Host (Needs Worker or Direct Key)',
        sourceUrl: targetUrl,
        isCloudflareOrEdge: false,
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        hasGeminiKey: hasDirectGeminiKey(),
        statusText: `Backend returned HTTP ${res.status}`,
        sourceUrl: targetUrl,
        isCloudflareOrEdge: false,
      };
    }

    const data = await res.json();
    const isEdge = Boolean(data.service?.includes('Cloudflare') || data.service?.includes('Edge'));
    const hasKey = Boolean(data.hasGeminiKey || hasDirectGeminiKey());

    return {
      ok: true,
      hasGeminiKey: hasKey,
      statusText: hasKey
        ? isEdge
          ? 'Cloudflare Edge AI Ready'
          : 'Server AI Ready'
        : 'Connected (Awaiting Gemini Key)',
      sourceUrl: targetUrl,
      isCloudflareOrEdge: isEdge,
    };
  } catch (err: any) {
    return {
      ok: false,
      hasGeminiKey: hasDirectGeminiKey(),
      statusText: hasDirectGeminiKey()
        ? 'Direct Gemini Active (Client)'
        : err?.name === 'AbortError'
        ? 'Connection Timed Out'
        : 'Offline / Static Hosting',
      sourceUrl: targetUrl,
      isCloudflareOrEdge: false,
    };
  }
}

/**
 * Validates a Gemini API Key directly by pinging Google Gemini REST API
 */
export async function testGeminiApiKey(candidateKey?: string): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
}> {
  const key = (candidateKey || getStoredGeminiApiKey()).trim();
  if (!key) {
    return {
      success: false,
      message: 'No API Key provided. Please paste your Gemini API key.',
    };
  }

  const start = performance.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with the single word: OK' }] }],
      }),
    });

    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 400 || res.status === 403) {
        return {
          success: false,
          message: 'Invalid API Key or unauthorized project access (HTTP ' + res.status + ')',
          latencyMs,
        };
      }
      if (res.status === 429) {
        return {
          success: false,
          message: 'Gemini rate limit exceeded (HTTP 429). Please retry shortly.',
          latencyMs,
        };
      }
      return {
        success: false,
        message: `Gemini API returned HTTP ${res.status}: ${errText.slice(0, 100)}`,
        latencyMs,
      };
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return {
      success: true,
      message: `Gemini API Connected Successfully (${latencyMs}ms)! Model reply: "${reply || 'OK'}"`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Gemini API: ${err?.message || err}`,
    };
  }
}
