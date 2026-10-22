import DemoStore from '../store/DemoStore';
import { redactForAnalytics } from '../utils/redaction';

const ANALYTICS_STORE_KEY = 'analytics-events';
const ANALYTICS_RETRIEVAL_ERROR_CODE = 'ANALYTICS_RETRIEVAL_FAILED';
const INVALID_ANALYTICS_EVENT_ERROR_CODE = 'INVALID_ANALYTICS_EVENT';
const INVALID_ANALYTICS_PROPERTIES_ERROR_CODE =
  'INVALID_ANALYTICS_PROPERTIES';

const DEFAULT_MAX_EVENTS = 100;
const DEFAULT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PROPERTY_DEPTH = 4;
const MAX_STRING_LENGTH = 500;

const ALLOWED_EVENT_NAMES = Object.freeze([
  'app_opened',
  'page_view',
  'screen_view',
  'login_started',
  'login_succeeded',
  'login_failed',
  'logout',
  'session_expired',
  'account_viewed',
  'account_selected',
  'accounts_viewed',
  'transaction_viewed',
  'transactions_viewed',
  'statement_generated',
  'statement_downloaded',
  'transfer_started',
  'transfer_reviewed',
  'transfer_completed',
  'transfer_failed',
  'payment_started',
  'payment_reviewed',
  'payment_scheduled',
  'payment_completed',
  'payment_failed',
  'profile_viewed',
  'profile_updated',
  'notification_viewed',
  'notification_read',
  'notifications_marked_read',
  'support_viewed',
  'faq_viewed',
  'chat_opened',
  'chat_closed',
  'chat_message_sent',
  'support_escalation_requested',
  'offer_viewed',
  'offer_interest_confirmed',
  'product_viewed',
  'product_application_confirmed',
]);

const ALLOWED_EVENT_NAME_SET = new Set(ALLOWED_EVENT_NAMES);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeEventName(value) {
  return normalizeText(value)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function normalizeLimit(value, fallback = DEFAULT_MAX_EVENTS) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return fallback;
  }

  return Math.min(DEFAULT_MAX_EVENTS, Math.floor(numericValue));
}

function normalizeRetention(value, fallback = DEFAULT_RETENTION_MS) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return numericValue;
}

function createAnalyticsError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function truncateString(value) {
  return value.length > MAX_STRING_LENGTH
    ? value.slice(0, MAX_STRING_LENGTH)
    : value;
}

function cloneSafeValue(value, depth = 0) {
  if (depth > MAX_PROPERTY_DEPTH) {
    return undefined;
  }

  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => cloneSafeValue(item, depth + 1))
      .filter((item) => item !== undefined)
      .slice(0, 50);
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const result = {};

  Object.entries(value).forEach(([key, childValue]) => {
    const safeValue = cloneSafeValue(childValue, depth + 1);

    if (safeValue !== undefined) {
      result[key] = safeValue;
    }
  });

  return result;
}

function sanitizeProperties(properties) {
  if (properties === undefined || properties === null) {
    return {};
  }

  if (!isRecord(properties)) {
    throw createAnalyticsError(
      'Analytics properties must be an object.',
      INVALID_ANALYTICS_PROPERTIES_ERROR_CODE,
    );
  }

  const redactedProperties = redactForAnalytics(properties);
  const safeProperties = cloneSafeValue(redactedProperties);

  return isRecord(safeProperties) ? safeProperties : {};
}

function getEventTimestamp(event) {
  const timestamp = new Date(event?.timestamp || event?.createdAt || '');

  return Number.isNaN(timestamp.getTime()) ? null : timestamp.getTime();
}

function cloneEvents(events) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => isRecord(event))
    .map((event) => ({
      ...event,
      properties: sanitizeProperties(event.properties),
    }));
}

function readPersistedEvents() {
  const persisted = DemoStore.get(ANALYTICS_STORE_KEY, null);

  if (Array.isArray(persisted)) {
    return persisted;
  }

  if (Array.isArray(persisted?.items)) {
    return persisted.items;
  }

  return [];
}

function pruneEvents(events, options = {}) {
  const now = Number(options.now) || Date.now();
  const retentionMs = normalizeRetention(options.retentionMs);
  const maxEvents = normalizeLimit(options.maxEvents);

  return cloneEvents(events)
    .filter((event) => {
      const timestamp = getEventTimestamp(event);

      return (
        timestamp === null ||
        retentionMs === 0 ||
        now - timestamp <= retentionMs
      );
    })
    .sort((first, second) => {
      const firstTimestamp = getEventTimestamp(first) || 0;
      const secondTimestamp = getEventTimestamp(second) || 0;

      return firstTimestamp - secondTimestamp;
    })
    .slice(-maxEvents);
}

function persistEvents(events, options = {}) {
  if (options.persist === false) {
    return false;
  }

  return DemoStore.set(ANALYTICS_STORE_KEY, pruneEvents(events, options));
}

function getSourceEvents(options = {}) {
  if (Array.isArray(options.events)) {
    return options.events;
  }

  if (Array.isArray(options.state?.analytics?.events)) {
    return options.state.analytics.events;
  }

  return readPersistedEvents();
}

function dispatchAnalyticsAction(options, type, payload = {}) {
  if (typeof options.dispatch === 'function') {
    options.dispatch({
      type,
      payload,
    });
  }
}

function assertAllowedEventName(eventName) {
  const normalizedEventName = normalizeEventName(eventName);

  if (!ALLOWED_EVENT_NAME_SET.has(normalizedEventName)) {
    throw createAnalyticsError(
      `The analytics event "${normalizedEventName || 'unknown'}" is not allowed.`,
      INVALID_ANALYTICS_EVENT_ERROR_CODE,
      {
        eventName: normalizedEventName,
        allowedEventNames: [...ALLOWED_EVENT_NAMES],
      },
    );
  }

  return normalizedEventName;
}

function normalizeTrackArguments(eventOrName, properties, options) {
  if (isRecord(eventOrName)) {
    return {
      eventName:
        eventOrName.eventName ||
        eventOrName.event ||
        eventOrName.name ||
        '',
      properties: eventOrName.properties || {},
      options: isRecord(properties) ? properties : {},
    };
  }

  return {
    eventName: eventOrName,
    properties,
    options: isRecord(options) ? options : {},
  };
}

/**
 * Records an allow-listed, privacy-safe synthetic analytics event.
 *
 * No network request is made. Events are retained locally only when
 * persistence is enabled.
 *
 * @param {string|object} eventOrName Event name or event descriptor.
 * @param {object} properties Safe event properties.
 * @param {object} options Tracking options.
 * @returns {object} Recorded analytics event.
 */
export function trackEvent(eventOrName, properties = {}, options = {}) {
  const normalizedArguments = normalizeTrackArguments(
    eventOrName,
    properties,
    options,
  );
  const eventName = assertAllowedEventName(normalizedArguments.eventName);
  const trackOptions = normalizedArguments.options;
  const timestamp = trackOptions.timestamp || new Date().toISOString();
  const safeProperties = sanitizeProperties(normalizedArguments.properties);
  const event = {
    id:
      trackOptions.id ||
      `demo-analytics-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event: eventName,
    eventName,
    properties: safeProperties,
    timestamp,
    simulated: true,
  };
  const events = pruneEvents(
    [...getSourceEvents(trackOptions), event],
    trackOptions,
  );

  persistEvents(events, trackOptions);
  dispatchAnalyticsAction(trackOptions, 'analytics/track', event);

  return event;
}

/**
 * Lists retained synthetic analytics events.
 *
 * @param {object} options Listing options.
 * @returns {object[]} Privacy-safe retained events.
 */
export function listEvents(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};
  const events = pruneEvents(getSourceEvents(normalizedOptions), normalizedOptions);

  if (normalizedOptions.persist !== false) {
    persistEvents(events, normalizedOptions);
  }

  return events;
}

/**
 * Clears locally retained synthetic analytics events.
 *
 * @param {object} options Clear options.
 * @returns {object} Clear result.
 */
export function clearEvents(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};
  const previousEvents = listEvents({
    ...normalizedOptions,
    persist: false,
  });

  if (normalizedOptions.persist !== false) {
    DemoStore.remove(ANALYTICS_STORE_KEY);
  }

  dispatchAnalyticsAction(normalizedOptions, 'analytics/clear', {
    clearedCount: previousEvents.length,
    simulated: true,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    clearedCount: previousEvents.length,
    items: [],
    events: [],
    simulated: true,
  };
}

/**
 * Returns analytics data with retention metadata.
 *
 * @param {object} options Query options.
 * @returns {object} Analytics query result.
 */
export function queryEvents(options = {}) {
  const events = listEvents(options);

  return {
    items: events,
    events,
    total: events.length,
    maxEvents: normalizeLimit(options.maxEvents),
    retentionMs: normalizeRetention(options.retentionMs),
    status: 'ready',
    error: null,
  };
}

/**
 * Retrieves locally retained analytics events through the synthetic service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Analytics query result.
 */
export async function retrieveEvents(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};

  try {
    if (
      normalizedOptions.simulateFailure === true ||
      normalizedOptions.shouldFail === true ||
      normalizedOptions.fail === true
    ) {
      throw createAnalyticsError(
        'We could not load local analytics events.',
        ANALYTICS_RETRIEVAL_ERROR_CODE,
        { retryable: true },
      );
    }

    return queryEvents(normalizedOptions);
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createAnalyticsError(
      'We could not load local analytics events.',
      ANALYTICS_RETRIEVAL_ERROR_CODE,
      { cause: error, retryable: true },
    );
  }
}

export const track = trackEvent;
export const recordEvent = trackEvent;
export const logEvent = trackEvent;
export const getEvents = listEvents;
export const fetchEvents = retrieveEvents;
export const clear = clearEvents;
export const clearAnalytics = clearEvents;
export const resetAnalytics = clearEvents;

export const ANALYTICS_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: ANALYTICS_RETRIEVAL_ERROR_CODE,
  INVALID_EVENT: INVALID_ANALYTICS_EVENT_ERROR_CODE,
  INVALID_PROPERTIES: INVALID_ANALYTICS_PROPERTIES_ERROR_CODE,
});

const analyticsService = Object.freeze({
  ANALYTICS_STORE_KEY,
  ALLOWED_EVENT_NAMES,
  ANALYTICS_SERVICE_ERROR_CODES,
  trackEvent,
  track,
  recordEvent,
  logEvent,
  listEvents,
  getEvents,
  queryEvents,
  retrieveEvents,
  fetchEvents,
  clearEvents,
  clear,
  clearAnalytics,
  resetAnalytics,
});

export {
  ANALYTICS_STORE_KEY,
  ANALYTICS_RETRIEVAL_ERROR_CODE,
  INVALID_ANALYTICS_EVENT_ERROR_CODE,
  INVALID_ANALYTICS_PROPERTIES_ERROR_CODE,
};

export default analyticsService;