// ==============================================================
// CHAT SERVICE (CLIENT-SIDE CLIENT FOR GEMINI / BACKEND + FALLBACK)
// ==============================================================

import { AirQualityData, ChatMessage, UserProfile } from '../types';
import { buildGeminiPrompt, generateFallbackResponse } from '../engine/fallback-assistant';

export async function sendChatMessage(
  userQuery: string,
  user: UserProfile,
  envData: AirQualityData,
  history: ChatMessage[]
): Promise<ChatMessage> {
  const { systemInstruction, userPrompt } = buildGeminiPrompt(
    userQuery,
    user,
    envData,
    history.map(h => ({ role: h.sender, content: h.content }))
  );

  const formattedHistory = history.slice(-4).map(h => ({
    role: (h.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
    parts: [{ text: h.content }],
  }));

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userQuery,
        systemInstruction,
        userPrompt,
        history: formattedHistory,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.reply) {
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFallback: false,
          suggestedFollowUps: [
            'How can I build an affordable air filter?',
            'What is the exposure risk during my commute?',
            'When can I open my windows today?',
          ],
        };
      }
    }
  } catch (err) {
    console.info('Serverless API unreachable, deploying client-side deterministic intelligence engine.');
  }

  // Graceful deterministic fallback
  return generateFallbackResponse(userQuery, user, envData);
}
