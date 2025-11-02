const OPENAI_MODEL = 'gpt-4o-mini';
const STORAGE_WARNING = 'Set VITE_OPENAI_API_KEY in your Vite environment to enable OpenAI formatting.';

/**
 * Formats a raw job description into Markdown using OpenAI.
 * Falls back to a simple Markdown wrapper in development if no API key is provided.
 * @param {string} jobDescription
 * @returns {Promise<string>}
 */
export async function formatJobDescription(jobDescription) {
  const trimmed = jobDescription?.trim();

  if (!trimmed) {
    throw new Error('Please provide a job description to format.');
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    if (import.meta.env.PROD) {
      throw new Error(STORAGE_WARNING);
    }

    console.warn('[TailorAI] Missing VITE_OPENAI_API_KEY. Falling back to local formatter for development.');
    return localMarkdownFallback(trimmed);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that formats job descriptions for recruiters. Return polished Markdown with clear section headings, bullet lists, and emphasis where appropriate. Do not include any commentary outside the Markdown.',
        },
        {
          role: 'user',
          content: `Format the following job description using Markdown. Do not invent new details.\n\n${trimmed}`,
        },
      ],
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorPayload = await safeParseJSON(response);
    const message = errorPayload?.error?.message || 'Unable to format job description with OpenAI.';
    throw new Error(message);
  }

  const payload = await response.json();
  const markdown = payload?.choices?.[0]?.message?.content?.trim();

  if (!markdown) {
    throw new Error('OpenAI response did not include formatted content.');
  }

  return markdown;
}

async function safeParseJSON(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function localMarkdownFallback(raw) {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const [firstLine = 'Job Description'] = normalized.split('\n').filter(Boolean);

  return `# ${firstLine.replace(/^[#\s]+/, '')}\n\n${normalized}`;
}
