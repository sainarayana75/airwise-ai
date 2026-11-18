// ==============================================================
// VERCEL SERVERLESS FUNCTION: /api/chat
// Server-Side Secure Google Gemini API Integration
// - Origin Allowlisting (CORS)
// - Sliding-Window In-Memory Rate Limiting (30 req/min per IP)
// - OWASP Recommended Security Headers
// - Strict Input Sanitization & Abuse Prevention
// ==============================================================

interface MinimalRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface MinimalResponse {
  setHeader(name: string, value: string): this;
  status(code: number): this;
  json(body: Record<string, unknown>): void;
  end(): void;
}

interface ChatRequestBody {
  userQuery: string;
  systemInstruction?: string;
  userPrompt?: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role: string;
  parts: GeminiContentPart[];
}

interface GeminiGenerationConfig {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

interface GeminiRequestPayload {
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
  system_instruction?: {
    parts: GeminiContentPart[];
  };
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
}

// ---------------------------------------------------------------------------
// Rate Limiter: In-memory sliding-window per IP address
// Limit: 30 requests per 60 seconds
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(clientIp: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  // Periodic cleanup of stale entries if map grows large
  if (rateLimitMap.size > 1000) {
    for (const [ip, rec] of rateLimitMap.entries()) {
      if (now > rec.resetAt) rateLimitMap.delete(ip);
    }
  }

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfter: 0 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { limited: true, retryAfter };
  }

  record.count += 1;
  return { limited: false, retryAfter: 0 };
}

/** Exposed for unit tests to reset rate limiting state */
export function _clearRateLimits(): void {
  rateLimitMap.clear();
}

/** Determine whether a given request origin is allowed */
function resolveAllowedOrigin(requestOrigin?: string): string | null {
  if (!requestOrigin) return null;

  try {
    const parsed = new URL(requestOrigin);
    const host = parsed.hostname.toLowerCase();

    // Allow localhost and local loopbacks
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return requestOrigin;
    }

    // Allow official Vercel preview and production deployments
    if (host.endsWith('.vercel.app')) {
      return requestOrigin;
    }

    // Allow custom allowed origin configured via environment
    if (process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN === requestOrigin) {
      return requestOrigin;
    }
  } catch {
    return null;
  }

  return null;
}

/** Strip dangerous non-printable ASCII control characters */
function sanitizeText(input: string): string {
  // Removes control chars except standard whitespace \t, \n, \r
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export default async function handler(req: MinimalRequest, res: MinimalResponse) {
  // Extract headers
  const originHeader = Array.isArray(req.headers?.origin)
    ? req.headers.origin[0]
    : req.headers?.origin;

  const clientIpHeader = Array.isArray(req.headers?.['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown-client';

  const clientIp = typeof clientIpHeader === 'string' ? clientIpHeader.split(',')[0].trim() : 'unknown-client';

  // Apply Security Headers (OWASP recommendations)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CORS Handling
  const allowedOrigin = resolveAllowedOrigin(originHeader);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Rate Limiting Check
  const rateLimitResult = isRateLimited(clientIp);
  if (rateLimitResult.limited) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfter));
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait before submitting additional messages.',
      retryAfter: rateLimitResult.retryAfter,
    });
  }

  try {
    const body = (req.body || {}) as Partial<ChatRequestBody>;
    const rawQuery = body.userQuery;

    if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim().length === 0) {
      return res.status(400).json({ error: 'userQuery is required and must be a non-empty string.' });
    }

    const userQuery = sanitizeText(rawQuery);
    if (userQuery.length === 0) {
      return res.status(400).json({ error: 'userQuery contains only invalid control characters.' });
    }

    // Limit maximum query length to prevent token abuse
    if (userQuery.length > 2000) {
      return res.status(400).json({ error: 'userQuery exceeds maximum allowed length of 2000 characters.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      // Graceful fallback signal so the client seamlessly engages the intelligent rule engine
      return res.status(200).json({
        fallback: true,
        reason: 'GEMINI_API_KEY is not configured on the server. Falling back to local intelligence engine.',
      });
    }

    // Construct Gemini API payload with sanitized text
    const contents: GeminiContent[] = [];

    // Append prior history if provided
    if (Array.isArray(body.history)) {
      for (const item of body.history.slice(-6)) {
        if (item && item.role && item.parts && Array.isArray(item.parts)) {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: item.parts.map(p => ({
              text: sanitizeText(String(p.text || '')).slice(0, 1000),
            })),
          });
        }
      }
    }

    const finalPrompt = body.userPrompt ? sanitizeText(body.userPrompt) : userQuery;
    contents.push({
      role: 'user',
      parts: [{ text: finalPrompt }],
    });

    const requestPayload: GeminiRequestPayload = {
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        topP: 0.8,
      },
    };

    if (body.systemInstruction) {
      requestPayload.system_instruction = {
        parts: [{ text: sanitizeText(body.systemInstruction) }],
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.warn(`Gemini API responded with status ${geminiRes.status}:`, errorText);
      return res.status(200).json({
        fallback: true,
        reason: `Gemini API returned status ${geminiRes.status}. Using verified deterministic fallback.`,
      });
    }

    const geminiData = (await geminiRes.json()) as GeminiApiResponse;
    const candidate = geminiData.candidates?.[0];
    const generatedText = candidate?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return res.status(200).json({
        fallback: true,
        reason: 'Empty candidate from Gemini model. Using verified deterministic fallback.',
      });
    }

    return res.status(200).json({
      fallback: false,
      reply: generatedText,
      modelUsed: model,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Server error communicating with Gemini API.';
    console.error('Error handling Gemini chat endpoint:', errorMsg);
    return res.status(200).json({
      fallback: true,
      reason: errorMsg,
    });
  }
}
