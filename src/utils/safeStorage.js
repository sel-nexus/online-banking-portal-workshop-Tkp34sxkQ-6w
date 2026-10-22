import { STORAGE_NAMESPACE, STORAGE_VERSION } from '../config/constants';

const DEFAULT_VERSION = STORAGE_VERSION;
const DEFAULT_NAMESPACE = STORAGE_NAMESPACE;

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function isStorageLike(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.getItem === 'function' &&
    typeof value.setItem === 'function' &&
    typeof value.removeItem === 'function'
  );
}

function getDefaultStorage() {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    const storage = globalThis['localStorage'];

    return isStorageLike(storage) ? storage : null;
  } catch {
    return null;
  }
}

function normalizeOptions(options) {
  if (isStorageLike(options)) {
    return { storage: options };
  }

  return isObject(options) ? options : {};
}

function normalizeVersion(version) {
  return version === undefined || version === null || version === ''
    ? DEFAULT_VERSION
    : String(version);
}

function normalizeNamespace(namespace) {
  if (namespace === false || namespace === null || namespace === '') {
    return '';
  }

  return String(namespace ?? DEFAULT_NAMESPACE);
}

function normalizeKey(key, namespace = DEFAULT_NAMESPACE) {
  const normalizedKey = String(key ?? '').trim();

  if (!normalizedKey) {
    return '';
  }

  const normalizedNamespace = normalizeNamespace(namespace);

  return normalizedNamespace
    ? `${normalizedNamespace}:${normalizedKey}`
    : normalizedKey;
}

function resolveStorage(options = {}) {
  const normalizedOptions = normalizeOptions(options);

  return normalizedOptions.storage || getDefaultStorage();
}

/**
 * Checks whether a storage implementation can be safely used.
 *
 * @param {object|null} storage Storage-like implementation.
 * @returns {boolean} Whether storage is available.
 */
export function isStorageAvailable(storage = getDefaultStorage()) {
  if (!isStorageLike(storage)) {
    return false;
  }

  try {
    const testKey = `__safe_storage_test_${Date.now()}_${Math.random()}`;
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses JSON without allowing malformed input to throw.
 *
 * @param {string} value JSON string.
 * @param {*} fallback Value returned when parsing fails.
 * @returns {*} Parsed value or fallback.
 */
export function safeParseJSON(value, fallback = null) {
  if (typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Serializes a value as JSON without allowing serialization errors to throw.
 *
 * @param {*} value Value to serialize.
 * @param {string|null} fallback Value returned when serialization fails.
 * @returns {string|null} JSON string or fallback.
 */
export function safeStringifyJSON(value, fallback = null) {
  try {
    const serialized = JSON.stringify(value);

    return serialized === undefined ? fallback : serialized;
  } catch {
    return fallback;
  }
}

/**
 * Creates a versioned storage envelope.
 *
 * @param {*} value Value to wrap.
 * @param {string|number} version Schema version.
 * @returns {{version: string, value: *}} Versioned value.
 */
export function createVersionedValue(value, version = DEFAULT_VERSION) {
  return {
    version: normalizeVersion(version),
    value,
  };
}

/**
 * Reads a value from a versioned storage envelope.
 *
 * @param {*} value Parsed storage value.
 * @param {*} fallback Fallback value.
 * @param {object} options Version and migration options.
 * @returns {*} Unwrapped value or fallback.
 */
export function readVersionedValue(value, fallback = null, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const expectedVersion = normalizeVersion(
    normalizedOptions.version ?? DEFAULT_VERSION,
  );

  if (!isObject(value) || value.version === undefined) {
    return normalizedOptions.allowUnversioned === true ? value : fallback;
  }

  const actualVersion = normalizeVersion(value.version);

  if (actualVersion === expectedVersion) {
    return Object.prototype.hasOwnProperty.call(value, 'value')
      ? value.value
      : fallback;
  }

  if (typeof normalizedOptions.migrate === 'function') {
    try {
      const migrated = normalizedOptions.migrate(
        value.value,
        actualVersion,
        expectedVersion,
      );
      return migrated === undefined ? fallback : migrated;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Builds a namespaced storage key.
 *
 * @param {string|number} key Storage key.
 * @param {string|false|null} namespace Key namespace.
 * @returns {string} Namespaced key.
 */
export function getStorageKey(key, namespace = DEFAULT_NAMESPACE) {
  return normalizeKey(key, namespace);
}

/**
 * Retrieves and parses a JSON value from storage.
 *
 * @param {string|number} key Storage key.
 * @param {*} fallback Fallback value.
 * @param {object} options Storage and parsing options.
 * @returns {*} Stored value or fallback.
 */
export function safeGetItem(key, fallback = null, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const storage = resolveStorage(normalizedOptions);
  const storageKey = normalizeKey(
    key,
    normalizedOptions.namespace ?? DEFAULT_NAMESPACE,
  );

  if (!storageKey || !isStorageAvailable(storage)) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(storageKey);
    const parsedValue = safeParseJSON(rawValue, fallback);

    if (normalizedOptions.versioned === false) {
      return parsedValue;
    }

    return readVersionedValue(parsedValue, fallback, normalizedOptions);
  } catch {
    return fallback;
  }
}

/**
 * Stores a JSON value safely.
 *
 * @param {string|number} key Storage key.
 * @param {*} value Value to store.
 * @param {object} options Storage and serialization options.
 * @returns {boolean} Whether the value was stored.
 */
export function safeSetItem(key, value, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const storage = resolveStorage(normalizedOptions);
  const storageKey = normalizeKey(
    key,
    normalizedOptions.namespace ?? DEFAULT_NAMESPACE,
  );

  if (!storageKey || !isStorageAvailable(storage)) {
    return false;
  }

  const valueToStore =
    normalizedOptions.versioned === false
      ? value
      : createVersionedValue(
          value,
          normalizedOptions.version ?? DEFAULT_VERSION,
        );
  const serializedValue = safeStringifyJSON(valueToStore, null);

  if (serializedValue === null) {
    return false;
  }

  try {
    storage.setItem(storageKey, serializedValue);
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a value from storage safely.
 *
 * @param {string|number} key Storage key.
 * @param {object} options Storage options.
 * @returns {boolean} Whether removal succeeded.
 */
export function safeRemoveItem(key, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const storage = resolveStorage(normalizedOptions);
  const storageKey = normalizeKey(
    key,
    normalizedOptions.namespace ?? DEFAULT_NAMESPACE,
  );

  if (!storageKey || !isStorageLike(storage)) {
    return false;
  }

  try {
    storage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all keys belonging to a namespace.
 *
 * @param {object} options Storage and namespace options.
 * @returns {boolean} Whether clearing completed.
 */
export function safeClear(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const storage = resolveStorage(normalizedOptions);
  const namespace = normalizeNamespace(
    normalizedOptions.namespace ?? DEFAULT_NAMESPACE,
  );

  if (!isStorageLike(storage)) {
    return false;
  }

  try {
    const keysToRemove = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (
        key &&
        (!namespace || key === namespace || key.startsWith(`${namespace}:`))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

export const parseJSON = safeParseJSON;
export const stringifyJSON = safeStringifyJSON;
export const safeGet = safeGetItem;
export const safeSet = safeSetItem;
export const safeRemove = safeRemoveItem;
export const getStoredValue = safeGetItem;
export const setStoredValue = safeSetItem;
export const removeStoredValue = safeRemoveItem;
export const isAvailable = isStorageAvailable;

const safeStorage = Object.freeze({
  isStorageAvailable,
  safeParseJSON,
  safeStringifyJSON,
  createVersionedValue,
  readVersionedValue,
  getStorageKey,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeClear,
  getItem: safeGetItem,
  setItem: safeSetItem,
  removeItem: safeRemoveItem,
  clear: safeClear,
  parseJSON,
  stringifyJSON,
  safeGet,
  safeSet,
  safeRemove,
  getStoredValue,
  setStoredValue,
  removeStoredValue,
  isAvailable,
});

export default safeStorage;