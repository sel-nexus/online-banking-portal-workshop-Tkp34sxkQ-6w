import { NOTIFICATIONS } from '../fixtures/notifications';
import { getProfileNotifications } from './ProfileService';
import DemoStore from '../store/DemoStore';
import { simulateLoading } from '../utils/asyncUtils';

const NOTIFICATION_STORE_KEY = 'notifications';
const NOTIFICATION_RETRIEVAL_ERROR_CODE = 'NOTIFICATION_RETRIEVAL_FAILED';
const NOTIFICATION_NOT_FOUND_ERROR_CODE = 'NOTIFICATION_NOT_FOUND';
const INVALID_NOTIFICATION_ACTION_ERROR_CODE =
  'INVALID_NOTIFICATION_ACTION';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIdentifier(value) {
  return normalizeText(value).toLowerCase();
}

function createNotificationError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getNotificationIdentifier(notification) {
  if (isRecord(notification)) {
    return notification.id || notification.notificationId || null;
  }

  return notification ?? null;
}

function isUnread(notification) {
  return notification?.read !== true && notification?.isRead !== true;
}

function cloneNotification(notification) {
  if (!isRecord(notification)) {
    return null;
  }

  return {
    ...notification,
    id: notification.id || notification.notificationId || null,
    notificationId: notification.notificationId || notification.id || null,
    read: notification.read === true || notification.isRead === true,
    isRead: notification.isRead === true || notification.read === true,
    status:
      notification.read === true || notification.isRead === true
        ? 'read'
        : notification.status || 'unread',
  };
}

function cloneNotifications(notifications) {
  return (Array.isArray(notifications) ? notifications : [])
    .map(cloneNotification)
    .filter(Boolean);
}

function getStateNotifications(state) {
  return Array.isArray(state?.notifications?.items)
    ? state.notifications.items
    : null;
}

function readPersistedNotifications() {
  const persisted = DemoStore.get(NOTIFICATION_STORE_KEY, null);

  if (Array.isArray(persisted)) {
    return persisted;
  }

  if (Array.isArray(persisted?.items)) {
    return persisted.items;
  }

  return null;
}

function getNotificationSource(options = {}) {
  if (Array.isArray(options.notifications)) {
    return options.notifications;
  }

  const stateNotifications = getStateNotifications(options.state);

  if (stateNotifications) {
    return stateNotifications;
  }

  if (options.usePersistence !== false) {
    const persistedNotifications = readPersistedNotifications();

    if (persistedNotifications) {
      return persistedNotifications;
    }
  }

  return getProfileNotifications(options.profileId, options.state);
}

function getVisibleNotifications(options = {}) {
  const source = getNotificationSource(options);
  const profileNotifications =
    Array.isArray(options.notifications) ||
    Array.isArray(getStateNotifications(options.state)) ||
    (options.usePersistence !== false && readPersistedNotifications())
      ? source
      : getProfileNotifications(options.profileId, {
          ...options.state,
          notifications: {
            ...(options.state?.notifications || {}),
            items: source,
          },
        });

  return cloneNotifications(profileNotifications).filter((notification) => {
    if (
      options.includeRead !== true &&
      options.unreadOnly === true &&
      !isUnread(notification)
    ) {
      return false;
    }

    if (
      options.includeInactive !== true &&
      ['inactive', 'closed'].includes(
        normalizeText(notification.status).toLowerCase(),
      )
    ) {
      return false;
    }

    return true;
  });
}

function persistNotifications(notifications, options = {}) {
  if (options.persist === false || options.usePersistence === false) {
    return false;
  }

  return DemoStore.set(
    NOTIFICATION_STORE_KEY,
    cloneNotifications(notifications),
  );
}

function dispatchNotificationAction(options, type, payload = {}) {
  if (typeof options.dispatch === 'function') {
    options.dispatch({
      type,
      payload,
    });
  }
}

function createNotificationResult(notifications, options = {}) {
  const items = cloneNotifications(notifications);
  const unreadCount = items.filter(isUnread).length;

  if (options.persist !== false && options.persistResult === true) {
    persistNotifications(items, options);
  }

  return {
    items,
    notifications: items,
    unreadCount,
    total: items.length,
    status: 'ready',
    error: null,
  };
}

/**
 * Lists synthetic notifications visible to the requested profile.
 *
 * @param {object} options Notification listing options.
 * @returns {object[]} Notification view models.
 */
export function listNotifications(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};
  const notifications = getVisibleNotifications(normalizedOptions);

  if (normalizedOptions.unreadOnly === true) {
    return notifications.filter(isUnread);
  }

  if (normalizedOptions.includeRead !== true) {
    return notifications;
  }

  return notifications;
}

/**
 * Returns notification listing data with unread metadata.
 *
 * @param {object} options Notification listing options.
 * @returns {object} Notification listing result.
 */
export function queryNotifications(options = {}) {
  return createNotificationResult(
    listNotifications({
      ...options,
      includeRead: true,
    }),
    options,
  );
}

/**
 * Gets a notification visible to the requested profile.
 *
 * @param {string|number|object} notificationOrId Notification identifier or notification.
 * @param {object} options Notification lookup options.
 * @returns {object|null} Matching notification, or null.
 */
export function getNotification(notificationOrId, options = {}) {
  const identifier = normalizeIdentifier(
    getNotificationIdentifier(notificationOrId),
  );

  if (!identifier) {
    return null;
  }

  return (
    listNotifications({
      ...options,
      includeRead: true,
    }).find(
      (notification) =>
        normalizeIdentifier(notification.id) === identifier ||
        normalizeIdentifier(notification.notificationId) === identifier,
    ) || null
  );
}

/**
 * Marks a notification as read and persists the local read state.
 *
 * @param {string|number|object} notificationOrId Notification identifier or notification.
 * @param {object} options Notification action options.
 * @returns {object} Updated notification.
 */
export function markNotificationRead(notificationOrId, options = {}) {
  const notification = getNotification(notificationOrId, options);

  if (!notification) {
    throw createNotificationError(
      'The notification could not be found.',
      NOTIFICATION_NOT_FOUND_ERROR_CODE,
    );
  }

  const readAt = options.readAt || new Date().toISOString();
  const identifier = normalizeIdentifier(getNotificationIdentifier(notification));
  const notifications = listNotifications({
    ...options,
    includeRead: true,
  }).map((item) => {
    const itemIdentifier = normalizeIdentifier(
      getNotificationIdentifier(item),
    );

    return itemIdentifier === identifier
      ? {
          ...item,
          read: true,
          isRead: true,
          status: 'read',
          readAt,
        }
      : item;
  });

  persistNotifications(notifications, options);
  dispatchNotificationAction(options, 'notifications/markRead', {
    id: notification.id,
    notificationId: notification.notificationId || notification.id,
    readAt,
  });

  return (
    notifications.find(
      (item) =>
        normalizeIdentifier(getNotificationIdentifier(item)) === identifier,
    ) || null
  );
}

/**
 * Marks every visible notification as read.
 *
 * @param {object} options Notification action options.
 * @returns {object} Updated notification listing result.
 */
export function markAllNotificationsRead(options = {}) {
  const readAt = options.readAt || new Date().toISOString();
  const notifications = listNotifications({
    ...options,
    includeRead: true,
  }).map((notification) => ({
    ...notification,
    read: true,
    isRead: true,
    status: 'read',
    readAt,
  }));

  persistNotifications(notifications, options);
  dispatchNotificationAction(options, 'notifications/markAllRead', {
    readAt,
  });

  return createNotificationResult(notifications, options);
}

/**
 * Resets notifications to the original synthetic fixture state.
 *
 * @param {object} options Notification reset options.
 * @returns {object} Reset notification listing result.
 */
export function resetNotifications(options = {}) {
  const fixtureNotifications = cloneNotifications(
    getProfileNotifications(options.profileId, options.state).length > 0
      ? getProfileNotifications(options.profileId, options.state)
      : NOTIFICATIONS,
  );

  if (options.persist !== false && options.usePersistence !== false) {
    DemoStore.remove(NOTIFICATION_STORE_KEY);
  }

  dispatchNotificationAction(options, 'notifications/set', {
    items: fixtureNotifications,
    notifications: fixtureNotifications,
    reset: true,
    timestamp: new Date().toISOString(),
  });

  return createNotificationResult(fixtureNotifications, {
    ...options,
    persistResult: false,
  });
}

/**
 * Returns the number of unread notifications.
 *
 * @param {object} options Notification listing options.
 * @returns {number} Unread notification count.
 */
export function getUnreadNotificationCount(options = {}) {
  return listNotifications({
    ...options,
    includeRead: true,
  }).filter(isUnread).length;
}

/**
 * Returns whether a notification is unread.
 *
 * @param {string|number|object} notificationOrId Notification identifier or notification.
 * @param {object} options Notification lookup options.
 * @returns {boolean} Whether the notification is unread.
 */
export function isNotificationUnread(notificationOrId, options = {}) {
  const notification = getNotification(notificationOrId, options);

  return Boolean(notification && isUnread(notification));
}

/**
 * Retrieves notifications through a simulated local service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Notification listing result.
 */
export async function retrieveNotifications(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};
  const retries = Number(
    normalizedOptions.maxRetries ?? normalizedOptions.retries,
  );
  const maxRetries =
    Number.isFinite(retries) && retries >= 0 ? Math.floor(retries) : 0;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (
        normalizedOptions.simulateFailure === true ||
        normalizedOptions.shouldFail === true ||
        normalizedOptions.fail === true
      ) {
        throw createNotificationError(
          'We could not load your notifications.',
          NOTIFICATION_RETRIEVAL_ERROR_CODE,
          {
            attempt: attempt + 1,
            retryable: true,
          },
        );
      }

      const result = await simulateLoading(
        () => queryNotifications(normalizedOptions),
        normalizedOptions,
      );

      return result;
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === NOTIFICATION_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createNotificationError(
          'We could not load your notifications.',
          NOTIFICATION_RETRIEVAL_ERROR_CODE,
          {
            cause: error,
            attempt: attempt + 1,
            retryable: true,
          },
        );
      }

      attempt += 1;
    }
  }

  throw createNotificationError(
    'We could not load your notifications.',
    NOTIFICATION_RETRIEVAL_ERROR_CODE,
    { retryable: true },
  );
}

/**
 * Retries simulated notification retrieval at least once.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Notification listing result.
 */
export function retryNotificationRetrieval(options = {}) {
  return retrieveNotifications({
    ...options,
    maxRetries: Math.max(
      1,
      Number(options.maxRetries ?? options.retries) || 0,
    ),
  });
}

/**
 * Clears persisted notification state.
 *
 * @returns {boolean} Whether persisted notification state was removed.
 */
export function clearNotificationPersistence() {
  return DemoStore.remove(NOTIFICATION_STORE_KEY);
}

export const getNotifications = listNotifications;
export const fetchNotifications = retrieveNotifications;
export const searchNotifications = queryNotifications;
export const getNotificationById = getNotification;
export const markRead = markNotificationRead;
export const markAsRead = markNotificationRead;
export const markAllRead = markAllNotificationsRead;
export const resetNotificationState = resetNotifications;
export const clearNotifications = resetNotifications;
export const getUnreadCount = getUnreadNotificationCount;

export const NOTIFICATION_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: NOTIFICATION_RETRIEVAL_ERROR_CODE,
  NOT_FOUND: NOTIFICATION_NOT_FOUND_ERROR_CODE,
  INVALID_ACTION: INVALID_NOTIFICATION_ACTION_ERROR_CODE,
});

const notificationService = Object.freeze({
  NOTIFICATION_STORE_KEY,
  listNotifications,
  getNotifications,
  queryNotifications,
  searchNotifications,
  retrieveNotifications,
  fetchNotifications,
  retryNotificationRetrieval,
  getNotification,
  getNotificationById,
  markNotificationRead,
  markRead,
  markAsRead,
  markAllNotificationsRead,
  markAllRead,
  resetNotifications,
  resetNotificationState,
  clearNotifications,
  clearNotificationPersistence,
  getUnreadNotificationCount,
  getUnreadCount,
  isNotificationUnread,
  NOTIFICATION_SERVICE_ERROR_CODES,
});

export {
  NOTIFICATION_STORE_KEY,
  NOTIFICATION_RETRIEVAL_ERROR_CODE,
  NOTIFICATION_NOT_FOUND_ERROR_CODE,
  INVALID_NOTIFICATION_ACTION_ERROR_CODE,
};

export default notificationService;