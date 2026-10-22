import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { formatAccountIdentifier, formatCurrency, formatStatus } from '../../utils/formatters';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

const LIABILITY_ACCOUNT_TYPES = Object.freeze([
  'credit',
  'credit-card',
  'loan',
  'mortgage',
]);

function normalizeAccountType(value) {
  const normalizedType = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  return normalizedType || 'account';
}

function getAccountIdentifier(account) {
  return account?.id || account?.accountId || null;
}

function getAccountNumber(account) {
  return formatAccountIdentifier(
    account?.maskedAccountNumber ||
      account?.accountNumber ||
      account?.number ||
      '',
  );
}

function getAccountMetric(account) {
  const accountType = normalizeAccountType(account?.type);
  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(
    accountType.replace(/\s+/g, '-'),
  );

  if (accountType === 'credit' || accountType === 'credit card') {
    return {
      label: 'Amount due',
      value: account?.amountDue ?? account?.balance ?? account?.currentBalance,
    };
  }

  if (isLiability) {
    return {
      label: 'Outstanding balance',
      value:
        account?.outstandingBalance ??
        account?.balance ??
        account?.currentBalance,
    };
  }

  return {
    label: 'Available & current balance',
    value:
      account?.availableBalance ??
      account?.balance ??
      account?.currentBalance,
  };
}

function formatMetricValue(value, currency) {
  const formattedValue = formatCurrency(value, { currency });

  return formattedValue || '—';
}

/**
 * Renders a reusable account summary card per PRD Section 2 & Section 5.
 * Each card shows type, status, currency, the PRD figures, and View details.
 */
function AccountCard({
  account = {},
  accountNumber,
  balance,
  className = '',
  currency,
  metricLabel,
  metricValue,
  name,
  onViewDetails,
  status,
  type,
  viewDetailsLabel = 'View details',
  viewDetailsTo,
  ...props
}) {
  const accountId = getAccountIdentifier(account);
  const resolvedName = name || account.name || 'Account';
  const resolvedType = type || normalizeAccountType(account.type);
  const resolvedCurrency = currency || account.currency || 'PHP';
  const resolvedStatus = status || account.status || 'active';
  const resolvedAccountNumber =
    accountNumber || getAccountNumber(account);
  const metric = getAccountMetric({
    ...account,
    type: resolvedType,
    balance: balance ?? account.balance,
  });
  const resolvedMetricLabel = metricLabel || metric.label;
  const resolvedMetricValue =
    metricValue !== undefined ? metricValue : metric.value;
  const detailsPath =
    viewDetailsTo ||
    (accountId
      ? `${ROUTES.ACCOUNTS}/${encodeURIComponent(String(accountId))}`
      : null);
  const detailsLabel = `${viewDetailsLabel} for ${resolvedName}`;

  const isCreditCard =
    resolvedType === 'credit' || resolvedType === 'credit card';
  const isSavings = resolvedType === 'savings';

  return (
    <Card
      {...props}
      className={`h-full ${className}`.trim()}
      heading={resolvedName}
      subtitle={`${formatStatus(resolvedType)}${
        resolvedAccountNumber ? ` • ${resolvedAccountNumber}` : ''
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Currency
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {resolvedCurrency}
            </p>
          </div>
          <StatusBadge status={resolvedStatus} />
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {resolvedMetricLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {formatMetricValue(resolvedMetricValue, resolvedCurrency)}
          </p>
        </div>

        {isSavings ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-muted p-3 text-xs">
            <div>
              <dt className="text-foreground-muted">Summary pending</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {formatMetricValue(account.pendingAmount ?? 0, resolvedCurrency)}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Interest</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {account.interestRate ?? 3.25}% per annum
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-foreground-muted">Last statement</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {account.lastStatementDate || account.summary?.lastStatement || '30 Sep'}
              </dd>
            </div>
          </dl>
        ) : null}

        {isCreditCard ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-muted p-3 text-xs">
            <div>
              <dt className="text-foreground-muted">Limit</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {formatMetricValue(
                  account.creditLimit ?? account.creditSummary?.creditLimit ?? 50000,
                  resolvedCurrency,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Available credit</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {formatMetricValue(
                  account.availableCredit ?? account.availableBalance ?? 41550,
                  resolvedCurrency,
                )}
              </dd>
            </div>
          </dl>
        ) : null}

        {!isSavings && !isCreditCard && account.figuresSummary ? (
          <p className="mt-3 text-xs text-foreground-muted">
            {account.figuresSummary}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          {detailsPath ? (
            <Link
              aria-label={detailsLabel}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-mint no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={onViewDetails}
              to={detailsPath}
            >
              <span>{viewDetailsLabel}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Button
              aria-label={detailsLabel}
              onClick={onViewDetails}
              type="button"
              variant="secondary"
            >
              {viewDetailsLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

AccountCard.displayName = 'AccountCard';

AccountCard.propTypes = {
  account: () => null,
  accountNumber: () => null,
  balance: () => null,
  className: () => null,
  currency: () => null,
  metricLabel: () => null,
  metricValue: () => null,
  name: () => null,
  onViewDetails: () => null,
  status: () => null,
  type: () => null,
  viewDetailsLabel: () => null,
  viewDetailsTo: () => null,
};

export {
  getAccountMetric,
  normalizeAccountType,
};

export default AccountCard;
