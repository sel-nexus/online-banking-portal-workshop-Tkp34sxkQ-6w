import { REFERENCE_DATE } from '../config/constants';

const DEFAULT_REFERENCE_DATE = '2026-10-22T00:00:00.000Z';
const DATE_TIME_ZONE = 'Asia/Manila';
const DATE_LOCALE = 'en-PH';

function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const candidate = new Date(value);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  return null;
}

function getReferenceDate() {
  const candidate = toDate(REFERENCE_DATE || DEFAULT_REFERENCE_DATE);

  return candidate || new Date(DEFAULT_REFERENCE_DATE);
}

function getDateParts(value) {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const parts = new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: DATE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return parts.reduce((result, part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      result[part.type] = Number(part.value);
    }

    return result;
  }, {});
}

function getDateKey(value) {
  const parts = getDateParts(value);

  return parts
    ? `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(
        parts.day,
      ).padStart(2, '0')}`
    : null;
}

function getDayDifference(firstDate, secondDate) {
  const firstKey = getDateKey(firstDate);
  const secondKey = getDateKey(secondDate);

  if (!firstKey || !secondKey) {
    return null;
  }

  const first = new Date(`${firstKey}T00:00:00.000Z`);
  const second = new Date(`${secondKey}T00:00:00.000Z`);

  return Math.round((first.getTime() - second.getTime()) / 86400000);
}

/**
 * Parses a date-like value.
 *
 * @param {Date|string|number} value Date value to parse.
 * @returns {Date|null} Parsed date or null when invalid.
 */
export function parseDate(value) {
  return toDate(value);
}

/**
 * Returns the configured application reference date.
 *
 * @returns {Date} Reference date.
 */
export { getReferenceDate };

/**
 * Checks whether a date-like value is valid.
 *
 * @param {Date|string|number} value Date value to check.
 * @returns {boolean} Whether the value is a valid date.
 */
export function isValidDate(value) {
  return Boolean(toDate(value));
}

/**
 * Formats a date for display in the Philippine locale.
 *
 * @param {Date|string|number} value Date value to format.
 * @param {Intl.DateTimeFormatOptions} options Formatting options.
 * @returns {string} Formatted date or an empty string for an invalid value.
 */
export function formatDate(
  value,
  options = { year: 'numeric', month: 'short', day: 'numeric' },
) {
  const date = toDate(value);

  return date
    ? new Intl.DateTimeFormat(DATE_LOCALE, {
        timeZone: DATE_TIME_ZONE,
        ...options,
      }).format(date)
    : '';
}

/**
 * Formats a date using a long, human-readable presentation.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} Long formatted date.
 */
export function formatLongDate(value) {
  return formatDate(value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date and time for display.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} Formatted date and time.
 */
export function formatDateTime(value) {
  return formatDate(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats a date as an ISO calendar date.
 *
 * @param {Date|string|number} value Date value to format.
 * @returns {string} ISO calendar date or an empty string.
 */
export function formatISODate(value) {
  return getDateKey(value) || '';
}

/**
 * Formats a PHP amount without relying on a browser-specific currency symbol.
 *
 * @param {number|string} amount Amount to format.
 * @param {object} options Formatting options.
 * @returns {string} Formatted PHP amount.
 */
export function formatCurrency(amount, options = {}) {
  const numericAmount =
    typeof amount === 'number' ? amount : Number.parseFloat(amount);

  if (!Number.isFinite(numericAmount)) {
    return '';
  }

  const fractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  const formattedAmount = new Intl.NumberFormat(DATE_LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);

  return `PHP ${formattedAmount}`;
}

/**
 * Returns a relative label for a transaction or other dated item.
 *
 * @param {Date|string|number} value Date value to label.
 * @param {Date|string|number} referenceDate Date used as the comparison point.
 * @returns {string} Relative date label or a formatted date.
 */
export function getRelativeDateLabel(
  value,
  referenceDate = getReferenceDate(),
) {
  const difference = getDayDifference(value, referenceDate);

  if (difference === null) {
    return '';
  }

  if (difference === 0) {
    return 'Today';
  }

  if (difference === -1) {
    return 'Yesterday';
  }

  if (difference === 1) {
    return 'Tomorrow';
  }

  return formatDate(value);
}

/**
 * Returns the number of calendar days between two dates.
 *
 * @param {Date|string|number} firstDate First date.
 * @param {Date|string|number} secondDate Second date.
 * @returns {number|null} Calendar-day difference or null for invalid dates.
 */
export function getDateDifference(firstDate, secondDate) {
  return getDayDifference(firstDate, secondDate);
}

/**
 * Checks whether a date falls within an inclusive date range.
 *
 * @param {Date|string|number} value Date to check.
 * @param {Date|string|number} startDate Range start.
 * @param {Date|string|number} endDate Range end.
 * @returns {boolean} Whether the date is within the range.
 */
export function isDateInRange(value, startDate, endDate) {
  const valueKey = getDateKey(value);
  const startKey = getDateKey(startDate);
  const endKey = getDateKey(endDate);

  if (!valueKey || (startDate != null && !startKey) || (endDate != null && !endKey)) {
    return false;
  }

  return (!startKey || valueKey >= startKey) && (!endKey || valueKey <= endKey);
}

/**
 * Checks whether an offer is valid on a date.
 *
 * @param {object} offer Offer containing start and end dates.
 * @param {Date|string|number} referenceDate Date used for validation.
 * @returns {boolean} Whether the offer is valid.
 */
export function isOfferValid(offer, referenceDate = getReferenceDate()) {
  if (!offer || offer.status === 'expired' || offer.status === 'inactive') {
    return false;
  }

  const startDate = offer.startDate;
  const endDate = offer.endDate || offer.expiresAt;

  return isDateInRange(referenceDate, startDate, endDate);
}

/**
 * Formats an offer's validity period.
 *
 * @param {object} offer Offer containing validity dates.
 * @returns {string} Formatted validity period.
 */
export function formatDateRange(offer) {
  if (!offer) {
    return '';
  }

  const startDate = offer.startDate ? formatDate(offer.startDate) : '';
  const endDate = offer.endDate || offer.expiresAt
    ? formatDate(offer.endDate || offer.expiresAt)
    : '';

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate || endDate;
}

export const formatTransactionDate = getRelativeDateLabel;
export const getTransactionDateLabel = getRelativeDateLabel;
export const isDateWithinRange = isDateInRange;
export const isOfferActive = isOfferValid;
export const formatPHP = formatCurrency;

const dateUtils = Object.freeze({
  parseDate,
  getReferenceDate,
  isValidDate,
  formatDate,
  formatLongDate,
  formatDateTime,
  formatISODate,
  formatCurrency,
  getRelativeDateLabel,
  getDateDifference,
  isDateInRange,
  isOfferValid,
  formatDateRange,
  formatTransactionDate,
  getTransactionDateLabel,
  isDateWithinRange,
  isOfferActive,
  formatPHP,
});

export default dateUtils;