import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import Card from '../ui/Card';

const childrenPropType = () => null;

function toFiniteNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number.parseFloat(value.replace(/,/g, ''));

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function getAccountSummaries(account = {}) {
  return {
    credit: account.creditSummary || {},
    loan: account.loanSummary || {},
    savings: account.savingsSummary || {},
    summary: account.summary || {},
  };
}

function getMetricValue(account, metric) {
  const summaries = getAccountSummaries(account);

  switch (metric) {
    case 'availableBalance':
      return firstDefined(
        account.availableBalance,
        account.availableFunds,
        summaries.summary.availableFunds,
      );
    case 'currentBalance':
      return firstDefined(
        account.currentBalance,
        account.balance,
        summaries.summary.currentBalance,
      );
    case 'pendingAmount':
      return firstDefined(
        account.pendingAmount,
        account.pendingBalance,
        account.pendingTransactions,
        summaries.summary.pendingAmount,
      );
    case 'amountDue':
      return firstDefined(
        account.amountDue,
        account.paymentDue,
        summaries.credit.minimumPayment,
        summaries.loan.monthlyPayment,
      );
    case 'availableCredit':
      return firstDefined(
        account.availableCredit,
        summaries.credit.availableCredit,
        summaries.summary.availableCredit,
      );
    case 'creditLimit':
      return firstDefined(
        account.creditLimit,
        summaries.credit.creditLimit,
        summaries.summary.creditLimit,
      );
    case 'outstandingBalance':
      return firstDefined(
        account.outstandingBalance,
        summaries.credit.outstandingBalance,
        summaries.loan.outstandingBalance,
        summaries.summary.outstandingBalance,
        account.balance,
      );
    case 'interestRate':
      return firstDefined(
        account.interestRate,
        summaries.credit.interestRate,
        summaries.loan.interestRate,
        summaries.savings.interestRate,
        summaries.summary.interestRate,
      );
    default:
      return undefined;
  }
}

function formatMoneyValue(value, currency) {
  const numericValue = toFiniteNumber(value);

  return numericValue === null
    ? '—'
    : formatCurrency(numericValue, { currency });
}

function formatInterestRate(value) {
  const numericValue = toFiniteNumber(value);

  return numericValue === null ? '—' : `${numericValue.toFixed(2)}%`;
}

function createMetric(label, value, options = {}) {
  const {
    currency = 'PHP',
    format = 'money',
    key = label,
  } = options;

  const numericValue = toFiniteNumber(value);
  const displayValue =
    format === 'interest'
      ? formatInterestRate(value)
      : formatMoneyValue(value, currency);

  return {
    key,
    label,
    value: numericValue,
    displayValue,
    ariaLabel: `${label}: ${displayValue}`,
  };
}

function getBalanceMetrics(account = {}, overrides = {}) {
  const currency = overrides.currency || account.currency || 'PHP';
  const values = {
    availableBalance: firstDefined(
      overrides.availableBalance,
      getMetricValue(account, 'availableBalance'),
    ),
    currentBalance: firstDefined(
      overrides.currentBalance,
      overrides.balance,
      getMetricValue(account, 'currentBalance'),
    ),
    pendingAmount: firstDefined(
      overrides.pendingAmount,
      getMetricValue(account, 'pendingAmount'),
    ),
    amountDue: firstDefined(
      overrides.amountDue,
      getMetricValue(account, 'amountDue'),
    ),
    availableCredit: firstDefined(
      overrides.availableCredit,
      getMetricValue(account, 'availableCredit'),
    ),
    creditLimit: firstDefined(
      overrides.creditLimit,
      getMetricValue(account, 'creditLimit'),
    ),
    outstandingBalance: firstDefined(
      overrides.outstandingBalance,
      getMetricValue(account, 'outstandingBalance'),
    ),
    interestRate: firstDefined(
      overrides.interestRate,
      getMetricValue(account, 'interestRate'),
    ),
  };

  const metrics = [];
  const accountType = String(account.type || '').toLowerCase();

  if (values.currentBalance !== undefined) {
    metrics.push(
      createMetric('Current balance', values.currentBalance, {
        currency,
        key: 'currentBalance',
      }),
    );
  }

  if (values.availableBalance !== undefined) {
    metrics.push(
      createMetric('Available balance', values.availableBalance, {
        currency,
        key: 'availableBalance',
      }),
    );
  }

  if (values.pendingAmount !== undefined) {
    metrics.push(
      createMetric('Pending amount', values.pendingAmount, {
        currency,
        key: 'pendingAmount',
      }),
    );
  }

  if (values.amountDue !== undefined) {
    metrics.push(
      createMetric('Amount due', values.amountDue, {
        currency,
        key: 'amountDue',
      }),
    );
  }

  if (values.outstandingBalance !== undefined && (
    accountType.includes('credit') ||
    accountType.includes('loan') ||
    accountType.includes('mortgage') ||
    values.outstandingBalance !== values.currentBalance
  )) {
    metrics.push(
      createMetric('Outstanding balance', values.outstandingBalance, {
        currency,
        key: 'outstandingBalance',
      }),
    );
  }

  if (values.availableCredit !== undefined) {
    metrics.push(
      createMetric('Available credit', values.availableCredit, {
        currency,
        key: 'availableCredit',
      }),
    );
  }

  if (values.creditLimit !== undefined) {
    metrics.push(
      createMetric('Credit limit', values.creditLimit, {
        currency,
        key: 'creditLimit',
      }),
    );
  }

  if (values.interestRate !== undefined) {
    metrics.push(
      createMetric('Interest rate', values.interestRate, {
        format: 'interest',
        key: 'interestRate',
      }),
    );
  }

  return metrics;
}

/**
 * Renders an accessible account balance summary.
 *
 * @param {object} props Component properties.
 * @param {object} props.account Account whose balance details are displayed.
 * @param {string|number} props.balance Current-balance override.
 * @param {string|number} props.currentBalance Current-balance override.
 * @param {string|number} props.availableBalance Available-balance override.
 * @param {string|number} props.pendingAmount Pending-amount override.
 * @param {string|number} props.amountDue Amount-due override.
 * @param {string|number} props.availableCredit Available-credit override.
 * @param {string|number} props.creditLimit Credit-limit override.
 * @param {string|number} props.outstandingBalance Outstanding-balance override.
 * @param {string|number} props.interestRate Interest-rate override.
 * @param {string} props.currency Currency-code override.
 * @param {string} props.title Summary heading.
 * @param {string} props.className Additional card classes.
 * @returns {JSX.Element} Balance summary card.
 */
function BalanceSummary({
  account = {},
  amountDue,
  availableBalance,
  availableCredit,
  balance,
  className = '',
  creditLimit,
  currency,
  currentBalance,
  interestRate,
  outstandingBalance,
  pendingAmount,
  title = 'Balance summary',
  ...props
}) {
  const metrics = getBalanceMetrics(account, {
    amountDue,
    availableBalance,
    availableCredit,
    balance,
    creditLimit,
    currency,
    currentBalance,
    interestRate,
    outstandingBalance,
    pendingAmount,
  });

  return (
    <Card
      {...props}
      className={className}
      heading={title}
    >
      {metrics.length ? (
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.key}>
              <dt className="text-sm text-foreground-muted">
                {metric.label}
              </dt>
              <dd
                aria-label={metric.ariaLabel}
                className="mt-1 text-xl font-semibold tracking-tight text-foreground"
              >
                {metric.displayValue}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-foreground-muted">
          Balance information is not available.
        </p>
      )}
    </Card>
  );
}

BalanceSummary.displayName = 'BalanceSummary';

BalanceSummary.propTypes = {
  account: () => null,
  amountDue: () => null,
  availableBalance: () => null,
  availableCredit: () => null,
  balance: () => null,
  className: () => null,
  creditLimit: () => null,
  currency: () => null,
  currentBalance: () => null,
  interestRate: () => null,
  outstandingBalance: () => null,
  pendingAmount: () => null,
  title: () => null,
};

export {
  createMetric,
  formatInterestRate,
  getBalanceMetrics,
  getMetricValue,
};

export default BalanceSummary;