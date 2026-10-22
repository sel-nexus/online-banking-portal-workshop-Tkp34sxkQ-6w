import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Dialog from '../accessibility/Dialog';
import Button from '../ui/Button';
import LiveRegion from '../accessibility/LiveRegion';

const childrenPropType = () => null;

function normalizeRemainingTime(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.ceil(numericValue)
    : 0;
}

function getRemainingTimeValue(remainingTime, remainingExpiryTime, expiresAt) {
  if (remainingTime !== undefined && remainingTime !== null) {
    return normalizeRemainingTime(remainingTime);
  }

  if (
    remainingExpiryTime !== undefined &&
    remainingExpiryTime !== null
  ) {
    return normalizeRemainingTime(remainingExpiryTime);
  }

  if (expiresAt) {
    const expiryTimestamp = new Date(expiresAt).getTime();

    if (Number.isFinite(expiryTimestamp)) {
      return Math.max(0, expiryTimestamp - Date.now());
    }
  }

  return 0;
}

function formatRemainingTime(value) {
  const milliseconds = normalizeRemainingTime(value);

  if (!milliseconds) {
    return 'less than a minute';
  }

  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Renders an accessible idle-session warning dialog with a countdown and a
 * simulated-session security disclosure.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.open Whether the warning dialog is open.
 * @param {boolean} props.isOpen Alias for open.
 * @param {boolean} props.idleWarning Whether an idle warning is active.
 * @param {number} props.remainingTime Remaining time before session expiry.
 * @param {number} props.remainingExpiryTime Alias for remainingTime.
 * @param {string|number|Date} props.expiresAt Session expiry timestamp.
 * @param {Function} props.onContinue Callback invoked to continue the session.
 * @param {Function} props.onContinueSession Alias for onContinue.
 * @param {Function} props.onExpire Callback invoked when the countdown expires.
 * @param {Function} props.onExpired Alias for onExpire.
 * @param {Function} props.onSessionExpired Alias for onExpire.
 * @param {Function} props.onSignOut Callback invoked to sign out.
 * @param {Function} props.onLogout Alias for onSignOut.
 * @param {string} props.title Warning dialog heading.
 * @param {string} props.className Additional dialog classes.
 * @returns {JSX.Element|null} Session warning dialog.
 */
function SessionWarning({
  className = '',
  expiresAt,
  idleWarning = false,
  isOpen,
  onContinue,
  onContinueSession,
  onExpire,
  onExpired,
  onLogout,
  onSessionExpired,
  onSignOut,
  open,
  remainingExpiryTime,
  remainingTime,
  title = 'Your session is about to expire',
  ...props
}) {
  const continueButtonRef = useRef(null);
  const expiryNotifiedRef = useRef(false);
  const generatedId = useId();
  const isWarningOpen = isOpen ?? open ?? idleWarning;
  const resolvedOnContinue = onContinue || onContinueSession;
  const resolvedOnExpire =
    onExpire || onExpired || onSessionExpired;
  const resolvedOnSignOut = onSignOut || onLogout;
  const initialRemainingTime = getRemainingTimeValue(
    remainingTime,
    remainingExpiryTime,
    expiresAt,
  );
  const [countdown, setCountdown] = useState(initialRemainingTime);
  const countdownId = `session-countdown-${generatedId}`;

  useEffect(() => {
    if (!isWarningOpen) {
      expiryNotifiedRef.current = false;
      setCountdown(initialRemainingTime);
      return undefined;
    }

    const endTime = Date.now() + initialRemainingTime;
    setCountdown(initialRemainingTime);

    if (!initialRemainingTime) {
      if (!expiryNotifiedRef.current) {
        expiryNotifiedRef.current = true;
        resolvedOnExpire?.();
      }

      return undefined;
    }

    const updateCountdown = () => {
      const nextCountdown = Math.max(0, endTime - Date.now());

      setCountdown(nextCountdown);

      if (!nextCountdown && !expiryNotifiedRef.current) {
        expiryNotifiedRef.current = true;
        resolvedOnExpire?.();
      }
    };

    const timerId = window.setInterval(updateCountdown, 1000);

    updateCountdown();

    return () => {
      window.clearInterval(timerId);
    };
  }, [
    initialRemainingTime,
    isWarningOpen,
    resolvedOnExpire,
  ]);

  const isExpired = isWarningOpen && countdown <= 0;
  const countdownLabel = formatRemainingTime(countdown);
  const countdownMessage = isExpired
    ? 'Your session has expired.'
    : `Your session will expire in ${countdownLabel}.`;

  const handleContinue = (event) => {
    if (!isExpired) {
      resolvedOnContinue?.(event);
    }
  };

  const handleSignOut = (event) => {
    resolvedOnSignOut?.(event);
  };

  return (
    <Dialog
      {...props}
      aria-describedby={`${countdownId}-description`}
      className={className}
      closeOnEscape={false}
      closeOnOverlayClick={false}
      initialFocusRef={continueButtonRef}
      label="Session timeout warning"
      open={isWarningOpen}
      showCloseButton={false}
      title={title}
    >
      <div className="space-y-5">
        <p
          className="text-sm text-foreground"
          id={`${countdownId}-description`}
        >
          For your security, {countdownMessage}
        </p>

        <div
          aria-live="polite"
          className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-center"
          id={countdownId}
          role="status"
        >
          <p className="text-sm font-semibold text-warning-700">
            {isExpired ? 'Session expired' : 'Time remaining'}
          </p>
          <p className="mt-1 text-2xl font-semibold text-warning-700">
            {countdownLabel}
          </p>
        </div>

        <div className="rounded-lg border border-info-200 bg-info-50 p-4 text-sm text-info-700">
          <p className="font-semibold">Simulation only</p>
          <p className="mt-1">
            This portal uses synthetic sample data. No real banking activity,
            transaction, or account change will be performed.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            onClick={handleSignOut}
            type="button"
            variant="secondary"
          >
            Sign out
          </Button>
          <Button
            disabled={isExpired || !resolvedOnContinue}
            onClick={handleContinue}
            ref={continueButtonRef}
            type="button"
          >
            Continue session
          </Button>
        </div>

        <LiveRegion
          message={isExpired ? 'Your session has expired.' : ''}
          politeness="assertive"
        />
      </div>
    </Dialog>
  );
}

SessionWarning.displayName = 'SessionWarning';

SessionWarning.propTypes = {
  className: () => null,
  expiresAt: () => null,
  idleWarning: () => null,
  isOpen: () => null,
  onContinue: () => null,
  onContinueSession: () => null,
  onExpire: () => null,
  onExpired: () => null,
  onLogout: () => null,
  onSessionExpired: () => null,
  onSignOut: () => null,
  open: () => null,
  remainingExpiryTime: () => null,
  remainingTime: () => null,
  title: () => null,
};

export {
  formatRemainingTime,
  getRemainingTimeValue,
  normalizeRemainingTime,
};

export default SessionWarning;