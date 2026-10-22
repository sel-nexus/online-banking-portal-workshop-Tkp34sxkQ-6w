import React, { useId } from 'react';
import Button from '../ui/Button';
import { ERROR_MESSAGES } from '../../config/messages';

const childrenPropType = () => null;

const ERROR_STATE_CONTENT = Object.freeze({
  default: Object.freeze({
    title: 'Something went wrong',
    description: ERROR_MESSAGES.generic,
  }),
  generic: Object.freeze({
    title: 'Something went wrong',
    description: ERROR_MESSAGES.generic,
  }),
  loading: Object.freeze({
    title: 'Unable to load information',
    description: ERROR_MESSAGES.loading,
  }),
  accounts: Object.freeze({
    title: 'Unable to load accounts',
    description: ERROR_MESSAGES.loadingAccounts,
  }),
  transactions: Object.freeze({
    title: 'Unable to load transactions',
    description: ERROR_MESSAGES.loadingTransactions,
  }),
  profile: Object.freeze({
    title: 'Unable to load your profile',
    description: ERROR_MESSAGES.loadingProfile,
  }),
  network: Object.freeze({
    title: 'Connection problem',
    description: ERROR_MESSAGES.network,
  }),
  unavailable: Object.freeze({
    title: 'Service temporarily unavailable',
    description: ERROR_MESSAGES.unavailable,
  }),
  unauthorized: Object.freeze({
    title: 'You are not authorized',
    description: ERROR_MESSAGES.unauthorized,
  }),
  notFound: Object.freeze({
    title: 'Information not found',
    description: ERROR_MESSAGES.notFound,
  }),
});

function normalizeVariant(variant) {
  const normalizedVariant = String(variant ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '');

  const variantAliases = {
    account: 'accounts',
    accountloading: 'accounts',
    transaction: 'transactions',
    transactionloading: 'transactions',
    profileloading: 'profile',
    connection: 'network',
    error: 'generic',
  };

  return (
    variantAliases[normalizedVariant] ||
    (ERROR_STATE_CONTENT[normalizedVariant] ? normalizedVariant : 'default')
  );
}

/**
 * Renders a user-safe error state with an optional retry action.
 *
 * Raw exception messages and internal error details are never rendered.
 *
 * @param {object} props Component properties.
 * @param {'default'|'generic'|'loading'|'accounts'|'transactions'|'profile'|'network'|'unavailable'|'unauthorized'|'notFound'} props.variant Error-state content variant.
 * @param {React.ReactNode} props.title Error-state heading.
 * @param {React.ReactNode} props.description User-safe error description.
 * @param {React.ReactNode} props.children Additional content.
 * @param {React.ReactNode} props.icon Optional decorative icon.
 * @param {Function} props.onRetry Retry callback.
 * @param {Function} props.onAction Alias for the retry callback.
 * @param {string} props.retryLabel Retry button label.
 * @param {boolean} props.showRetry Whether to show the retry action.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Error-state content.
 */
function ErrorState({
  children,
  className = '',
  description,
  error: ignoredError,
  icon = '!',
  onAction,
  onRetry,
  retryLabel = 'Try again',
  showRetry = true,
  title,
  variant = 'default',
  ...props
}) {
  const headingId = useId();
  const normalizedVariant = normalizeVariant(variant);
  const content = ERROR_STATE_CONTENT[normalizedVariant];
  const resolvedTitle = title || content.title;
  const resolvedDescription = description || content.description;
  const retryHandler = onRetry || onAction;

  void ignoredError;

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={`rounded-xl border border-danger-200 bg-danger-50 p-6 text-center shadow-sm sm:p-8 ${className}`.trim()}
      role="alert"
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-xl font-bold text-danger-700"
        >
          {icon}
        </div>
      ) : null}

      <h2 className="text-lg font-semibold text-foreground" id={headingId}>
        {resolvedTitle}
      </h2>

      {resolvedDescription ? (
        <p className="mx-auto mt-2 max-w-lg text-sm text-foreground-muted">
          {resolvedDescription}
        </p>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}

      {showRetry && retryHandler ? (
        <div className="mt-5">
          <Button onClick={retryHandler} type="button" variant="secondary">
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

ErrorState.displayName = 'ErrorState';

ErrorState.propTypes = {
  children: childrenPropType,
  className: () => null,
  description: childrenPropType,
  error: () => null,
  icon: childrenPropType,
  onAction: () => null,
  onRetry: () => null,
  retryLabel: () => null,
  showRetry: () => null,
  title: childrenPropType,
  variant: () => null,
};

export { ERROR_STATE_CONTENT };

export default ErrorState;