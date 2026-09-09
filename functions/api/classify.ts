import { executeGeminiVisionRest } from '../../src/utils/geminiCore';

interface Env {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const apiKey = context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Cloudflare Pages environment variables',
          hint: 'Go to Cloudflare Dashboard -> Workers & Pages -> your project -> Settings -> Variables and Secrets -> add GEMINI_API_KEY',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body = (await context.request.json()) as any;
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
        error: err?.message || 'Internal Cloudflare Function error',
        fallback: true,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
