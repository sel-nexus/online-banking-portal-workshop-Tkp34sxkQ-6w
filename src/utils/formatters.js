import {
  formatCurrency as formatDateUtilityCurrency,
  formatDate as formatDateUtility,
  formatDateTime as formatDateTimeUtility,
  formatLongDate as formatLongDateUtility,
} from './dateUtils';

const MASK_CHARACTER = '•';
const DEFAULT_MASK_LENGTH = 4;
const DEFAULT_CURRENCY = 'PHP';

const STATUS_LABELS = Object.freeze({
  active: 'Active',
  approved: 'Approved',
  available: 'Available',
  cancelled: 'Cancelled',
  completed: 'Completed',
  declined: 'Declined',
  failed: 'Failed',
  inactive: 'Inactive',
  pending: 'Pending',
  posted: 'Posted',
  processing: 'Processing',
  scheduled: 'Scheduled',
  suspended: 'Suspended',
  unread: 'Unread',
  read: 'Read',
  expired: 'Expired',
});

const MONEY_IN_TYPES = Object.freeze([
  'credit',
  'deposit',
  'income',
  'refund',
  'received',
  'money-in',
  'money_in',
]);

const MONEY_OUT_TYPES = Object.freeze([
  'debit',
  'payment',
  'purchase',
  'transfer',
  'withdrawal',
  'expense',
  'sent',
  'money-out',
  'money_out',
]);

function toFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number.parseFloat(value.replace(/,/g, ''));

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getCurrencyCode(currency) {
  return normalizeText(currency).toUpperCase() || DEFAULT_CURRENCY;
}

/**
 * Formats a numeric value as a PHP amount.
 *
 * @param {number|string} amount Amount to format.
 * @param {object} options Formatting options.
 * @returns {string} Formatted currency amount.
 */
export function formatCurrency(amount, options = {}) {
  const numericAmount = toFiniteNumber(amount);

  if (numericAmount === null) {
    return '';
  }

  const currency = getCurrencyCode(options.currency);
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  const formattedAmount = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);

  return `${currency} ${formattedAmount}`;
}

/**
 * Formats a value as an accessible PHP amount.
 *
 * @param {number|string} amount Amount to format.
 * @returns {string} Accessible currency amount.
 */
export function formatPHP(amount) {
  return formatCurrency(amount);
}

/**
 * Masks an identifier while retaining only its final characters.
 *
 * @param {string|number} value Identifier to mask.
 * @param {object} options Masking options.
 * @returns {string} Masked identifier.
 */
export function maskIdentifier(value, options = {}) {
  const identifier = normalizeText(String(value ?? ''));

  if (!identifier) {
    return '';
  }

  const visibleCharacters = Math.max(
    0,
    Number(options.visibleCharacters ?? DEFAULT_MASK_LENGTH),
  );
  const maskLength = Math.max(
    1,
    Number(options.maskLength ?? DEFAULT_MASK_LENGTH),
  );
  const preserveSeparators = options.preserveSeparators === true;

  if (identifier.length <= visibleCharacters) {
    return identifier;
  }

  const visiblePart = identifier.slice(-visibleCharacters);
  const prefix = MASK_CHARACTER.repeat(maskLength);

  if (preserveSeparators && identifier.includes(' ')) {
    return `${prefix} ${visiblePart}`;
  }

  return `${prefix} ${visiblePart}`;
}

/**
 * Masks an account number for safe display.
 *
 * @param {string|number} value Account number to mask.
 * @returns {string} Masked account number.
 */
export function maskAccountNumber(value) {
  return maskIdentifier(value);
}

/**
 * Formats an account identifier without exposing the complete value.
 *
 * @param {object|string|number} account Account or account identifier.
 * @returns {string} Privacy-safe account identifier.
 */
export function formatAccountIdentifier(account) {
  if (account && typeof account === 'object') {
    return (
      account.maskedAccountNumber ||
      account.accountNumber ||
      account.number ||
      account.id
        ? maskIdentifier(
            account.maskedAccountNumber ||
              account.accountNumber ||
              account.number ||
              account.id,
          )
        : ''
    );
  }

  return maskIdentifier(account);
}

/**
 * Masks an email address while preserving enough information for recognition.
 *
 * @param {string} email Email address to mask.
 * @returns {string} Privacy-safe email address.
 */
export function maskEmail(email) {
  const normalizedEmail = normalizeText(email);
  const separatorIndex = normalizedEmail.indexOf('@');

  if (separatorIndex <= 0) {
    return normalizedEmail ? maskIdentifier(normalizedEmail) : '';
  }

  const localPart = normalizedEmail.slice(0, separatorIndex);
  const domain = normalizedEmail.slice(separatorIndex + 1);

  if (localPart.length === 1) {
    return `${MASK_CHARACTER}@${domain}`;
  }

  return `${localPart[0]}${MASK_CHARACTER.repeat(Math.max(2, localPart.length - 1))}@${domain}`;
}

/**
 * Formats a user identifier without exposing sensitive information.
 *
 * @param {object|string|number} user User or user identifier.
 * @returns {string} Privacy-safe user identifier.
 */
export function formatUserIdentifier(user) {
  if (user && typeof user === 'object') {
    if (user.email) {
      return maskEmail(user.email);
    }

    return maskIdentifier(user.displayId || user.userId || user.id);
  }

  return maskIdentifier(user);
}

/**
 * Formats a date using the application's Philippine locale.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} Formatted date.
 */
export function formatDate(value) {
  return formatDateUtility(value);
}

/**
 * Formats a date and time using the application's Philippine locale.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} Formatted date and time.
 */
export function formatDateTime(value) {
  return formatDateTimeUtility(value);
}

/**
 * Formats a date with a long month name.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} Long formatted date.
 */
export function formatLongDate(value) {
  return formatLongDateUtility(value);
}

/**
 * Converts a status code into a readable label.
 *
 * @param {string} status Status code.
 * @returns {string} Human-readable status label.
 */
export function formatStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (!normalizedStatus) {
    return '';
  }

  if (STATUS_LABELS[normalizedStatus]) {
    return STATUS_LABELS[normalizedStatus];
  }

  return normalizedStatus
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Determines whether a transaction represents money coming in.
 *
 * @param {object|string} transaction Transaction or transaction type.
 * @returns {boolean} Whether the transaction is money in.
 */
export function isMoneyIn(transaction) {
  const type =
    typeof transaction === 'string'
      ? transaction
      : transaction?.type || transaction?.category || '';

  return (
    transaction?.isCredit === true ||
    MONEY_IN_TYPES.includes(normalizeText(type).toLowerCase())
  );
}

/**
 * Determines whether a transaction represents money going out.
 *
 * @param {object|string} transaction Transaction or transaction type.
 * @returns {boolean} Whether the transaction is money out.
 */
export function isMoneyOut(transaction) {
  const type =
    typeof transaction === 'string'
      ? transaction
      : transaction?.type || transaction?.category || '';

  return (
    transaction?.isCredit === false ||
    MONEY_OUT_TYPES.includes(normalizeText(type).toLowerCase())
  );
}

/**
 * Formats a transaction amount with an accessible money-in or money-out sign.
 *
 * @param {number|string|object} amount Amount or transaction to format.
 * @param {string} direction Transaction direction.
 * @param {object} options Formatting options.
 * @returns {string} Signed formatted currency amount.
 */
export function formatMoneyInOut(amount, direction, options = {}) {
  const transaction = amount && typeof amount === 'object' ? amount : null;
  const numericAmount = transaction ? transaction.amount : amount;
  const resolvedDirection =
    direction ||
    (isMoneyIn(transaction)
      ? 'in'
      : isMoneyOut(transaction)
        ? 'out'
        : '');

  const formattedAmount = formatCurrency(numericAmount, options);

  if (!formattedAmount) {
    return '';
  }

  if (resolvedDirection === 'in' || resolvedDirection === 'credit') {
    return `+${formattedAmount}`;
  }

  if (resolvedDirection === 'out' || resolvedDirection === 'debit') {
    return `-${formattedAmount}`;
  }

  return formattedAmount;
}

/**
 * Formats a transaction amount with its direction described in words.
 *
 * @param {number|string|object} amount Amount or transaction to format.
 * @param {string} direction Transaction direction.
 * @param {object} options Formatting options.
 * @returns {string} Accessible directional amount.
 */
export function formatDirectionalAmount(amount, direction, options = {}) {
  const transaction = amount && typeof amount === 'object' ? amount : null;
  const resolvedDirection =
    direction ||
    (isMoneyIn(transaction)
      ? 'in'
      : isMoneyOut(transaction)
        ? 'out'
        : '');
  const formattedAmount = formatCurrency(
    transaction ? transaction.amount : amount,
    options,
  );

  if (!formattedAmount) {
    return '';
  }

  if (resolvedDirection === 'in' || resolvedDirection === 'credit') {
    return `Money in: ${formattedAmount}`;
  }

  if (resolvedDirection === 'out' || resolvedDirection === 'debit') {
    return `Money out: ${formattedAmount}`;
  }

  return formattedAmount;
}

export const formatAccountNumber = maskAccountNumber;
export const formatIdentifier = maskIdentifier;
export const formatEmail = maskEmail;
export const formatStatusLabel = formatStatus;
export const formatTransactionAmount = formatMoneyInOut;
export const formatMoneyAmount = formatMoneyInOut;

const formatters = Object.freeze({
  formatCurrency,
  formatPHP,
  maskIdentifier,
  maskAccountNumber,
  formatAccountNumber,
  formatAccountIdentifier,
  maskEmail,
  formatEmail,
  formatUserIdentifier,
  formatIdentifier,
  formatDate,
  formatDateTime,
  formatLongDate,
  formatStatus,
  formatStatusLabel,
  isMoneyIn,
  isMoneyOut,
  formatMoneyInOut,
  formatDirectionalAmount,
  formatTransactionAmount,
  formatMoneyAmount,
});

export default formatters;