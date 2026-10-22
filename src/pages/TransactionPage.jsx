import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import {
  ERROR_MESSAGES,
  SIMULATION_MESSAGES,
} from '../config/messages';
import {
  formatCurrency,
  formatDate,
} from '../utils/formatters';
import {
  downloadStatement,
  retrieveTransactions,
} from '../services/TransactionService';
import Alert from '../components/feedback/Alert';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';

const childrenPropType = () => null;

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  type: 'all',
  category: 'all',
  startDate: '',
  endDate: '',
});

const DEFAULT_ACCOUNT = Object.freeze({
  id: 'account-peso-savings-9034',
  name: 'Peso Savings',
  number: '•••• 9034',
  maskedAccountNumber: '•••• 9034',
  type: 'savings',
  currency: 'PHP',
  balance: 84250.75,
  availableBalance: 84250.75,
  currentBalance: 84250.75,
  status: 'active',
});

function normalizeTransactions(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    return (
      (Array.isArray(value.items) && value.items) ||
      (Array.isArray(value.rows) && value.rows) ||
      (Array.isArray(value.transactions) && value.transactions) ||
      []
    );
  }

  return [];
}

function getAccountIdentifier(account) {
  return account?.id || account?.accountId || null;
}

function getAccountNumber(account) {
  return (
    account?.maskedAccountNumber ||
    account?.accountNumber ||
    account?.number ||
    '•••• 9034'
  );
}

function getAccountTitle(account) {
  const name = account?.name || account?.title || 'Peso Savings';
  const number = getAccountNumber(account);

  return `${name} ${number}`.trim();
}

function getInitialFilters(filters) {
  return {
    ...DEFAULT_FILTERS,
    ...(filters && typeof filters === 'object' ? filters : {}),
  };
}

/**
 * Renders the Peso Savings transaction enquiry page.
 *
 * @param {object} props Component properties.
 * @param {object} props.account Account displayed by the enquiry page.
 * @param {object[]} props.transactions Optional transaction collection override.
 * @param {object} props.filters Initial transaction filters.
 * @param {boolean} props.simulateFailure Whether retrieval should fail.
 * @param {boolean} props.failureSimulation Alias for simulateFailure.
 * @param {Function} props.onRetry Callback invoked after a retry.
 * @param {Function} props.onDownload Callback invoked after a statement download.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Transaction enquiry page.
 */
function TransactionPage({
  account: providedAccount,
  className = '',
  failureSimulation = false,
  filters: providedFilters,
  onDownload,
  onRetry,
  simulateFailure = false,
  transactions: providedTransactions,
}) {
  const {
    profileId,
    selectedAccount,
    state,
  } = useCustomerProfile();

  const resolvedAccount = providedAccount || selectedAccount || DEFAULT_ACCOUNT;
  const accountId = getAccountIdentifier(resolvedAccount);
  const initialFilters = useMemo(
    () => getInitialFilters(providedFilters),
    [providedFilters],
  );
  const [filters, setFilters] = useState(initialFilters);
  const [transactions, setTransactions] = useState(() =>
    normalizeTransactions(providedTransactions),
  );
  const [isLoading, setIsLoading] = useState(
    providedTransactions === undefined,
  );
  const [error, setError] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const shouldSimulateFailure = simulateFailure || failureSimulation;
  const accountTitle = getAccountTitle(resolvedAccount);
  const accountBalance =
    resolvedAccount?.currentBalance ??
    resolvedAccount?.balance ??
    resolvedAccount?.availableBalance;
  const availableBalance =
    resolvedAccount?.availableBalance ?? accountBalance;

  const transactionQuery = useMemo(
    () => ({
      accountId,
      category: filters.category,
      endDate: filters.endDate,
      page: 1,
      pageSize: 100,
      search: filters.search,
      startDate: filters.startDate,
      state,
      status: 'all',
      type: filters.type,
      profileId,
    }),
    [
      accountId,
      filters.category,
      filters.endDate,
      filters.search,
      filters.startDate,
      filters.type,
      profileId,
      state,
    ],
  );

  useEffect(() => {
    if (providedTransactions !== undefined) {
      setTransactions(normalizeTransactions(providedTransactions));
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await retrieveTransactions({
          ...transactionQuery,
          simulateFailure: shouldSimulateFailure,
        });

        if (isMounted) {
          setTransactions(normalizeTransactions(result));
        }
      } catch (retrievalError) {
        if (isMounted) {
          setTransactions([]);
          setError(retrievalError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [
    providedTransactions,
    shouldSimulateFailure,
    transactionQuery,
  ]);

  const handleFiltersChange = (nextFilters) => {
    setFilters(getInitialFilters(nextFilters));
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    onRetry?.();
    setFilters((currentFilters) => ({
      ...currentFilters,
    }));
  };

  const handleDownload = () => {
    setDownloadError('');

    try {
      const filename = downloadStatement({
        ...transactionQuery,
        accountId: accountId || 'peso-savings-9034',
        accountIdentifier: getAccountNumber(resolvedAccount),
        filename: 'peso-savings-9034-statement-demo.txt',
      });

      onDownload?.(filename);
    } catch {
      setDownloadError(
        'The simulated statement could not be downloaded. Please try again.',
      );
    }
  };

  const displayedTransactions = normalizeTransactions(transactions);
  const latestTransaction = displayedTransactions[0];
  const lastUpdated = latestTransaction?.postedAt ||
    latestTransaction?.date ||
    latestTransaction?.createdAt;

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="transaction-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Transaction enquiry
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="transaction-page-title"
            >
              {accountTitle}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              Review recent activity, posted debits, and credits for this account.
            </p>
          </div>

          <Button
            onClick={handleDownload}
            type="button"
            variant="secondary"
          >
            Download statement
          </Button>
        </div>

        <span className="sr-only">{SIMULATION_MESSAGES.noRealTransactions}</span>
      </section>

      {downloadError ? (
        <Alert
          description={downloadError}
          role="alert"
          title="Statement download unavailable"
          variant="error"
        />
      ) : null}

      <section
        aria-labelledby="transaction-summary-title"
        className="grid gap-5 md:grid-cols-3"
      >
        <Card
          heading="Current balance"
          headingId="transaction-summary-title"
        >
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(accountBalance, {
              currency: resolvedAccount.currency || 'PHP',
            }) || '—'}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Balance for {accountTitle}
          </p>
        </Card>

        <Card heading="Available balance">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(availableBalance, {
              currency: resolvedAccount.currency || 'PHP',
            }) || '—'}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Available for withdrawal, transfers, and bill payments
          </p>
        </Card>

        <Card heading="Last updated">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {lastUpdated ? formatDate(lastUpdated) : '—'}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            {displayedTransactions.length} transaction
            {displayedTransactions.length === 1 ? '' : 's'} shown
          </p>
        </Card>
      </section>

      <TransactionFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={() => setFilters({ ...DEFAULT_FILTERS })}
      />

      <section
        aria-labelledby="transaction-history-title"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-foreground"
              id="transaction-history-title"
            >
              Transaction history
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              All posted and cleared transactions.
            </p>
          </div>

          {error ? (
            <span className="text-sm text-danger-700">
              {ERROR_MESSAGES.loadingTransactions}
            </span>
          ) : null}
        </div>

        <TransactionTable
          currency={resolvedAccount.currency || 'PHP'}
          error={error}
          loading={isLoading}
          onRetry={handleRetry}
          retryLabel="Retry loading transactions"
          transactions={displayedTransactions}
        />
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph). Deposits are insured by PDIC up to PHP 500,000 per depositor.
      </p>
    </div>
  );
}

TransactionPage.displayName = 'TransactionPage';

TransactionPage.propTypes = {
  account: () => null,
  className: () => null,
  failureSimulation: () => null,
  filters: () => null,
  onDownload: () => null,
  onRetry: () => null,
  simulateFailure: () => null,
  transactions: () => null,
};

export {
  DEFAULT_ACCOUNT,
  DEFAULT_FILTERS,
  getAccountIdentifier,
  getAccountNumber,
  getAccountTitle,
  normalizeTransactions,
};

export default TransactionPage;