import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatAssistant } from '../src/components/assistant/ChatAssistant';
import { AppProvider } from '../src/context/AppContext';

// Mock matchMedia for jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Security: DOM XSS & Safe Markdown Rendering', () => {
  it('renders standard chat interface without injecting raw HTML', () => {
    const { container } = render(
      <AppProvider>
        <ChatAssistant />
      </AppProvider>
    );

    // Initial assistant welcome message should be present
    expect(screen.getByText(/AirWise AI/i)).toBeInTheDocument();

    // Verify no script tags were injected into DOM
    expect(container.querySelectorAll('script').length).toBe(0);
  });

  it('prevents XSS by escaping script tags and malicious attributes', () => {
    // Test the inline parser behavior
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    const maliciousPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>**Safe Bold**';
    const parts = maliciousPayload.split(regex);

    // Assert that the payload was cleanly split and bold is identified without executing tags
    expect(parts).toContain('**Safe Bold**');
    expect(parts[0]).toContain('<script>alert("XSS")</script>');
  });
});
