import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AnalyticsProvider from './AnalyticsContext';
import AccessProvider from './AccessContext';
import CustomerProfileProvider from './CustomerProfileContext';
import DemoStoreProvider from '../store/DemoStoreContext';
import {
  announce as announceLiveMessage,
  clearAnnouncement as clearLiveAnnouncement,
} from '../utils/announcements';

const ToastContext = createContext(null);
const AnnouncementContext = createContext(null);

ToastContext.displayName = 'ToastContext';
AnnouncementContext.displayName = 'AnnouncementContext';

const DEFAULT_TOAST_DURATION = 5000;

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeToastOptions(options = {}) {
  return {
    variant: options.variant || 'info',
    duration:
      options.duration === false
        ? false
        : Number.isFinite(Number(options.duration))
          ? Math.max(0, Number(options.duration))
          : DEFAULT_TOAST_DURATION,
  };
}

/**
 * Provides transient toast notifications for the application.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Toast context provider.
 */
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );

    const timer = timersRef.current.get(toastId);

    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      const text = String(message ?? '').trim();

      if (!text) {
        return null;
      }

      const toastId = options.id || createToastId();
      const normalizedOptions = normalizeToastOptions(options);
      const toast = {
        id: toastId,
        message: text,
        ...normalizedOptions,
      };

      setToasts((currentToasts) => [...currentToasts, toast]);

      if (normalizedOptions.duration !== false) {
        const timer = setTimeout(() => {
          dismissToast(toastId);
        }, normalizedOptions.duration);

        timersRef.current.set(toastId, timer);
      }

      return toastId;
    },
    [dismissToast],
  );

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      toasts,
      notifications: toasts,
      showToast,
      toast: showToast,
      dismissToast,
      removeToast: dismissToast,
      clearToasts,
      clear: clearToasts,
    }),
    [clearToasts, dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';

/**
 * Provides accessible live announcements for the application.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Announcement context provider.
 */
function AnnouncementProvider({ children }) {
  const [announcement, setAnnouncement] = useState({
    message: '',
    politeness: 'polite',
  });

  const announce = useCallback((message, options = {}) => {
    const text = String(message ?? '').trim();

    if (!text) {
      clearLiveAnnouncement(options);
      setAnnouncement({
        message: '',
        politeness: options.politeness === 'assertive' ? 'assertive' : 'polite',
      });
      return false;
    }

    const politeness = options.politeness === 'assertive' ? 'assertive' : 'polite';

    const announced = announceLiveMessage(text, {
      ...options,
      politeness,
    });

    setAnnouncement({
      message: text,
      politeness,
    });

    return announced;
  }, []);

  const clearAnnouncement = useCallback((options = {}) => {
    const cleared = clearLiveAnnouncement(options);

    setAnnouncement({
      message: '',
      politeness: options.politeness === 'assertive' ? 'assertive' : 'polite',
    });

    return cleared;
  }, []);

  const value = useMemo(
    () => ({
      announcement,
      message: announcement.message,
      politeness: announcement.politeness,
      announce,
      announceMessage: announce,
      clearAnnouncement,
      clear: clearAnnouncement,
    }),
    [announce, announcement, clearAnnouncement],
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
}

AnnouncementProvider.displayName = 'AnnouncementProvider';

/**
 * Provides access to toast notification actions and state.
 *
 * @returns {object} Toast context value.
 */
function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}

/**
 * Provides access to live announcement actions and state.
 *
 * @returns {object} Announcement context value.
 */
function useAnnouncements() {
  const context = useContext(AnnouncementContext);

  if (!context) {
    throw new Error(
      'useAnnouncements must be used within an AnnouncementProvider.',
    );
  }

  return context;
}

/**
 * Composes the application's demo store and feature providers.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Composed application providers.
 */
function AppProviders({ children }) {
  return (
    <DemoStoreProvider>
      <AccessProvider>
        <CustomerProfileProvider>
          <AnalyticsProvider>
            <ToastProvider>
              <AnnouncementProvider>{children}</AnnouncementProvider>
            </ToastProvider>
          </AnalyticsProvider>
        </CustomerProfileProvider>
      </AccessProvider>
    </DemoStoreProvider>
  );
}

AppProviders.displayName = 'AppProviders';

const childrenPropType = () => null;

ToastProvider.propTypes = {
  children: childrenPropType,
};

AnnouncementProvider.propTypes = {
  children: childrenPropType,
};

AppProviders.propTypes = {
  children: childrenPropType,
};

export {
  AnnouncementContext,
  AnnouncementProvider,
  AppProviders,
  ToastContext,
  ToastProvider,
  useAnnouncements,
  useToast,
};

export default AppProviders;