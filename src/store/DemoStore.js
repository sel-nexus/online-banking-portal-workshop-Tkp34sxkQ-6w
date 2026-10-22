import {
  STORAGE_NAMESPACE,
  STORAGE_VERSION,
} from '../config/constants';
import {
  createVersionedValue,
  getStorageKey,
  readVersionedValue,
  safeClear,
  safeGetItem,
  safeParseJSON,
  safeRemoveItem,
  safeSetItem,
} from '../utils/safeStorage';

const STORE_NAMESPACE = STORAGE_NAMESPACE;
const STORE_VERSION = STORAGE_VERSION;
const RESET_MARKER_KEY = '__demo_store_reset_marker__';
const RESET_MARKER_VALUE = 'demo-store-reset';

const subscribers = new Set();
const knownKeys = new Set();
const migrations = new Map();

let storageListenerAttached = false;

function normalizeKey(key) {
  const normalizedKey = String(key ?? '').trim();

  if (!normalizedKey || normalizedKey === RESET_MARKER_KEY) {
    return '';
  }

  return normalizedKey;
}

function getGlobalEventTarget() {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.addEventListener === 'function'
  ) {
    return globalThis;
  }

  return null;
}

function notify(change) {
  subscribers.forEach((listener) => {
    try {
      listener(change);
    } catch {
      // Subscribers must not prevent other store listeners from being notified.
    }
  });
}

function getMigration(fromVersion, toVersion) {
  return migrations.get(`${String(fromVersion)}:${String(toVersion)}`);
}

function migrateValue(value, fromVersion, toVersion) {
  let migratedValue = value;
  let currentVersion = String(fromVersion);
  const targetVersion = String(toVersion);
  const visitedVersions = new Set();

  while (currentVersion !== targetVersion) {
    if (visitedVersions.has(currentVersion)) {
      return undefined;
    }

    visitedVersions.add(currentVersion);

    const directMigration = getMigration(currentVersion, targetVersion);

    if (directMigration) {
      return directMigration(migratedValue, currentVersion, targetVersion);
    }

    const nextMigration = Array.from(migrations.entries()).find(
      ([migrationKey]) => migrationKey.startsWith(`${currentVersion}:`),
    );

    if (!nextMigration) {
      return undefined;
    }

    const [, nextVersion] = nextMigration[0].split(':');
    const migration = nextMigration[1];

    migratedValue = migration(migratedValue, currentVersion, nextVersion);
    currentVersion = nextVersion;
  }

  return migratedValue;
}

function readStoredValue(rawValue, fallback) {
  const parsedValue = safeParseJSON(rawValue, undefined);

  if (parsedValue === undefined) {
    return fallback;
  }

  return readVersionedValue(parsedValue, fallback, {
    version: STORE_VERSION,
    migrate: (value, fromVersion, toVersion) =>
      migrateValue(value, fromVersion, toVersion),
  });
}

function handleStorageEvent(event) {
  if (!event || event.storageArea && event.storageArea !== globalThis.localStorage) {
    return;
  }

  if (event.key === null) {
    notify({
      type: 'reset',
      key: null,
      value: undefined,
      source: 'storage',
    });
    return;
  }

  const namespacePrefix = `${STORE_NAMESPACE}:`;

  if (!event.key.startsWith(namespacePrefix)) {
    return;
  }

  const key = event.key.slice(namespacePrefix.length);

  if (!key || key === RESET_MARKER_KEY) {
    notify({
      type: 'reset-marker',
      key: RESET_MARKER_KEY,
      value: readStoredValue(event.newValue, null),
      source: 'storage',
    });
    return;
  }

  notify({
    type: event.newValue === null ? 'remove' : 'set',
    key,
    value: event.newValue === null
      ? undefined
      : readStoredValue(event.newValue, undefined),
    source: 'storage',
  });
}

function attachStorageListener() {
  if (storageListenerAttached) {
    return;
  }

  const eventTarget = getGlobalEventTarget();

  if (!eventTarget) {
    return;
  }

  eventTarget.addEventListener('storage', handleStorageEvent);
  storageListenerAttached = true;
}

function detachStorageListener() {
  if (!storageListenerAttached || subscribers.size > 0) {
    return;
  }

  const eventTarget = getGlobalEventTarget();

  if (eventTarget) {
    eventTarget.removeEventListener('storage', handleStorageEvent);
  }

  storageListenerAttached = false;
}

/**
 * Retrieves a persisted demo value.
 *
 * @param {string} key Storage key.
 * @param {*} fallback Value returned when the key is unavailable.
 * @returns {*} Persisted value or fallback.
 */
export function get(key, fallback = null) {
  const normalizedKey = normalizeKey(key);

  if (!normalizedKey) {
    return fallback;
  }

  knownKeys.add(normalizedKey);

  return safeGetItem(normalizedKey, fallback, {
    namespace: STORE_NAMESPACE,
    version: STORE_VERSION,
    migrate: (value, fromVersion, toVersion) =>
      migrateValue(value, fromVersion, toVersion),
  });
}

/**
 * Persists a demo value.
 *
 * @param {string} key Storage key.
 * @param {*} value Value to persist.
 * @returns {boolean} Whether the value was stored.
 */
export function set(key, value) {
  const normalizedKey = normalizeKey(key);

  if (!normalizedKey) {
    return false;
  }

  const stored = safeSetItem(normalizedKey, value, {
    namespace: STORE_NAMESPACE,
    version: STORE_VERSION,
  });

  if (stored) {
    knownKeys.add(normalizedKey);
    notify({
      type: 'set',
      key: normalizedKey,
      value,
      source: 'local',
    });
  }

  return stored;
}

/**
 * Removes a persisted demo value.
 *
 * @param {string} key Storage key.
 * @returns {boolean} Whether removal completed.
 */
export function remove(key) {
  const normalizedKey = normalizeKey(key);

  if (!normalizedKey) {
    return false;
  }

  const removed = safeRemoveItem(normalizedKey, {
    namespace: STORE_NAMESPACE,
  });

  if (removed) {
    knownKeys.delete(normalizedKey);
    notify({
      type: 'remove',
      key: normalizedKey,
      value: undefined,
      source: 'local',
    });
  }

  return removed;
}

/**
 * Returns the persisted reset marker.
 *
 * @returns {*} Reset marker value, or null when no marker exists.
 */
export function getResetMarker() {
  return safeGetItem(RESET_MARKER_KEY, null, {
    namespace: STORE_NAMESPACE,
    version: STORE_VERSION,
    migrate: (value, fromVersion, toVersion) =>
      migrateValue(value, fromVersion, toVersion),
  });
}

/**
 * Resets all persisted demo state and writes a reset marker.
 *
 * @returns {boolean} Whether the reset completed.
 */
export function reset() {
  const cleared = safeClear({
    namespace: STORE_NAMESPACE,
  });

  const markerStored = safeSetItem(
    RESET_MARKER_KEY,
    {
      marker: RESET_MARKER_VALUE,
      resetAt: new Date().toISOString(),
    },
    {
      namespace: STORE_NAMESPACE,
      version: STORE_VERSION,
    },
  );

  knownKeys.clear();

  notify({
    type: 'reset',
    key: null,
    value: undefined,
    source: 'local',
  });

  return cleared && markerStored;
}

/**
 * Registers a migration between two store versions.
 *
 * @param {string|number} fromVersion Source version.
 * @param {string|number} toVersion Destination version.
 * @param {Function} migration Migration function.
 * @returns {Function} Removes the registered migration.
 */
export function registerMigration(fromVersion, toVersion, migration) {
  if (typeof migration !== 'function') {
    throw new TypeError('A demo store migration must be a function.');
  }

  const migrationKey = `${String(fromVersion)}:${String(toVersion)}`;
  migrations.set(migrationKey, migration);

  return () => {
    migrations.delete(migrationKey);
  };
}

/**
 * Subscribes to local and cross-tab store changes.
 *
 * @param {Function} listener Store change listener.
 * @returns {Function} Unsubscribe function.
 */
export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('A demo store subscriber must be a function.');
  }

  subscribers.add(listener);
  attachStorageListener();

  return () => {
    subscribers.delete(listener);
    detachStorageListener();
  };
}

/**
 * Returns the namespaced storage key for a demo value.
 *
 * @param {string} key Storage key.
 * @returns {string} Namespaced storage key.
 */
export function getKey(key) {
  const normalizedKey = normalizeKey(key);

  return normalizedKey ? getStorageKey(normalizedKey, STORE_NAMESPACE) : '';
}

/**
 * Removes the persisted reset marker.
 *
 * @returns {boolean} Whether the marker was removed.
 */
export function clearResetMarker() {
  const removed = safeRemoveItem(RESET_MARKER_KEY, {
    namespace: STORE_NAMESPACE,
  });

  if (removed) {
    notify({
      type: 'reset-marker-cleared',
      key: RESET_MARKER_KEY,
      value: undefined,
      source: 'local',
    });
  }

  return removed;
}

export const getItem = get;
export const setItem = set;
export const removeItem = remove;
export const resetStore = reset;
export const subscribeToStore = subscribe;
export const migrate = registerMigration;
export const STORAGE_KEY_PREFIX = `${STORE_NAMESPACE}:`;
export { STORE_NAMESPACE, STORE_VERSION, RESET_MARKER_KEY, RESET_MARKER_VALUE };

const DemoStore = Object.freeze({
  get,
  set,
  remove,
  reset,
  subscribe,
  registerMigration,
  migrate,
  getKey,
  getResetMarker,
  clearResetMarker,
  getItem,
  setItem,
  removeItem,
  resetStore,
  subscribeToStore,
  STORE_NAMESPACE,
  STORE_VERSION,
  RESET_MARKER_KEY,
  RESET_MARKER_VALUE,
  STORAGE_KEY_PREFIX,
});

export default DemoStore;