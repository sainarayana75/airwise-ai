// ==============================================================
// VERCEL SERVERLESS FUNCTION: /api/chat
// Server-Side Secure Google Gemini API Integration
// ==============================================================

interface MinimalRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface MinimalResponse {
  setHeader(name: string, value: string): this;
  status(code: number): this;
  json(body: any): void;
  end(): void;
}

interface ChatRequestBody {
  userQuery: string;
  systemInstruction?: string;
  userPrompt?: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}

export default async function handler(req: MinimalRequest, res: MinimalResponse) {
  // CORS & Method Handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { userQuery, systemInstruction, userPrompt, history = [] } = (req.body || {}) as ChatRequestBody;

    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      return res.status(400).json({ error: 'userQuery is required and must be a non-empty string.' });
    }

    // Limit maximum query length to prevent abuse
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

    // Construct Gemini API payload
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Append prior history if provided
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item && item.role && item.parts && Array.isArray(item.parts)) {
          contents.push({
            role: item.role === 'model' ? 'model' : 'user',
            parts: item.parts.map(p => ({ text: String(p.text || '').slice(0, 1000) })),
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt || userQuery }],
    });

    const requestPayload: any = {
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        topP: 0.8,
      },
    };

    if (systemInstruction) {
      requestPayload.system_instruction = {
        parts: [{ text: systemInstruction }],
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

    const geminiData = await geminiRes.json();
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
  } catch (error: any) {
    console.error('Error handling Gemini chat endpoint:', error);
    return res.status(200).json({
      fallback: true,
      reason: error?.message || 'Server error communicating with Gemini API.',
    });
  }
}
