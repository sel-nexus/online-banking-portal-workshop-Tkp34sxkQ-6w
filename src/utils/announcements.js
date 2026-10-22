const DEFAULT_MESSAGES = Object.freeze({
  validation: 'Please check the highlighted fields.',
  loading: 'Loading.',
  success: 'Your request was completed successfully.',
  error: 'Something went wrong. Please try again.',
  filter: 'The results have been updated.',
  session: 'Your session state has changed.',
});

const LIVE_REGION_ATTRIBUTES = Object.freeze({
  polite: Object.freeze({
    'aria-live': 'polite',
    role: 'status',
  }),
  assertive: Object.freeze({
    'aria-live': 'assertive',
    role: 'alert',
  }),
});

const REGION_ATTRIBUTE = 'data-announcement-live-region';
const REGION_CLASS_NAME = 'sr-only';
const DEFAULT_CLEAR_DELAY = 1000;

const regionState = new Map();

function getDocument(documentOverride) {
  if (
    documentOverride &&
    typeof documentOverride.createElement === 'function'
  ) {
    return documentOverride;
  }

  if (typeof globalThis !== 'undefined' && globalThis.document) {
    return globalThis.document;
  }

  return null;
}

function normalizeMessage(message) {
  if (message === null || message === undefined) {
    return '';
  }

  return String(message).trim();
}

function normalizePoliteness(value) {
  return value === 'assertive' ? 'assertive' : 'polite';
}

function normalizeClearDelay(value) {
  if (value === false || value === null) {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return DEFAULT_CLEAR_DELAY;
  }

  return numericValue;
}

function getRegionKey(politeness) {
  return normalizePoliteness(politeness);
}

function findRegion(documentObject, politeness) {
  if (typeof documentObject.querySelector !== 'function') {
    return null;
  }

  const selector = `[${REGION_ATTRIBUTE}="${politeness}"]`;

  return documentObject.querySelector(selector);
}

function configureRegion(region, politeness) {
  region.className = REGION_CLASS_NAME;
  region.setAttribute(REGION_ATTRIBUTE, politeness);
  region.setAttribute('aria-live', LIVE_REGION_ATTRIBUTES[politeness]['aria-live']);
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', LIVE_REGION_ATTRIBUTES[politeness].role);
  region.setAttribute('aria-relevant', 'additions text');

  return region;
}

/**
 * Creates or retrieves a live region for assistive technology announcements.
 *
 * @param {object} options Live-region options.
 * @param {Document} options.document Document implementation for testing.
 * @param {'polite'|'assertive'} options.politeness Announcement urgency.
 * @returns {HTMLElement|null} Live region, when a document is available.
 */
export function getAnnouncementRegion(options = {}) {
  const documentObject = getDocument(options.document);
  const politeness = normalizePoliteness(options.politeness);

  if (!documentObject) {
    return null;
  }

  const key = getRegionKey(politeness);
  const existingRegion = regionState.get(key);

  if (existingRegion && existingRegion.ownerDocument === documentObject) {
    return existingRegion;
  }

  const documentRegion = findRegion(documentObject, politeness);

  if (documentRegion) {
    const configuredRegion = configureRegion(documentRegion, politeness);
    regionState.set(key, configuredRegion);
    return configuredRegion;
  }

  if (!documentObject.body || typeof documentObject.body.appendChild !== 'function') {
    return null;
  }

  const region = configureRegion(
    documentObject.createElement('div'),
    politeness,
  );

  documentObject.body.appendChild(region);
  regionState.set(key, region);

  return region;
}

/**
 * Clears an announcement from a live region.
 *
 * @param {object} options Announcement options.
 * @param {Document} options.document Document implementation for testing.
 * @param {'polite'|'assertive'} options.politeness Announcement urgency.
 * @returns {boolean} Whether a live region was cleared.
 */
export function clearAnnouncement(options = {}) {
  const region = getAnnouncementRegion(options);

  if (!region) {
    return false;
  }

  const state = regionState.get(getRegionKey(options.politeness));

  if (state?.timerId !== undefined) {
    clearTimeout(state.timerId);
    state.timerId = undefined;
  }

  region.textContent = '';
  return true;
}

/**
 * Announces a message through an accessible live region.
 *
 * @param {string} message Message to announce.
 * @param {object} options Announcement options.
 * @param {Document} options.document Document implementation for testing.
 * @param {'polite'|'assertive'} options.politeness Announcement urgency.
 * @param {number|false|null} options.clearAfter Milliseconds before clearing.
 * @returns {boolean} Whether the message was announced.
 */
export function announce(message, options = {}) {
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return clearAnnouncement(options);
  }

  const region = getAnnouncementRegion(options);

  if (!region) {
    return false;
  }

  const key = getRegionKey(options.politeness);
  const state = regionState.get(key) || { timerId: undefined };

  if (state.timerId !== undefined) {
    clearTimeout(state.timerId);
    state.timerId = undefined;
  }

  region.textContent = '';
  region.textContent = normalizedMessage;

  const clearAfter = normalizeClearDelay(options.clearAfter);

  if (clearAfter !== null) {
    state.timerId = setTimeout(() => {
      if (region.textContent === normalizedMessage) {
        region.textContent = '';
      }

      state.timerId = undefined;
    }, clearAfter);
  }

  regionState.set(key, state);
  return true;
}

/**
 * Announces a validation message.
 *
 * @param {string} message Validation message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceValidation(
  message = DEFAULT_MESSAGES.validation,
  options = {},
) {
  return announce(message, options);
}

/**
 * Announces a loading state.
 *
 * @param {string} message Loading message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceLoading(
  message = DEFAULT_MESSAGES.loading,
  options = {},
) {
  return announce(message, options);
}

/**
 * Announces a successful operation.
 *
 * @param {string} message Success message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceSuccess(
  message = DEFAULT_MESSAGES.success,
  options = {},
) {
  return announce(message, options);
}

/**
 * Announces an error state.
 *
 * @param {string} message Error message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceError(
  message = DEFAULT_MESSAGES.error,
  options = {},
) {
  return announce(message, {
    ...options,
    politeness: options.politeness || 'assertive',
  });
}

/**
 * Announces that filtered results have changed.
 *
 * @param {string} message Filter message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceFilter(
  message = DEFAULT_MESSAGES.filter,
  options = {},
) {
  return announce(message, options);
}

/**
 * Announces a session-state change.
 *
 * @param {string} message Session-state message.
 * @param {object} options Announcement options.
 * @returns {boolean} Whether the message was announced.
 */
export function announceSessionState(
  message = DEFAULT_MESSAGES.session,
  options = {},
) {
  return announce(message, {
    ...options,
    politeness: options.politeness || 'assertive',
  });
}

/**
 * Removes announcement live regions from the document.
 *
 * @param {Document} documentOverride Document implementation for testing.
 * @returns {boolean} Whether at least one region was removed.
 */
export function destroyAnnouncementRegions(documentOverride) {
  const documentObject = getDocument(documentOverride);
  let removed = false;

  regionState.forEach((region, key) => {
    if (!documentObject || region.ownerDocument === documentObject) {
      if (region.parentNode && typeof region.parentNode.removeChild === 'function') {
        region.parentNode.removeChild(region);
        removed = true;
      }

      regionState.delete(key);
    }
  });

  return removed;
}

export const announceValidationError = announceValidation;
export const announceLoadingState = announceLoading;
export const announceSuccessMessage = announceSuccess;
export const announceErrorMessage = announceError;
export const announceFilterChange = announceFilter;
export const announceSessionChange = announceSessionState;

export const ANNOUNCEMENT_MESSAGES = DEFAULT_MESSAGES;

const announcements = Object.freeze({
  announce,
  clearAnnouncement,
  getAnnouncementRegion,
  destroyAnnouncementRegions,
  announceValidation,
  announceValidationError,
  announceLoading,
  announceLoadingState,
  announceSuccess,
  announceSuccessMessage,
  announceError,
  announceErrorMessage,
  announceFilter,
  announceFilterChange,
  announceSessionState,
  announceSessionChange,
  ANNOUNCEMENT_MESSAGES,
});

export default announcements;