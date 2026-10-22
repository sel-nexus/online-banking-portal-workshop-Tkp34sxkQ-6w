const REDACTION_MARKER = '[REDACTED]';

const DEFAULT_ALLOWED_KEYS = Object.freeze([
  'id',
  'type',
  'category',
  'status',
  'state',
  'severity',
  'priority',
  'direction',
  'currency',
  'amount',
  'value',
  'count',
  'total',
  'quantity',
  'percentage',
  'rate',
  'date',
  'createdAt',
  'updatedAt',
  'postedAt',
  'sentAt',
  'startedAt',
  'endedAt',
  'timestamp',
  'referenceDate',
  'title',
  'label',
  'description',
  'content',
  'text',
  'message',
  'name',
  'merchant',
  'payee',
  'action',
  'actionType',
  'event',
  'eventName',
  'screen',
  'route',
  'path',
  'method',
  'code',
  'error',
  'errorCode',
  'errorName',
  'success',
  'valid',
  'enabled',
  'active',
  'read',
  'isRead',
  'isCredit',
  'items',
  'data',
  'metadata',
  'details',
  'session',
  'profile',
]);

const SENSITIVE_KEY_NAMES = Object.freeze([
  'password',
  'passcode',
  'passwd',
  'pin',
  'otp',
  'oneTimePassword',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'authToken',
  'authorization',
  'secret',
  'privateKey',
  'apiKey',
  'clientSecret',
  'credential',
  'credentials',
  'sessionId',
  'cookie',
  'setCookie',
  'cardNumber',
  'creditCardNumber',
  'debitCardNumber',
  'pan',
  'cvv',
  'cvc',
  'securityCode',
  'accountNumber',
  'fullAccountNumber',
  'bankAccount',
  'iban',
  'swift',
  'routingNumber',
  'sortCode',
  'reference',
  'rawReference',
  'transactionReference',
  'traceId',
  'authorizationCode',
  'email',
  'phone',
  'mobile',
  'mobileNumber',
  'telephone',
  'address',
  'street',
  'postalCode',
  'zipCode',
  'dateOfBirth',
  'birthDate',
  'fullName',
  'firstName',
  'lastName',
  'middleName',
  'username',
  'userName',
  'displayId',
  'customerId',
  'profileId',
  'userId',
]);

const SAFE_MASK_PATTERN = /(?:•{2,}|[*xX]{2,})\s*\d{2,6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?(?:\d[\s().-]?){7,}\d$/;
const LONG_NUMBER_PATTERN = /^\d[\d\s-]{7,}\d$/;
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SECRET_ASSIGNMENT_PATTERN =
  /\b(?:password|passwd|token|secret|api[_-]?key|authorization)\s*[:=]\s*\S+/i;

function normalizeKey(key) {
  return String(key)
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function createKeySet(keys) {
  return new Set(keys.map((key) => normalizeKey(key)));
}

const DEFAULT_ALLOWED_KEY_SET = createKeySet(DEFAULT_ALLOWED_KEYS);
const SENSITIVE_KEY_SET = createKeySet(SENSITIVE_KEY_NAMES);

function isSensitiveKey(key) {
  const normalizedKey = normalizeKey(key);

  if (!normalizedKey) {
    return false;
  }

  if (SENSITIVE_KEY_SET.has(normalizedKey)) {
    return true;
  }

  return [
    'password',
    'token',
    'secret',
    'credential',
    'account_number',
    'card_number',
    'phone_number',
    'mobile_number',
    'email_address',
    'date_of_birth',
    'raw_reference',
  ].some((part) => normalizedKey.includes(part));
}

function isAllowedKey(key, allowedKeys) {
  return allowedKeys.has(normalizeKey(key));
}

function isSensitiveString(value) {
  const normalizedValue = value.trim();

  if (!normalizedValue || SAFE_MASK_PATTERN.test(normalizedValue)) {
    return false;
  }

  return (
    EMAIL_PATTERN.test(normalizedValue) ||
    PHONE_PATTERN.test(normalizedValue) ||
    LONG_NUMBER_PATTERN.test(normalizedValue) ||
    JWT_PATTERN.test(normalizedValue) ||
    SECRET_ASSIGNMENT_PATTERN.test(normalizedValue)
  );
}

function getReplacement(options) {
  return options.replacement === undefined
    ? undefined
    : options.replacement;
}

function redactValue(value, options, key, seen, depth) {
  if (depth > options.maxDepth) {
    return undefined;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return isSensitiveString(value) ? getReplacement(options) : value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value;
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const result = value
      .map((item) => redactValue(item, options, undefined, seen, depth + 1))
      .filter((item) => item !== undefined);

    seen.delete(value);
    return result;
  }

  const result = {};

  Object.entries(value).forEach(([propertyKey, propertyValue]) => {
    if (
      isSensitiveKey(propertyKey) ||
      (!options.allowUnknownKeys &&
        !isAllowedKey(propertyKey, options.allowedKeys))
    ) {
      if (options.replacement !== undefined && !isSensitiveKey(propertyKey)) {
        result[propertyKey] = options.replacement;
      }
      return;
    }

    const redactedValue = redactValue(
      propertyValue,
      options,
      propertyKey,
      seen,
      depth + 1,
    );

    if (redactedValue !== undefined) {
      result[propertyKey] = redactedValue;
    } else if (options.replacement !== undefined) {
      result[propertyKey] = options.replacement;
    }
  });

  seen.delete(value);

  return Object.keys(result).length > 0 ? result : {};
}

function normalizeOptions(options = {}) {
  const customAllowedKeys = Array.isArray(options.allowedKeys)
    ? options.allowedKeys
    : DEFAULT_ALLOWED_KEYS;

  return {
    allowedKeys: createKeySet(customAllowedKeys),
    allowUnknownKeys: options.allowUnknownKeys === true,
    maxDepth:
      Number.isInteger(options.maxDepth) && options.maxDepth >= 0
        ? options.maxDepth
        : 8,
    replacement: options.replacement,
  };
}

/**
 * Recursively removes sensitive and non-allow-listed values from data.
 *
 * @param {*} value Value to redact.
 * @param {object} options Redaction options.
 * @returns {*} A privacy-safe copy of the value.
 */
export function redact(value, options = {}) {
  const normalizedOptions = normalizeOptions(options);

  if (isSensitiveKey(options.key)) {
    return getReplacement(normalizedOptions);
  }

  return redactValue(
    value,
    normalizedOptions,
    options.key,
    new WeakSet(),
    0,
  );
}

/**
 * Redacts data before it is persisted.
 *
 * @param {*} value Value to redact.
 * @returns {*} Privacy-safe persisted data.
 */
export function redactForPersistence(value) {
  return redact(value);
}

/**
 * Redacts data before it is sent to analytics.
 *
 * @param {*} value Value to redact.
 * @returns {*} Privacy-safe analytics data.
 */
export function redactForAnalytics(value) {
  return redact(value, {
    allowedKeys: DEFAULT_ALLOWED_KEYS.filter(
      (key) => !['content', 'text', 'message', 'description', 'details'].includes(key),
    ),
  });
}

/**
 * Redacts data before it is included in diagnostics.
 *
 * @param {*} value Value to redact.
 * @returns {*} Privacy-safe diagnostic data.
 */
export function redactForDiagnostics(value) {
  return redact(value);
}

/**
 * Checks whether a property name is sensitive.
 *
 * @param {string} key Property name.
 * @returns {boolean} Whether the property must be removed.
 */
export { isSensitiveKey };

/**
 * Checks whether a value contains recognizable sensitive data.
 *
 * @param {*} value Value to check.
 * @returns {boolean} Whether the value should be redacted.
 */
export function containsSensitiveData(value) {
  if (typeof value === 'string') {
    return isSensitiveString(value);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.entries(value).some(
    ([key, childValue]) =>
      isSensitiveKey(key) ||
      containsSensitiveData(childValue),
  );
}

export const redactSensitiveData = redact;
export const sanitizeData = redact;
export const sanitizeForPersistence = redactForPersistence;
export const sanitizeForAnalytics = redactForAnalytics;
export const sanitizeForDiagnostics = redactForDiagnostics;
export const REDACTED = REDACTION_MARKER;
export const ALLOWED_KEYS = DEFAULT_ALLOWED_KEYS;

const redaction = Object.freeze({
  redact,
  redactSensitiveData,
  redactForPersistence,
  redactForAnalytics,
  redactForDiagnostics,
  sanitizeData,
  sanitizeForPersistence,
  sanitizeForAnalytics,
  sanitizeForDiagnostics,
  isSensitiveKey,
  containsSensitiveData,
  REDACTION_MARKER,
  REDACTED,
  ALLOWED_KEYS,
});

export default redaction;