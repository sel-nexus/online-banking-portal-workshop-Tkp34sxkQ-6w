import React, { useState } from 'react';
import TransactionRow from './TransactionRow';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';
import LoadingSkeleton from '../feedback/LoadingSkeleton';
import Alert from '../feedback/Alert';
import { ERROR_MESSAGES } from '../../config/messages';

const childrenPropType = () => null;

const TABLE_HEADERS = Object.freeze([
  Object.freeze({ key: 'date', label: 'Date' }),
  Object.freeze({ key: 'description', label: 'Description' }),
  Object.freeze({ key: 'category', label: 'Category' }),
  Object.freeze({ key: 'status', label: 'Status' }),
  Object.freeze({ key: 'amount', label: 'Amount' }),
]);

function normalizeTransactions(transactions) {
  if (Array.isArray(transactions)) {
    return transactions;
  }

  if (transactions && typeof transactions === 'object') {
    return (
      (Array.isArray(transactions.items) && transactions.items) ||
      (Array.isArray(transactions.rows) && transactions.rows) ||
      (Array.isArray(transactions.transactions) && transactions.transactions) ||
      []
    );
  }

  return [];
}

function normalizeIdentifier(transaction, index) {
  return String(
    transaction?.id ||
      transaction?.transactionId ||
      transaction?.reference ||
      `transaction-${index}`,
  );
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

function normalizeExpandedRows(expandedRows) {
  if (expandedRows instanceof Set) {
    return expandedRows;
  }

  if (Array.isArray(expandedRows)) {
    return new Set(expandedRows.map((value) => String(value)));
  }

  if (expandedRows && typeof expandedRows === 'object') {
    return new Set(
      Object.entries(expandedRows)
        .filter(([, expanded]) => expanded)
        .map(([identifier]) => String(identifier)),
    );
  }

  return new Set();
}

/**
 * Renders a semantic transaction table with the 5 PRD columns (Date, Description,
 * Category, Status, Amount), expandable rows, and loading, empty, error,
 * declined, pending, and unavailable states.
 */
function TransactionTable({
  caption = 'Transaction history',
  className = '',
  currency,
  emptyDescription,
  emptyTitle,
  error = null,
  expandable = true,
  expanded = false,
  expandedRows,
  isLoading = false,
  isUnavailable = false,
  items,
  loading = false,
  loadingLabel = 'Loading transactions',
  onExpand,
  onRetry,
  onToggleExpand,
  retryLabel = 'Try again',
  rows,
  showExpand = true,
  status,
  tableClassName = '',
  transactions,
  unavailable = false,
  ...props
}) {
  const [internalExpandedIds, setInternalExpandedIds] = useState(
    () => new Set(),
  );
  const resolvedTransactions = normalizeTransactions(
    transactions ?? items ?? rows,
  );
  const isCollectionLoading = loading || isLoading;
  const isCollectionUnavailable = isUnavailableState(
    unavailable,
    isUnavailable,
    status,
    error,
  );
  const normalizedStatus = String(status ?? '').trim().toLowerCase();
  const externalExpandedIdentifiers = normalizeExpandedRows(expandedRows);
  const isControlledExpansion = expandedRows !== undefined;

  const handleRowToggleExpand = (event, transaction, nextExpanded) => {
    const id = String(
      transaction?.id ||
        transaction?.transactionId ||
        transaction?.reference ||
        '',
    );

    if (!isControlledExpansion && id) {
      setInternalExpandedIds((current) => {
        const next = new Set(current);
        if (nextExpanded) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    }

    onToggleExpand?.(event, transaction, nextExpanded);
    onExpand?.(transaction, event, nextExpanded);
  };

  if (isCollectionLoading) {
    return (
      <LoadingSkeleton
        {...props}
        className={className}
        label={loadingLabel}
        rows={4}
        variant="table"
      />
    );
  }

  if (isCollectionUnavailable) {
    return (
      <ErrorState
        {...props}
        className={className}
        description={ERROR_MESSAGES.unavailable}
        onRetry={onRetry}
        retryLabel={retryLabel}
        title="Transactions are temporarily unavailable"
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
        variant="transactions"
      />
    );
  }

  if (!resolvedTransactions.length) {
    return (
      <EmptyState
        {...props}
        className={className}
        description={emptyDescription}
        onAction={onRetry}
        showAction={Boolean(onRetry)}
        title={emptyTitle}
        variant="transactions"
      />
    );
  }

  const hasPendingState =
    normalizedStatus === 'pending' ||
    resolvedTransactions.some(
      (transaction) =>
        String(transaction?.status ?? '').trim().toLowerCase() === 'pending',
    );
  const hasDeclinedState =
    normalizedStatus === 'declined' ||
    resolvedTransactions.some(
      (transaction) =>
        String(transaction?.status ?? '').trim().toLowerCase() === 'declined',
    );

  return (
    <section
      {...props}
      aria-label={caption}
      className={`space-y-3 ${className}`.trim()}
    >
      {hasPendingState ? (
        <Alert
          description="Some transactions are still being processed."
          role="status"
          title="Pending transactions"
          variant="warning"
        />
      ) : null}

      {hasDeclinedState ? (
        <Alert
          description="Declined transactions are shown for your records and did not complete."
          role="status"
          title="Declined transactions"
          variant="error"
        />
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className={`min-w-full ${tableClassName}`.trim()}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th
                  className={
                    header.key === 'amount'
                      ? 'text-right uppercase tracking-wider'
                      : 'uppercase tracking-wider'
                  }
                  key={header.key}
                  scope="col"
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedTransactions.map((transaction, index) => {
              const identifier = normalizeIdentifier(transaction, index);
              const isExpanded =
                expanded ||
                (isControlledExpansion
                  ? externalExpandedIdentifiers.has(identifier)
                  : internalExpandedIds.has(identifier)) ||
                transaction?.isExpanded === true;

              return (
                <TransactionRow
                  currency={currency}
                  expandable={expandable}
                  expanded={isExpanded}
                  index={index}
                  key={identifier}
                  onToggleExpand={handleRowToggleExpand}
                  showExpand={showExpand}
                  transaction={transaction}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

TransactionTable.displayName = 'TransactionTable';

TransactionTable.propTypes = {
  caption: () => null,
  className: () => null,
  currency: () => null,
  emptyDescription: childrenPropType,
  emptyTitle: childrenPropType,
  error: () => null,
  expandable: () => null,
  expanded: () => null,
  expandedRows: () => null,
  isLoading: () => null,
  isUnavailable: () => null,
  items: () => null,
  loading: () => null,
  loadingLabel: () => null,
  onExpand: () => null,
  onRetry: () => null,
  onToggleExpand: () => null,
  retryLabel: () => null,
  rows: () => null,
  showExpand: () => null,
  status: () => null,
  tableClassName: () => null,
  transactions: () => null,
  unavailable: () => null,
};

export {
  TABLE_HEADERS,
  isUnavailableState,
  normalizeExpandedRows,
  normalizeIdentifier,
  normalizeTransactions,
};

export default TransactionTable;
