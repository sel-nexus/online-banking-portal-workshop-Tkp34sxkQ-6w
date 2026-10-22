import React from 'react';
import AccountCard from './AccountCard';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';
import LoadingSkeleton from '../feedback/LoadingSkeleton';
import { ERROR_MESSAGES } from '../../config/messages';

const childrenPropType = () => null;

function normalizeAccounts(accounts) {
  return Array.isArray(accounts) ? accounts : [];
}

function isUnavailableState(unavailable, isUnavailable, status, error) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase();
  const normalizedErrorCode = String(error?.code ?? '').trim().toLowerCase();

  return (
    unavailable === true ||
    isUnavailable === true ||
    normalizedStatus === 'unavailable' ||
    normalizedErrorCode.includes('unavailable')
  );
}

/**
 * Renders a responsive collection of account cards with loading, empty, and
 * recoverable unavailable states.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.accounts Accounts to display.
 * @param {object[]} props.items Alias for accounts.
 * @param {boolean} props.loading Whether accounts are loading.
 * @param {boolean} props.isLoading Alias for loading.
 * @param {boolean} props.unavailable Whether account data is unavailable.
 * @param {boolean} props.isUnavailable Alias for unavailable.
 * @param {string} props.status Account collection status.
 * @param {Error|object|string|null} props.error Account retrieval error.
 * @param {Function} props.onRetry Callback invoked to retry account retrieval.
 * @param {string} props.retryLabel Retry button label.
 * @param {string} props.emptyTitle Empty-state heading.
 * @param {string} props.emptyDescription Empty-state description.
 * @param {string} props.unavailableTitle Unavailable-state heading.
 * @param {string} props.unavailableDescription Unavailable-state description.
 * @param {string} props.loadingLabel Accessible loading label.
 * @param {number} props.loadingCount Number of loading cards.
 * @param {string} props.className Additional grid classes.
 * @param {string} props.cardClassName Additional account-card classes.
 * @param {Function} props.onViewDetails Callback invoked for an account.
 * @returns {JSX.Element} Account collection state or account-card grid.
 */
function AccountGrid({
  accounts,
  cardClassName = '',
  className = '',
  emptyDescription,
  emptyTitle,
  error = null,
  isLoading = false,
  isUnavailable = false,
  items,
  loading = false,
  loadingCount = 3,
  loadingLabel = 'Loading accounts',
  onRetry,
  onViewDetails,
  retryLabel = 'Try again',
  status,
  unavailable = false,
  unavailableDescription,
  unavailableTitle,
  ...props
}) {
  const resolvedAccounts = normalizeAccounts(accounts ?? items);
  const isCollectionLoading = loading || isLoading;
  const isCollectionUnavailable = isUnavailableState(
    unavailable,
    isUnavailable,
    status,
    error,
  );

  if (isCollectionLoading) {
    return (
      <LoadingSkeleton
        {...props}
        className={className}
        count={loadingCount}
        label={loadingLabel}
        variant="account"
      />
    );
  }

  if (isCollectionUnavailable) {
    return (
      <ErrorState
        {...props}
        className={className}
        description={
          unavailableDescription || ERROR_MESSAGES.unavailable
        }
        onRetry={onRetry}
        retryLabel={retryLabel}
        title={unavailableTitle || 'Accounts are temporarily unavailable'}
        variant="unavailable"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        {...props}
        className={className}
        error={error}
        onRetry={onRetry}
        retryLabel={retryLabel}
        variant="accounts"
      />
    );
  }

  if (!resolvedAccounts.length) {
    return (
      <EmptyState
        {...props}
        className={className}
        description={emptyDescription}
        onAction={onRetry}
        showAction={Boolean(onRetry)}
        title={emptyTitle}
        variant="accounts"
      />
    );
  }

  return (
    <div
      {...props}
      aria-label="Accounts"
      className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`.trim()}
    >
      {resolvedAccounts.map((account, index) => {
        const accountId =
          account?.id ||
          account?.accountId ||
          account?.number ||
          `account-${index}`;

        return (
          <AccountCard
            account={account}
            className={cardClassName}
            key={String(accountId)}
            onViewDetails={onViewDetails}
          />
        );
      })}
    </div>
  );
}

AccountGrid.displayName = 'AccountGrid';

AccountGrid.propTypes = {
  accounts: () => null,
  cardClassName: () => null,
  className: () => null,
  emptyDescription: () => null,
  emptyTitle: () => null,
  error: () => null,
  isLoading: () => null,
  isUnavailable: () => null,
  items: () => null,
  loading: () => null,
  loadingCount: () => null,
  loadingLabel: () => null,
  onRetry: () => null,
  onViewDetails: () => null,
  retryLabel: () => null,
  status: () => null,
  unavailable: () => null,
  unavailableDescription: () => null,
  unavailableTitle: () => null,
};

export { isUnavailableState, normalizeAccounts };

export default AccountGrid;