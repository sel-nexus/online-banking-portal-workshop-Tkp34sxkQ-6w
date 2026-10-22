import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NOTIFICATIONS } from '../../fixtures/notifications';
import { formatDate } from '../../utils/formatters';

const childrenPropType = () => null;

function getNotificationId(notification, index) {
  return String(
    notification?.id ||
      notification?.notificationId ||
      `notification-${index}`,
  );
}

function getNotificationMessage(notification) {
  return (
    notification?.message ||
    notification?.body ||
    'You have a new notification.'
  );
}

function isNotificationRead(notification) {
  return notification?.read === true || notification?.isRead === true;
}

/**
 * Renders an accessible notification popover for synthetic banking alerts.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.open Whether the popover is open.
 * @param {boolean} props.isOpen Alias for open.
 * @param {Function} props.onClose Callback invoked when the popover closes.
 * @param {Function} props.onRequestClose Alias for onClose.
 * @param {object[]} props.notifications Notifications to display.
 * @param {Function} props.onNotificationSelect Callback invoked when a notification is selected.
 * @param {Function} props.onSelect Alias for onNotificationSelect.
 * @param {Function} props.onMarkRead Callback invoked when a notification is marked read.
 * @param {Function} props.onMarkAllRead Callback invoked when all notifications are marked read.
 * @param {string} props.title Popover heading.
 * @param {string} props.triggerLabel Accessible trigger label.
 * @param {string} props.closeLabel Accessible close-button label.
 * @param {boolean} props.showTrigger Whether to render the notification trigger.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Notification popover.
 */
function NotificationPopover({
  className = '',
  closeLabel = 'Close notifications',
  isOpen,
  notifications = NOTIFICATIONS,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onNotificationSelect,
  onRequestClose,
  onSelect,
  open,
  showTrigger = true,
  title = 'Notifications',
  triggerLabel = 'Notifications',
}) {
  const popoverId = useId();
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [readIds, setReadIds] = useState(
    () =>
      new Set(
        (Array.isArray(notifications) ? notifications : [])
          .map((notification, index) =>
            isNotificationRead(notification)
              ? getNotificationId(notification, index)
              : null,
          )
          .filter(Boolean),
      ),
  );

  const isControlled = isOpen !== undefined || open !== undefined;
  const isPopoverOpen = isOpen ?? open ?? internalOpen;
  const resolvedOnClose = onClose || onRequestClose;
  const resolvedOnSelect = onNotificationSelect || onSelect;
  const normalizedNotifications = useMemo(
    () => (Array.isArray(notifications) ? notifications : []),
    [notifications],
  );

  useEffect(() => {
    setReadIds(
      new Set(
        normalizedNotifications
          .map((notification, index) =>
            isNotificationRead(notification)
              ? getNotificationId(notification, index)
              : null,
          )
          .filter(Boolean),
      ),
    );
  }, [normalizedNotifications]);

  const closePopover = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false);
    }

    resolvedOnClose?.();
  }, [isControlled, resolvedOnClose]);

  useEffect(() => {
    if (!isPopoverOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePopover();
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        closePopover();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closePopover, isPopoverOpen]);

  const unreadCount = normalizedNotifications.reduce(
    (count, notification, index) => {
      const notificationId = getNotificationId(notification, index);

      return readIds.has(notificationId) ? count : count + 1;
    },
    0,
  );

  const markRead = (notification, index) => {
    const notificationId = getNotificationId(notification, index);

    setReadIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(notificationId);
      return nextIds;
    });

    onMarkRead?.(notification);
    resolvedOnSelect?.(notification);
  };

  const markAllRead = () => {
    setReadIds(
      new Set(
        normalizedNotifications.map((notification, index) =>
          getNotificationId(notification, index),
        ),
      ),
    );
    onMarkAllRead?.(normalizedNotifications);
  };

  const togglePopover = () => {
    if (isPopoverOpen) {
      closePopover();
      return;
    }

    if (!isControlled) {
      setInternalOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`.trim()}>
      {showTrigger ? (
        <button
          aria-controls={popoverId}
          aria-expanded={isPopoverOpen}
          aria-label={
            unreadCount > 0
              ? `${triggerLabel}, ${unreadCount} unread`
              : triggerLabel
          }
          className="relative rounded-md p-2 text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          onClick={togglePopover}
          ref={triggerRef}
          type="button"
        >
          <span aria-hidden="true" className="text-lg">
            ♧
          </span>
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {isPopoverOpen ? (
        <section
          aria-labelledby={`${popoverId}-title`}
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          id={popoverId}
          ref={popoverRef}
          role="dialog"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <h2
                className="text-base font-semibold text-foreground"
                id={`${popoverId}-title`}
              >
                {title}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {unreadCount
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? '' : 's'
                    }`
                  : 'You are all caught up.'}
              </p>
            </div>
            <button
              aria-label={closeLabel}
              className="rounded-md p-1 text-xl leading-none text-foreground-muted hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={closePopover}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          {normalizedNotifications.length ? (
            <ul
              aria-label="Notification list"
              className="max-h-96 divide-y divide-border overflow-y-auto"
            >
              {normalizedNotifications.map((notification, index) => {
                const notificationId = getNotificationId(notification, index);
                const isRead = readIds.has(notificationId);

                return (
                  <li className="px-4 py-4" key={notificationId}>
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          isRead ? 'bg-border-strong' : 'bg-primary'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${
                            isRead
                              ? 'font-medium text-foreground-muted'
                              : 'font-semibold text-foreground'
                          }`}
                        >
                          {notification?.title || 'Notification'}
                        </p>
                        <p className="mt-1 text-sm text-foreground-muted">
                          {getNotificationMessage(notification)}
                        </p>
                        {notification?.createdAt ? (
                          <time
                            className="mt-2 block text-xs text-foreground-subtle"
                            dateTime={notification.createdAt}
                          >
                            {formatDate(notification.createdAt)}
                          </time>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!isRead ? (
                            <button
                              className="rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                              onClick={() => markRead(notification, index)}
                              type="button"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-foreground-subtle">
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-foreground-muted">
              There are no notifications.
            </p>
          )}

          {normalizedNotifications.length && unreadCount > 0 ? (
            <footer className="border-t border-border bg-surface-muted px-4 py-3">
              <button
                className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={markAllRead}
                type="button"
              >
                Mark all as read
              </button>
            </footer>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

NotificationPopover.displayName = 'NotificationPopover';

NotificationPopover.propTypes = {
  className: () => null,
  closeLabel: () => null,
  isOpen: () => null,
  notifications: () => null,
  onClose: () => null,
  onMarkAllRead: () => null,
  onMarkRead: () => null,
  onNotificationSelect: () => null,
  onRequestClose: () => null,
  onSelect: () => null,
  open: () => null,
  showTrigger: () => null,
  title: () => null,
  triggerLabel: () => null,
};

export { getNotificationId, isNotificationRead };

export default NotificationPopover;