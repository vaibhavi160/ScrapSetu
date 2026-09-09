interface Env {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
}

export async function onRequestGet(context: { env: Env }) {
  const hasKey = Boolean(context.env.GEMINI_API_KEY || context.env.VITE_GEMINI_API_KEY);
  return new Response(
    JSON.stringify({
      status: 'ok',
      hasGeminiKey: hasKey,
      service: 'ScrapSetu Cloudflare Edge Function',
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
