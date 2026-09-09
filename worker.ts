import { executeGeminiVisionRest } from './src/utils/geminiCore';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Health check endpoint
    if (url.pathname === '/api/health') {
      const hasKey = Boolean(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
      return new Response(
        JSON.stringify({
          status: 'ok',
          hasGeminiKey: hasKey,
          service: 'ScrapSetu Cloudflare Worker',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Classification endpoint
    if (url.pathname === '/api/classify' && request.method === 'POST') {
      const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      };

      try {
        const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: 'GEMINI_API_KEY is not configured in Cloudflare environment',
              hint: 'Run: npx wrangler secret put GEMINI_API_KEY or set in Cloudflare Dashboard',
            }),
            { status: 500, headers: corsHeaders }
          );
        }

        const body = (await request.json()) as any;
        const { image = '', language = 'hi' } = body || {};

        if (!image || typeof image !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Missing or invalid "image" in request body' }),
            { status: 400, headers: corsHeaders }
          );
        }

        let base64Data = '';
        let mimeType = 'image/jpeg';

        if (image.startsWith('data:')) {
          const matches = image.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            const parts = image.split(',');
            base64Data = parts[1] || parts[0];
          }
        } else if (image.startsWith('http://') || image.startsWith('https://')) {
          const imgRes = await fetch(image);
          const arrayBuffer = await imgRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          base64Data = btoa(binary);
          mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        }

        if (!base64Data) {
          return new Response(
            JSON.stringify({ error: 'Could not extract base64 image data' }),
            { status: 400, headers: corsHeaders }
          );
        }

        const result = await executeGeminiVisionRest(base64Data, mimeType, apiKey, language);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            error: err?.message || 'Cloudflare Worker classification error',
            fallback: true,
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Pass through all other requests to static assets in ./dist
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
