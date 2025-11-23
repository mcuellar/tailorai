const OPENAI_MODEL = 'gpt-4o-mini';
const STORAGE_WARNING = 'Set VITE_OPENAI_API_KEY in your Vite environment to enable OpenAI formatting.';

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

    console.warn('[TuneIt] Missing VITE_OPENAI_API_KEY. Falling back to local formatter for development.');
    return localMarkdownFallback(trimmed);
  }

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant that formats job descriptions for recruiters. Return polished Markdown with clear section headings, bullet lists, and emphasis where appropriate. Do not include any commentary outside the Markdown. The very first line must be a level-one heading in the format `# Company Name: Job Title` using details found in the description.',
      },
      {
        role: 'user',
        content: `Format the following job description using Markdown. Do not invent new details.\n\n${trimmed}`,
      },
    ],
    max_tokens: 900,
  };

  const payloadSize = new TextEncoder().encode(JSON.stringify(body)).length;
  logSize('Job format payload', payloadSize);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const responseClone = response.clone();
  const responseText = await responseClone.text();
  const responseSize = new TextEncoder().encode(responseText).length;
  logSize('Job format response', responseSize);

  if (!response.ok) {
    const errorPayload = await safeParseJSON(response);
    const message = errorPayload?.error?.message || 'Unable to format job description with OpenAI.';
    throw new Error(message);
  }

  const payload = await response.json();
  const markdown = payload?.choices?.[0]?.message?.content;

  if (!markdown) {
    throw new Error('OpenAI response did not include formatted content.');
  }

  return normalizeMarkdown(markdown);
}

export async function optimizeResume({ baseResume, jobDescription, jobTitle }) {
  const resumeTrimmed = baseResume?.trim();
  const jobTrimmed = jobDescription?.trim();

  if (!resumeTrimmed) {
    throw new Error('Add your base resume before optimizing.');
  }

  if (!jobTrimmed) {
    throw new Error('Select a job description before optimizing a resume.');
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    if (import.meta.env.PROD) {
      throw new Error(STORAGE_WARNING);
    }

    console.warn('[TuneIt] Missing VITE_OPENAI_API_KEY. Returning development fallback resume.');
    return localResumeFallback(resumeTrimmed, jobTrimmed, jobTitle);
  }

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.45,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert career coach and meticulous fact-checker. Rewrite resumes so they align with a target job description using only information that already exists in the provided base resume. Do not fabricate or infer new employers, titles, dates, technologies, certifications, responsibilities, or metrics. You may reorder, merge, or rephrase existing content, but every factual statement must be traceable to the base resume. If the base resume lacks details for a requirement, leave it out rather than inventing it. Respond only with Markdown representing the tailored resume.',
      },
      {
        role: 'user',
        content: `Base resume (source of truth, do not introduce new facts):\n${resumeTrimmed}\n\nTarget job description:\n${jobTrimmed}\n\nRewrite the resume so it is tailored to this role. Rephrase and reprioritize existing achievements to match the role, mirror the terminology of the job description when appropriate, and keep the tone professional. Use the target job title${jobTitle ? ` "${jobTitle}"` : ''} in the summary. If a detail is not present in the base resume, leave it out instead of inventing it.`,
      },
    ],
    max_tokens: 1100,
  };

  const payloadSize = new TextEncoder().encode(JSON.stringify(body)).length;
  logSize('Resume optimize payload', payloadSize);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const responseClone = response.clone();
  const responseText = await responseClone.text();
  const responseSize = new TextEncoder().encode(responseText).length;
  logSize('Resume optimize response', responseSize);

  if (!response.ok) {
    const errorPayload = await safeParseJSON(response);
    const message = errorPayload?.error?.message || 'Unable to optimize resume with OpenAI.';
    throw new Error(message);
  }

  const payload = await response.json();
  const markdown = payload?.choices?.[0]?.message?.content;

  if (!markdown) {
    throw new Error('OpenAI response did not include resume content.');
  }

  return normalizeMarkdown(markdown);
}

function logSize(label, bytes) {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  console.log(`[OpenAI] ${label}: ${bytes} bytes | ${kb.toFixed(2)} KB | ${mb.toFixed(4)} MB`);
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

function localResumeFallback(baseResume, jobDescription, jobTitle) {
  const heading = jobTitle ? `# ${jobTitle} Resume (Dev Fallback)` : '# Tailored Resume (Dev Fallback)';
  return `${heading}\n\n> This resume was generated using the local development fallback.\n\n${baseResume}\n\n---\n\n## Target Role Notes\n\n${jobDescription}`;
}

function normalizeMarkdown(raw) {
  const trimmed = raw.replace(/\r\n/g, '\n').trim();

  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const firstLineBreak = trimmed.indexOf('\n');
  const fenceEnd = trimmed.lastIndexOf('```');

  if (firstLineBreak === -1 || fenceEnd <= firstLineBreak) {
    return trimmed.replace(/```/g, '').trim();
  }

  const content = trimmed.slice(firstLineBreak + 1, fenceEnd).trim();
  return content;
}
