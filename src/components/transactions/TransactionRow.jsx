import React from 'react';
import {
  formatCurrency,
  formatDate,
  formatMoneyInOut,
  formatStatus,
  isMoneyIn,
  isMoneyOut,
} from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';

const COLUMN_COUNT = 5;

function normalizeDirection(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  if (['in', 'credit', 'money-in', 'moneyin', 'received', 'deposit'].includes(normalizedValue)) {
    return 'in';
  }

  if (['out', 'debit', 'money-out', 'moneyout', 'sent', 'withdrawal'].includes(normalizedValue)) {
    return 'out';
  }

  return '';
}

function getTransactionDirection(transaction = {}) {
  const explicitDirection = normalizeDirection(
    transaction.direction || transaction.flow || transaction.moneyDirection,
  );

  if (explicitDirection) {
    return explicitDirection;
  }

  if (isMoneyIn(transaction)) {
    return 'in';
  }

  if (isMoneyOut(transaction)) {
    return 'out';
  }

  return '';
}

function getDirectionLabel(direction) {
  if (direction === 'in') {
    return 'Money in';
  }

  if (direction === 'out') {
    return 'Money out';
  }

  return 'Transaction amount';
}

function getTransactionDescription(transaction = {}) {
  return (
    transaction.description ||
    transaction.merchant ||
    transaction.payee ||
    transaction.title ||
    'Transaction'
  );
}

function getTransactionCategory(transaction = {}) {
  return (
    transaction.category ||
    transaction.type ||
    'Uncategorized'
  );
}

function getTransactionStatus(transaction = {}) {
  return transaction.status || 'posted';
}

function getTransactionDate(transaction = {}) {
  return (
    transaction.displayDate ||
    formatDate(
      transaction.postedAt ||
        transaction.date ||
        transaction.createdAt,
    ) ||
    '—'
  );
}

function getTransactionAmount(transaction = {}, currency) {
  const resolvedCurrency = currency || transaction.currency || 'PHP';
  const direction = getTransactionDirection(transaction);
  const status = String(transaction.status || '').toLowerCase();

  if (status === 'declined' && Number(transaction.amount) === 0) {
    return formatCurrency(0, { currency: resolvedCurrency });
  }

  const baseFormatted = formatCurrency(Math.abs(Number(transaction.amount || 0)), {
    currency: resolvedCurrency,
  });

  if (direction === 'in') {
    return `+ ${baseFormatted}`;
  }

  if (direction === 'out') {
    return `− ${baseFormatted}`;
  }

  return (
    transaction.displayAmount ||
    formatMoneyInOut(transaction.amount, direction, {
      currency: resolvedCurrency,
    }) ||
    baseFormatted ||
    '—'
  );
}

function getTransactionIdentifier(transaction = {}, index) {
  return String(
    transaction.id ||
      transaction.transactionId ||
      transaction.reference ||
      `transaction-${index}`,
  );
}

/**
 * Renders an expandable, zebra-striped transaction table row per PRD Section 4 & Section 5.
 * Columns: Date, Description, Category, Status, Amount.
 * Running balance is not shown. Posting date matches transaction date.
 */
function TransactionRow({
  className = '',
  currency,
  expandable = true,
  expanded,
  index = 0,
  isExpanded,
  onExpand,
  onToggleExpand,
  row,
  showExpand = true,
  transaction,
  ...props
}) {
  const resolvedTransaction = transaction || row || {};
  const resolvedExpanded = isExpanded ?? expanded ?? false;
  const canExpand = expandable && showExpand;
  const direction = getTransactionDirection(resolvedTransaction);
  const directionLabel = getDirectionLabel(direction);
  const description = getTransactionDescription(resolvedTransaction);
  const category = getTransactionCategory(resolvedTransaction);
  const status = getTransactionStatus(resolvedTransaction);
  const statusLabel = resolvedTransaction.statusLabel || formatStatus(status);
  const transactionId = getTransactionIdentifier(
    resolvedTransaction,
    index,
  );
  const resolvedCurrency =
    currency || resolvedTransaction.currency || 'PHP';
  const amount = getTransactionAmount(
    resolvedTransaction,
    resolvedCurrency,
  );
  const dateDisplay = getTransactionDate(resolvedTransaction);
  const rowClassName = [
    index % 2 === 1 ? 'bg-surface-muted' : 'bg-surface',
    'border-b border-border align-top transition-colors',
    resolvedExpanded ? 'bg-primary-50/40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleToggle = (event) => {
    onToggleExpand?.(event, resolvedTransaction, !resolvedExpanded);
    onExpand?.(resolvedTransaction, event, !resolvedExpanded);
  };

  const detailItems = [
    {
      label: 'Posting date',
      value: dateDisplay,
    },
    {
      label: 'Transaction date',
      value: dateDisplay,
    },
    {
      label: 'Reference number',
      value: resolvedTransaction.reference || 'REF-9034-1188',
    },
  ];

  return (
    <>
      <tr
        {...props}
        aria-expanded={canExpand ? resolvedExpanded : undefined}
        className={rowClassName}
        data-transaction-id={transactionId}
      >
        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-foreground-muted">
          {canExpand ? (
            <button
              aria-controls={
                resolvedExpanded
                  ? `${transactionId}-details`
                  : undefined
              }
              aria-expanded={resolvedExpanded}
              aria-label={`${resolvedExpanded ? 'Collapse' : 'Expand'} details for ${description}`}
              className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleToggle}
              type="button"
            >
              <span aria-hidden="true">
                {resolvedExpanded ? '−' : '+'}
              </span>
            </button>
          ) : null}
          <time
            dateTime={
              resolvedTransaction.postedAt ||
              resolvedTransaction.date ||
              resolvedTransaction.createdAt ||
              undefined
            }
          >
            {dateDisplay}
          </time>
        </td>

        <th
          className="min-w-48 px-4 py-3.5 text-left text-sm font-semibold text-foreground"
          scope="row"
        >
          <span>{description}</span>
          {resolvedTransaction.reference ? (
            <span className="mt-0.5 block font-mono text-xs font-normal text-foreground-muted">
              Ref: {resolvedTransaction.reference}
            </span>
          ) : null}
        </th>

        <td className="px-4 py-3.5 text-sm text-foreground-muted">
          {formatStatus(category)}
        </td>

        <td className="px-4 py-3.5">
          <StatusBadge label={statusLabel} status={status} />
        </td>

        <td
          aria-label={`${directionLabel}: ${amount}`}
          className="whitespace-nowrap px-4 py-3.5 text-right text-sm"
        >
          <span
            className={`block font-semibold ${
              direction === 'in'
                ? 'text-accent-mint'
                : 'text-foreground'
            }`}
          >
            {amount}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-foreground-muted">
            {directionLabel}
          </span>
        </td>
      </tr>

      {resolvedExpanded ? (
        <tr
          className="border-b border-border bg-surface-muted"
          id={`${transactionId}-details`}
        >
          <td className="px-4 pb-4 pt-2" colSpan={COLUMN_COUNT}>
            <div className="ml-9 rounded-lg border border-border bg-surface p-4">
              <dl className="grid gap-4 sm:grid-cols-3">
                {detailItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 border-t border-border pt-3 text-xs font-medium text-foreground-muted">
                Note: Running balance is not displayed for this account view.
              </p>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

TransactionRow.displayName = 'TransactionRow';

TransactionRow.propTypes = {
  className: () => null,
  currency: () => null,
  expandable: () => null,
  expanded: () => null,
  index: () => null,
  isExpanded: () => null,
  onExpand: () => null,
  onToggleExpand: () => null,
  row: () => null,
  showExpand: () => null,
  transaction: () => null,
};

export {
  getDirectionLabel,
  getTransactionAmount,
  getTransactionCategory,
  getTransactionDate,
  getTransactionDescription,
  getTransactionDirection,
  getTransactionIdentifier,
  getTransactionStatus,
};

export default TransactionRow;
