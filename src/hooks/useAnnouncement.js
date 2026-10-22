import { useCallback, useMemo } from 'react';
import { useAnnouncements } from '../contexts/AppProviders';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizePoliteness(value, fallback = 'polite') {
  return value === 'assertive' ? 'assertive' : fallback;
}

function normalizeAnnouncementArguments(message, options, defaults) {
  if (isRecord(message)) {
    return {
      message: message.message ?? message.text ?? message.content ?? '',
      options: {
        ...defaults,
        ...message,
        ...options,
      },
    };
  }

  return {
    message,
    options: {
      ...defaults,
      ...(options || {}),
    },
  };
}

/**
 * Provides convenient polite and assertive live-announcement actions.
 *
 * @param {object} options Hook options.
 * @param {'polite'|'assertive'} options.politeness Default announcement politeness.
 * @param {number|false|null} options.clearAfter Milliseconds before clearing an announcement.
 * @param {Document} options.document Optional document used by the live region.
 * @returns {object} Announcement state and controls.
 */
export function useAnnouncement(options = {}) {
  const {
    announcement,
    message,
    politeness,
    announce: announceMessage,
    clearAnnouncement: clearLiveAnnouncement,
  } = useAnnouncements();

  const defaults = useMemo(
    () => ({
      ...options,
      politeness: normalizePoliteness(options.politeness),
    }),
    [options],
  );

  const announce = useCallback(
    (nextMessage, announcementOptions = {}) => {
      const normalized = normalizeAnnouncementArguments(
        nextMessage,
        announcementOptions,
        defaults,
      );

      return announceMessage(normalized.message, normalized.options);
    },
    [announceMessage, defaults],
  );

  const announcePolite = useCallback(
    (nextMessage, announcementOptions = {}) =>
      announce(nextMessage, {
        ...announcementOptions,
        politeness: 'polite',
      }),
    [announce],
  );

  const announceAssertive = useCallback(
    (nextMessage, announcementOptions = {}) =>
      announce(nextMessage, {
        ...announcementOptions,
        politeness: 'assertive',
      }),
    [announce],
  );

  const clear = useCallback(
    (clearOptions = {}) =>
      clearLiveAnnouncement({
        ...defaults,
        ...clearOptions,
      }),
    [clearLiveAnnouncement, defaults],
  );

  return useMemo(
    () => ({
      announcement,
      message,
      politeness,
      announce,
      announceMessage: announce,
      announcePolite,
      announceAssertive,
      clear,
      clearAnnouncement: clear,
    }),
    [
      announce,
      announceAssertive,
      announcePolite,
      announcement,
      clear,
      message,
      politeness,
    ],
  );
}

export default useAnnouncement;