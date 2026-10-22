import React, { useId } from 'react';
import Button from '../ui/Button';
import { EMPTY_STATE_MESSAGES } from '../../config/messages';

const childrenPropType = () => null;

const EMPTY_STATE_CONTENT = Object.freeze({
  default: Object.freeze({
    title: EMPTY_STATE_MESSAGES.searchTitle,
    description: EMPTY_STATE_MESSAGES.searchDescription,
  }),
  transactions: Object.freeze({
    title: EMPTY_STATE_MESSAGES.transactionsTitle,
    description: EMPTY_STATE_MESSAGES.transactionsDescription,
  }),
  accounts: Object.freeze({
    title: EMPTY_STATE_MESSAGES.accountsTitle,
    description: EMPTY_STATE_MESSAGES.accountsDescription,
  }),
  payments: Object.freeze({
    title: EMPTY_STATE_MESSAGES.paymentsTitle,
    description: EMPTY_STATE_MESSAGES.paymentsDescription,
  }),
  transfers: Object.freeze({
    title: EMPTY_STATE_MESSAGES.transfersTitle,
    description: EMPTY_STATE_MESSAGES.transfersDescription,
  }),
  notifications: Object.freeze({
    title: EMPTY_STATE_MESSAGES.notificationsTitle,
    description: EMPTY_STATE_MESSAGES.notificationsDescription,
  }),
  activity: Object.freeze({
    title: EMPTY_STATE_MESSAGES.activityTitle,
    description: EMPTY_STATE_MESSAGES.activityDescription,
  }),
});

function getContent(variant) {
  return EMPTY_STATE_CONTENT[variant] || EMPTY_STATE_CONTENT.default;
}

/**
 * Renders a reusable empty state with optional recovery actions.
 *
 * @param {object} props Component properties.
 * @param {'default'|'transactions'|'accounts'|'payments'|'transfers'|'notifications'|'activity'} props.variant Empty-state content variant.
 * @param {React.ReactNode} props.title Empty-state heading.
 * @param {React.ReactNode} props.description Empty-state description.
 * @param {React.ReactNode} props.children Additional content.
 * @param {React.ReactNode} props.action Optional custom action.
 * @param {Function} props.onAction Action callback.
 * @param {Function} props.onReset Reset callback.
 * @param {string} props.actionLabel Action button label.
 * @param {string} props.resetLabel Reset button label.
 * @param {boolean} props.showAction Whether to show the default action.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Empty-state content.
 */
function EmptyState({
  action,
  actionLabel = 'Reset filters',
  children,
  className = '',
  description,
  icon,
  onAction,
  onReset,
  resetLabel,
  showAction = true,
  title,
  variant = 'default',
  ...props
}) {
  const headingId = useId();
  const content = getContent(variant);
  const resolvedTitle = title || content.title;
  const resolvedDescription = description || content.description;
  const actionHandler = onAction || onReset;
  const resolvedActionLabel = resetLabel || actionLabel;
  const isTransactionState = variant === 'transactions';

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={`rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8 ${className}`.trim()}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background-muted text-xl text-foreground-muted"
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

      {isTransactionState ? (
        <p className="mx-auto mt-2 max-w-lg text-sm text-foreground-muted">
          Try widening your date range or removing some filters.
        </p>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}

      {action || (showAction && actionHandler) ? (
        <div className="mt-5">
          {action || (
            <Button onClick={actionHandler} type="button" variant="secondary">
              {resolvedActionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}

EmptyState.displayName = 'EmptyState';

EmptyState.propTypes = {
  action: childrenPropType,
  actionLabel: () => null,
  children: childrenPropType,
  className: () => null,
  description: childrenPropType,
  icon: childrenPropType,
  onAction: () => null,
  onReset: () => null,
  resetLabel: () => null,
  showAction: () => null,
  title: childrenPropType,
  variant: () => null,
};

export { EMPTY_STATE_CONTENT };

export default EmptyState;