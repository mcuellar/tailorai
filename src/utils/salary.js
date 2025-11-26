const PERIOD_SYNONYMS = {
  year: 'year',
  yearly: 'year',
  annum: 'year',
  yr: 'year',
  yrs: 'year',
  annual: 'year',
  month: 'month',
  mo: 'month',
  mos: 'month',
  monthly: 'month',
  week: 'week',
  wk: 'week',
  wks: 'week',
  weekly: 'week',
  day: 'day',
  daily: 'day',
  hour: 'hour',
  hr: 'hour',
  hrs: 'hour',
  hourly: 'hour',
  contract: 'contract',
  project: 'project'
};

const CURRENCY_HINTS = [
  { code: 'CAD', patterns: ['C$', 'CAD'] },
  { code: 'AUD', patterns: ['A$', 'AUD'] },
  { code: 'USD', patterns: ['US$', 'USD', '$'] },
  { code: 'EUR', patterns: ['EUR', '\u20AC'] },
  { code: 'GBP', patterns: ['GBP', '\u00A3'] },
  { code: 'JPY', patterns: ['JPY', '\u00A5'] },
  { code: 'INR', patterns: ['INR', '\u20B9'] }
];

export function parseSalaryNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const suffixMatch = cleaned.replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*([kKmM])\b/);
  if (suffixMatch) {
    const base = Number(suffixMatch[1]);
    if (Number.isFinite(base)) {
      const multiplier = suffixMatch[2].toLowerCase() === 'm' ? 1_000_000 : 1_000;
      return base * multiplier;
    }
  }

  const numericMatch = cleaned.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) {
    return null;
  }

  const amount = Number(numericMatch[0]);
  return Number.isFinite(amount) ? amount : null;
}

export function formatSalaryAmount(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  const currencyCode = normalizeCurrencyCode(currency);

  if (typeof Intl !== 'undefined' && currencyCode) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch {
      // ignore Intl fallbacks
    }
  }

  const formatted = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}

export function formatSalaryRange(details) {
  if (!details) {
    return null;
  }

  const minLabel = formatSalaryAmount(details.min, details.currency);
  const maxLabel = formatSalaryAmount(details.max, details.currency);
  const suffix = details.period ? ` per ${details.period}` : '';

  if (minLabel && maxLabel) {
    return `${minLabel} - ${maxLabel}${suffix}`;
  }

  if (minLabel) {
    return `${minLabel}${suffix}`;
  }

  if (maxLabel) {
    return `${maxLabel}${suffix}`;
  }

  return details.range ?? null;
}

export function normalizeSalaryDetails(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed
      ? {
          range: trimmed,
          min: null,
          max: null,
          currency: null,
          period: null
        }
      : null;
  }

  if (typeof raw !== 'object') {
    return null;
  }

  const rangeSource = pickRangeString(raw);
  const min = parseSalaryNumber(raw.min ?? raw.minimum ?? raw.salaryMin);
  const max = parseSalaryNumber(raw.max ?? raw.maximum ?? raw.salaryMax);
  const currency = normalizeCurrencyCode(raw.currency ?? raw.salaryCurrency);
  const period = normalizePeriodValue(raw.period ?? raw.salaryPeriod ?? raw.cadence);

  const normalized = {
    range: rangeSource,
    min,
    max,
    currency,
    period
  };

  if (!normalized.range && (normalized.min != null || normalized.max != null)) {
    normalized.range = formatSalaryRange(normalized);
  }

  return normalized;
}

export function detectCurrencyCodeFromText(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const normalized = text.toUpperCase();

  for (const hint of CURRENCY_HINTS) {
    for (const pattern of hint.patterns) {
      if (pattern === '$') {
        if (text.includes('$')) {
          return hint.code;
        }
        continue;
      }

      if (normalized.includes(pattern)) {
        return hint.code;
      }
    }
  }

  const isoMatch = normalized.match(/\b[A-Z]{3}\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return null;
}

export function detectPeriodFromText(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const normalized = text.toLowerCase();
  const patterns = [
    { regex: /(per|\/)\s*(year|yr|yrs|annum|annual)/, value: 'year' },
    { regex: /(per|\/)\s*(month|mo|mos|monthly)/, value: 'month' },
    { regex: /(per|\/)\s*(week|wk|wks|weekly)/, value: 'week' },
    { regex: /(per|\/)\s*(day|daily)/, value: 'day' },
    { regex: /(per|\/)\s*(hour|hr|hrs|hourly)/, value: 'hour' },
    { regex: /(per|\/)\s*(contract|project)/, value: 'contract' }
  ];

  for (const entry of patterns) {
    if (entry.regex.test(normalized)) {
      return entry.value;
    }
  }

  if (normalized.includes('annual')) {
    return 'year';
  }

  return null;
}

function pickRangeString(raw) {
  const rangeCandidate =
    raw.range ??
    raw.rangeText ??
    raw.salaryRange ??
    raw.display ??
    null;

  if (typeof rangeCandidate !== 'string') {
    return null;
  }

  const trimmed = rangeCandidate.trim();
  if (!trimmed || /^not provided$/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeCurrencyCode(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^[a-z]{3}$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
  }

  return null;
}

function normalizePeriodValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  return PERIOD_SYNONYMS[trimmed] ?? trimmed;
}

const RANGE_KEYWORD_REGEX = /(salary|compensation|pay|range|earnings|base|target|rate)/i;
const RANGE_VALUE_REGEX = /([$£€¥]?\s*\d[\d,]*(?:\.\d+)?(?:\s*[kKmM])?)\s*(?:-|to|–|—)\s*([$£€¥]?\s*\d[\d,]*(?:\.\d+)?(?:\s*[kKmM])?)/i;

export function extractSalaryDetailsFromText(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!RANGE_KEYWORD_REGEX.test(line)) {
      continue;
    }

    const rangeDetails = matchSalaryRangeInLine(line);
    if (rangeDetails) {
      return rangeDetails;
    }
  }

  return matchSalaryRangeInLine(text);
}

function matchSalaryRangeInLine(line) {
  if (typeof line !== 'string') {
    return null;
  }

  const match = RANGE_VALUE_REGEX.exec(line);
  if (!match) {
    return null;
  }

  const min = parseSalaryNumber(match[1]);
  const max = parseSalaryNumber(match[2]);

  if (min == null && max == null) {
    return null;
  }

  return normalizeSalaryDetails({
    range: line.trim(),
    min,
    max,
    currency: detectCurrencyCodeFromText(line),
    period: detectPeriodFromText(line)
  });
}
