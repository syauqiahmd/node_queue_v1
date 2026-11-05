// Masks personal data and credentials before anything is written to logs.
// Applied to every log entry by log.helper.js, so call sites don't have to remember to.

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 8;

// Keys whose values are credentials: never logged, not even partially.
// Compared after lowercasing and stripping `_`/`-`, so `access_token` and `X-Service-Key` match.
const SECRET_KEYS = new Set([
  'password',
  'newpassword',
  'oldpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'xservicekey',
  'servicekey',
]);
const PHONE_KEYS = new Set(['phone', 'phonenumber']);
const EMAIL_KEYS = new Set(['email']);

// Indonesian mobile numbers as accepted by phoneNormalizer.js: +628…, 628…, 08…
// Not preceded by a word char or `-`, so digit-only blocks inside UUIDs/IDs aren't matched.
const PHONE_PATTERN = /(?<![\w+-])(?:\+62|62|0)8\d{7,11}(?![\w-])/g;
// The lookbehind only lets a match start at the beginning of a word, which keeps this linear;
// without it a long string took seconds, and this runs on every log line.
const EMAIL_PATTERN = /(?<![\w.%+-])[\w.%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT_PATTERN = /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const BEARER_PATTERN = /\bBearer\s+[\w.~+/-]+=*/gi;

// Correlation IDs must stay intact to be searchable.
const PASSTHROUGH_KEYS = new Set(['transactionid']);

const normalizeKey = (key) => key.toLowerCase().replace(/[_-]/g, '');

// 6281234567890 -> 6281******890: enough to tell numbers apart when debugging, not enough to call.
const maskPhone = (phone) => {
  const digits = String(phone);
  if (digits.length <= 7) {
    return '***';
  }
  return `${digits.slice(0, 4)}${'*'.repeat(digits.length - 7)}${digits.slice(-3)}`;
};

// john.doe@gmail.com -> j***@gmail.com
const maskEmail = (email) => {
  const [local, domain] = String(email).split('@');
  if (!domain) {
    return '***';
  }
  return `${local.charAt(0)}***@${domain}`;
};

const redactString = (value) =>
  value
    .replace(JWT_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `Bearer ${REDACTED}`)
    .replace(EMAIL_PATTERN, maskEmail)
    .replace(PHONE_PATTERN, maskPhone);

const redactByKey = (key, value) => {
  const normalized = normalizeKey(key);
  if (PASSTHROUGH_KEYS.has(normalized)) {
    return value;
  }
  if (SECRET_KEYS.has(normalized)) {
    return value === null || value === undefined || value === '' ? value : REDACTED;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    if (PHONE_KEYS.has(normalized)) {
      return maskPhone(value);
    }
    if (EMAIL_KEYS.has(normalized)) {
      return maskEmail(value);
    }
  }
  return undefined;
};

/**
 * Returns a redacted copy of `value`. Never mutates the input, since log meta often holds
 * references to live application objects.
 */
function redact(value, depth = 0, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (depth >= MAX_DEPTH) {
    return '[Truncated]';
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }

  const entries = Object.entries(value).map(([key, item]) => {
    const byKey = redactByKey(key, item);
    return [key, byKey !== undefined ? byKey : redact(item, depth + 1, seen)];
  });
  return Object.fromEntries(entries);
}

module.exports = { redact, maskPhone, maskEmail };
