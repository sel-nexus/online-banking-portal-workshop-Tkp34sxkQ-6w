import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import Alert from './Alert';

const ToastContext = createContext(null);

ToastContext.displayName = 'ToastContext';

const DEFAULT_DURATION = 5000;
const DEFAULT_MAX_TOASTS = 5;

const POSITION_CLASSES = Object.freeze({
  'top-left': 'left-4 top-4 items-start sm:left-6 sm:top-6',
  'top-center': 'left-1/2 top-4 -translate-x-1/2 items-center sm:top-6',
  'top-right': 'right-4 top-4 items-end sm:right-6 sm:top-6',
  'bottom-left': 'bottom-4 left-4 items-start sm:bottom-6 sm:left-6',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center sm:bottom-6',
  'bottom-right': 'bottom-4 right-4 items-end sm:bottom-6 sm:right-6',
});

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeDuration(value) {
  if (value === false) {
    return false;
  }

  const duration = Number(value);

  return Number.isFinite(duration) && duration >= 0
    ? duration
    : DEFAULT_DURATION;
}

function normalizeVariant(value) {
  const variant = String(value ?? '')
    .trim()
    .toLowerCase();

  return ['info', 'success', 'warning', 'error'].includes(variant)
    ? variant
    : variant === 'danger' || variant === 'failure'
      ? 'error'
      : 'info';
}

function normalizePosition(value) {
  const position = String(value ?? '').trim().toLowerCase();

  return POSITION_CLASSES[position] ? position : 'top-right';
}

function normalizeToast(message, options = {}) {
  const source =
    message && typeof message === 'object' && !Array.isArray(message)
      ? message
      : { message, ...options };

  const text = String(
    source.message ?? source.text ?? source.content ?? '',
  ).trim();

  if (!text) {
    return null;
  }

  return {
    id: source.id || createToastId(),
    message: text,
    variant: normalizeVariant(source.variant),
    duration: normalizeDuration(source.duration),
    dismissible: source.dismissible !== false,
    title: source.title || null,
  };
}

function ToastStack({
  position,
  toasts,
  onDismiss,
}) {
  if (!toasts.length || typeof document === 'undefined' || !document.body) {
    return null;
  }

  const stack = (
    <div
      aria-label="Notifications"
      className={`pointer-events-none fixed z-50 flex w-[calc(100%-2rem)] max-w-md flex-col gap-3 ${POSITION_CLASSES[position]}`}
      role="region"
    >
      {toasts.map((toast) => (
        <div className="pointer-events-auto w-full" key={toast.id}>
          <Alert
            className="w-full shadow-lg"
            dismissible={toast.dismissible}
            message={toast.message}
            onDismiss={() => onDismiss(toast.id)}
            role={toast.variant === 'info' ? 'status' : 'alert'}
            title={toast.title}
            variant={toast.variant}
          />
        </div>
      ))}
    </div>
  );

  return createPortal(stack, document.body);
}

ToastStack.displayName = 'ToastStack';

ToastStack.propTypes = {
  position: () => null,
  toasts: () => null,
  onDismiss: () => null,
};

/**
 * Provides transient, accessible toast feedback for local application actions.
 *
 * @param {object} props Component properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @param {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} props.position Toast stack position.
 * @param {number} props.maxToasts Maximum number of visible toasts.
 * @returns {JSX.Element} Toast context provider.
 */
function ToastProvider({
  children,
  maxToasts = DEFAULT_MAX_TOASTS,
  position = 'top-right',
}) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const normalizedPosition = normalizePosition(position);
  const normalizedMaxToasts = Number.isFinite(Number(maxToasts))
    ? Math.max(1, Math.floor(Number(maxToasts)))
    : DEFAULT_MAX_TOASTS;

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
      const toast = normalizeToast(message, options);

      if (!toast) {
        return null;
      }

      setToasts((currentToasts) => [
        ...currentToasts
          .filter((currentToast) => currentToast.id !== toast.id)
          .slice(-(normalizedMaxToasts - 1)),
        toast,
      ]);

      if (toast.duration !== false) {
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration);

        timersRef.current.set(toast.id, timer);
      }

      return toast.id;
    },
    [dismissToast, normalizedMaxToasts],
  );

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        const lastToast = toasts[toasts.length - 1];

        if (lastToast) {
          dismissToast(lastToast.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissToast, toasts]);

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
      addToast: showToast,
      dismissToast,
      removeToast: dismissToast,
      clearToasts,
      clear: clearToasts,
    }),
    [clearToasts, dismissToast, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack
        onDismiss={dismissToast}
        position={normalizedPosition}
        toasts={toasts}
      />
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';

function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}

const childrenPropType = () => null;

ToastProvider.propTypes = {
  children: childrenPropType,
  maxToasts: () => null,
  position: () => null,
};

export {
  ToastContext,
  ToastProvider,
  ToastStack,
  useToast,
};

export default ToastProvider;