import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccess } from '../contexts/AccessContext';

export const SESSION_ACTIVITY_EVENTS = Object.freeze([
  'click',
  'keydown',
  'pointerdown',
  'touchstart',
]);

const MODIFIER_KEYS = new Set([
  'Alt',
  'Control',
  'Meta',
  'Shift',
  'CapsLock',
  'NumLock',
  'ScrollLock',
]);

function getDefaultEventTarget() {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.addEventListener === 'function'
  ) {
    return globalThis;
  }

  return null;
}

function resolveEventTarget(target) {
  if (target?.current) {
    return target.current;
  }

  return target || getDefaultEventTarget();
}

function normalizeEvents(events) {
  const source = Array.isArray(events) ? events : SESSION_ACTIVITY_EVENTS;

  return [
    ...new Set(
      source
        .map((eventName) => String(eventName ?? '').trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Checks whether an event represents meaningful user activity.
 *
 * @param {Event} event Browser interaction event.
 * @returns {boolean} Whether the event should refresh session activity.
 */
export function isMeaningfulActivityEvent(event) {
  if (!event || event.defaultPrevented) {
    return false;
  }

  if (event.type === 'keydown' && MODIFIER_KEYS.has(event.key)) {
    return false;
  }

  return true;
}

/**
 * Tracks meaningful interaction activity for the shared session manager.
 *
 * @param {object} options Hook options.
 * @param {boolean} options.enabled Whether activity tracking is enabled.
 * @param {EventTarget} options.target Optional event target.
 * @param {string[]} options.events Interaction event names to observe.
 * @returns {object} Session activity state and controls.
 */
export function useSessionActivity(options = {}) {
  const {
    continueSession,
    idleWarning,
    isAuthenticated,
    isExpired,
    managerVersion,
    refreshSessionActivity,
    remainingExpiryTime,
    remainingWarningTime,
    sessionManager,
    sessionStatus,
  } = useAccess();
  const enabled = options.enabled !== false;
  const target = options.target;
  const events = options.events;
  const [lastActivityAt, setLastActivityAt] = useState(null);

  const normalizedEvents = useMemo(
    () => normalizeEvents(events),
    [events],
  );

  const recordActivity = useCallback(
    (event = {}) => {
      if (
        !enabled ||
        !isAuthenticated ||
        !isMeaningfulActivityEvent(event)
      ) {
        return false;
      }

      refreshSessionActivity(event);
      setLastActivityAt(new Date().toISOString());

      return true;
    },
    [enabled, isAuthenticated, refreshSessionActivity],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLastActivityAt(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const eventTarget = resolveEventTarget(target);

    if (!enabled || !isAuthenticated || !eventTarget) {
      return undefined;
    }

    normalizedEvents.forEach((eventName) => {
      eventTarget.addEventListener(eventName, recordActivity);
    });

    return () => {
      normalizedEvents.forEach((eventName) => {
        eventTarget.removeEventListener(eventName, recordActivity);
      });
    };
  }, [
    enabled,
    isAuthenticated,
    normalizedEvents,
    recordActivity,
    target,
  ]);

  return useMemo(
    () => ({
      enabled,
      isAuthenticated,
      isExpired,
      idleWarning,
      isIdleWarning: idleWarning,
      sessionStatus,
      lastActivityAt,
      remainingWarningTime,
      remainingExpiryTime,
      sessionManager,
      managerVersion,
      recordActivity,
      refreshSessionActivity: recordActivity,
      continueSession,
    }),
    [
      continueSession,
      enabled,
      idleWarning,
      isAuthenticated,
      isExpired,
      lastActivityAt,
      managerVersion,
      recordActivity,
      remainingExpiryTime,
      remainingWarningTime,
      sessionManager,
      sessionStatus,
    ],
  );
}

export default useSessionActivity;