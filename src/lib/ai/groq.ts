import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';
const FALLBACK = 'llama-3.1-8b-instant';

async function tryModel(model: string, messages: any[], stream: boolean) {
  return groq.chat.completions.create({
    model,
    temperature: 1,
    max_completion_tokens: 4096,
    top_p: 1,
    stream,
    stop: null,
    messages
  });
}

async function tryGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API key available');
  }

  const model = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }]
        },
        contents: [
          {
            parts: [{ text: user }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

export async function generateJSON<T>(system: string, user: string): Promise<T> {
  const messages = [
    { role: 'system' as const, content: system + '\n\nRESPOND ONLY WITH VALID JSON. No markdown. No backticks. No explanation. Raw JSON only.' },
    { role: 'user' as const, content: user }
  ];

  let raw = '';
  try {
    const res = await tryModel(MODEL, messages, false) as any;
    raw = res.choices[0]?.message?.content || '{}';
  } catch {
    try {
      const res = await tryModel(FALLBACK, messages, false) as any;
      raw = res.choices[0]?.message?.content || '{}';
    } catch (e) {
      console.warn('[groq] Groq failed. Falling back to Gemini...', e);
      try {
        raw = await tryGemini(system + '\n\nRESPOND ONLY WITH VALID JSON. No markdown. No backticks. No explanation. Raw JSON only.', user);
      } catch (geminiError) {
        console.error('[groq] Gemini fallback also failed:', geminiError);
        throw geminiError;
      }
    }
  }

  let cleaned = raw.trim();

  // 1. Remove markdown code blocks if the model returned them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // 2. Extract standard JSON block if surrounded by conversational filler
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }

  // 3. Strip trailing commas that break standard JSON.parse
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError: any) {
    try {
      // 4. Fallback: Repair single-quoted keys and values
      let repaired = cleaned;
      repaired = repaired.replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
      repaired = repaired.replace(/(:\s*)'([^']*)'(\s*[,}])/g, '$1"$2"$3');
      
      // 5. Fallback: Escape unescaped raw newlines in string properties
      repaired = repaired.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
        return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
      });

      return JSON.parse(repaired) as T;
    } catch {
      throw new Error(`JSON parse failed: ${firstError.message || firstError}\nRaw content snippet: ${raw.slice(0, 300)}`);
    }
  }
}

export async function streamText(
  system: string,
  user: string,
  onChunk: (text: string) => void
): Promise<string> {
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user }
  ];

  let full = '';
  try {
    const stream = await tryModel(MODEL, messages, true) as any;
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      full += text;
      onChunk(text);
    }
  } catch {
    try {
      const stream = await tryModel(FALLBACK, messages, true) as any;
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        full += text;
        onChunk(text);
      }
    } catch (e) {
      console.warn('[groq] Groq stream failed. Falling back to Gemini...', e);
      try {
        full = await tryGemini(system, user);
        onChunk(full);
      } catch (geminiError) {
        console.error('[groq] Gemini stream fallback also failed:', geminiError);
        throw geminiError;
      }
    }
  }
  return full;
}
