import { describe, it, expect, beforeEach } from 'vitest';
import handler, { _clearRateLimits } from '../api/chat';

describe('Serverless Gemini Chat API (/api/chat) Security & Handling', () => {
  beforeEach(() => {
    _clearRateLimits();
    delete process.env.GEMINI_API_KEY;
  });

  const createMockResponse = () => {
    const headers: Record<string, string> = {};
    let statusCode = 200;
    let jsonBody: Record<string, unknown> = {};
    let ended = false;

    return {
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
        return this;
      },
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: Record<string, unknown>) {
        jsonBody = body;
      },
      end() {
        ended = true;
      },
      getHeaders: () => headers,
      getStatusCode: () => statusCode,
      getJsonBody: () => jsonBody,
      isEnded: () => ended,
    };
  };

  it('handles OPTIONS preflight with 200 and sets security headers', async () => {
    const res = createMockResponse();
    await handler({ method: 'OPTIONS' }, res);

    expect(res.getStatusCode()).toBe(200);
    expect(res.isEnded()).toBe(true);
    expect(res.getHeaders()['x-content-type-options']).toBe('nosniff');
    expect(res.getHeaders()['x-frame-options']).toBe('DENY');
    expect(res.getHeaders()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('rejects GET and non-POST methods with 405 Method Not Allowed', async () => {
    const res = createMockResponse();
    await handler({ method: 'GET' }, res);

    expect(res.getStatusCode()).toBe(405);
    expect(res.getJsonBody().error).toBe('Method Not Allowed. Use POST.');
  });

  it('rejects missing or empty userQuery with 400 Bad Request', async () => {
    const res = createMockResponse();
    await handler({ method: 'POST', body: {} }, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getJsonBody().error).toContain('userQuery is required');
  });

  it('rejects oversized queries exceeding 2000 characters', async () => {
    const res = createMockResponse();
    const oversized = 'a'.repeat(2001);
    await handler({ method: 'POST', body: { userQuery: oversized } }, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getJsonBody().error).toContain('exceeds maximum allowed length');
  });

  it('rejects queries containing only non-printable control characters', async () => {
    const res = createMockResponse();
    await handler({ method: 'POST', body: { userQuery: '\u0000\u0001\u0002\u0003' } }, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getJsonBody().error).toContain('contains only invalid control characters');
  });

  it('allows valid origins from localhost and vercel deployments', async () => {
    const res1 = createMockResponse();
    await handler(
      {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5173' },
      },
      res1
    );
    expect(res1.getHeaders()['access-control-allow-origin']).toBe('http://localhost:5173');

    const res2 = createMockResponse();
    await handler(
      {
        method: 'OPTIONS',
        headers: { origin: 'https://airwise-ai.vercel.app' },
      },
      res2
    );
    expect(res2.getHeaders()['access-control-allow-origin']).toBe('https://airwise-ai.vercel.app');
  });

  it('returns graceful fallback response when GEMINI_API_KEY is not configured', async () => {
    const res = createMockResponse();
    await handler(
      {
        method: 'POST',
        body: { userQuery: 'How do I protect my child from winter smog?' },
      },
      res
    );

    expect(res.getStatusCode()).toBe(200);
    expect(res.getJsonBody().fallback).toBe(true);
    expect(res.getJsonBody().reason).toContain('Falling back to local intelligence engine');
  });

  it('enforces rate limiting after 30 requests from the same client IP', async () => {
    const clientIp = '198.51.100.42';

    // First 30 requests should succeed
    for (let i = 0; i < 30; i++) {
      const res = createMockResponse();
      await handler(
        {
          method: 'POST',
          headers: { 'x-forwarded-for': clientIp },
          body: { userQuery: 'Valid query' },
        },
        res
      );
      expect(res.getStatusCode()).toBe(200);
    }

    // 31st request should be rate-limited
    const rateLimitedRes = createMockResponse();
    await handler(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIp },
        body: { userQuery: 'Another query' },
      },
      rateLimitedRes
    );

    expect(rateLimitedRes.getStatusCode()).toBe(429);
    expect(rateLimitedRes.getJsonBody().error).toContain('Rate limit exceeded');
    expect(rateLimitedRes.getHeaders()['retry-after']).toBeDefined();
  });
});
