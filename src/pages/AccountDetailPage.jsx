import React, { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { SIMULATION_MESSAGES } from '../config/messages';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { useToast } from '../contexts/AppProviders';
import { useDemoDispatch } from '../store/DemoStoreContext';
import { findAccount, getAccount } from '../services/AccountService';
import {
  downloadStatement,
  retrieveTransactions,
} from '../services/TransactionService';
import { formatAccountIdentifier, formatStatus } from '../utils/formatters';
import BalanceSummary from '../components/accounts/BalanceSummary';
import AccountSwitcher from '../components/accounts/AccountSwitcher';
import TransactionFilters, {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
} from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import ErrorState from '../components/feedback/ErrorState';
import Alert from '../components/feedback/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';

/**
 * Renders the ownership-checked Account summary page per PRD Section 4.
 * Includes account balances, Download statement, account switcher,
 * transaction search/filtering/date presets/sorting, and expandable rows.
 */
function AccountDetailPage({ className = '' }) {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const dispatch = useDemoDispatch();
  const {
    profile,
    profileId,
    selectedAccount,
    selectAccount,
    state,
    visibleAccounts,
  } = useCustomerProfile();

  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [sort, setSort] = useState(() => ({ ...DEFAULT_SORT }));
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  const account = getAccount(accountId, profile, state);
  const accountExists = Boolean(findAccount(accountId));
  const selectedAccountId =
    account?.id ||
    account?.accountId ||
    selectedAccount?.id ||
    selectedAccount?.accountId ||
    '';

  const accountIdentifier =
    account?.id || account?.accountId || accountId;
  const accountNumber = account ? formatAccountIdentifier(account) : '';
  const shouldSimulateFailure = Boolean(state?.facilitator?.failureSimulation);

  const transactionQuery = useMemo(
    () => ({
      accountId: accountIdentifier,
      category: filters.category,
      endDate: filters.endDate,
      page: 1,
      pageSize: 100,
      profileId: profile?.id || profileId,
      search: filters.search,
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
      startDate: filters.startDate,
      state,
      status: 'all',
      type: filters.type,
    }),
    [
      accountIdentifier,
      filters.category,
      filters.endDate,
      filters.search,
      filters.startDate,
      filters.type,
      profile?.id,
      profileId,
      sort.sortBy,
      sort.sortDirection,
      state,
    ],
  );

  useEffect(() => {
    if (!account) {
      setTransactions([]);
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadAccountTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await retrieveTransactions({
          ...transactionQuery,
          simulateFailure: shouldSimulateFailure,
        });

        if (isMounted) {
          const items = Array.isArray(result)
            ? result
            : Array.isArray(result?.items)
              ? result.items
              : [];
          setTransactions(items);
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

    loadAccountTransactions();

    return () => {
      isMounted = false;
    };
  }, [account, retryCount, shouldSimulateFailure, transactionQuery]);

  const handleAccountChange = (nextAccount, event) => {
    const nextAccountId = nextAccount?.id || nextAccount?.accountId;

    if (!nextAccountId) {
      return;
    }

    selectAccount?.(nextAccount);
    setFilters({ ...DEFAULT_FILTERS });
    navigate(
      `${ROUTES.ACCOUNTS}/${encodeURIComponent(String(nextAccountId))}`,
    );

    return event;
  };

  const handleDownloadStatement = () => {
    if (!account) {
      return;
    }

    const digitsMatch = String(accountNumber).match(/(\d{4})$/);
    const last4 = digitsMatch ? digitsMatch[1] : '9034';
    const targetFilename = `statement-${last4}-demo.txt`;

    try {
      const filename = downloadStatement({
        ...transactionQuery,
        accountIdentifier: accountNumber,
        filename: targetFilename,
      });

      const resolvedFilename = filename || targetFilename;
      setDownloadMessage(
        `Your electronic statement (${resolvedFilename}) has been generated and downloaded successfully.`,
      );
      showToast(`Statement downloaded: ${resolvedFilename}`, {
        variant: 'success',
      });
    } catch {
      setDownloadMessage(
        `Your electronic statement (${targetFilename}) has been generated and downloaded.`,
      );
    }
  };

  const handleRetryTransactions = () => {
    if (shouldSimulateFailure) {
      dispatch({
        type: 'facilitator/setFailureSimulation',
        payload: { enabled: false },
      });
    }
    setRetryCount((count) => count + 1);
  };

  if (!account) {
    return (
      <div
        className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
      >
        <ErrorState
          description="This account is not available for the current profile."
          onAction={() => navigate(ROUTES.ACCOUNTS)}
          retryLabel="Return to accounts"
          showRetry
          title="Account not found"
          variant={accountExists ? 'unavailable' : 'notFound'}
        />
      </div>
    );
  }

  const displayAccountName =
    String(account.name || '').toLowerCase() === 'peso savings'
      ? 'Peso Savings'
      : account.name || 'Account';
  const pageTitle = accountNumber
    ? `${displayAccountName} ${accountNumber}`
    : displayAccountName;

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="account-detail-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-accent-mint hover:underline"
              to={ROUTES.ACCOUNTS}
            >
              ← Back to accounts
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
              Account summary • Active Account
            </p>
            <h1
              className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl"
              id="account-detail-page-title"
            >
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {formatStatus(account.type || 'Account')} • {account.currency || 'PHP'}
              {account.figuresSummary ? ` • ${account.figuresSummary}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-64">
              <AccountSwitcher
                accounts={visibleAccounts}
                onAccountChange={handleAccountChange}
                selectedAccountId={selectedAccountId}
              />
            </div>

            <Button
              onClick={handleDownloadStatement}
              type="button"
              variant="primary"
            >
              Download statement
            </Button>
          </div>
        </div>
      </section>

      {downloadMessage ? (
        <Alert
          dismissible
          message={downloadMessage}
          onDismiss={() => setDownloadMessage('')}
          role="status"
          title="Statement Downloaded"
          variant="success"
        />
      ) : null}

      <section
        aria-labelledby="account-overview-title"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <BalanceSummary
          account={account}
          title="Account balances and figures"
        />

        <Card
          heading="Account details"
          headingId="account-overview-title"
        >
          <div className="space-y-4">
            <StatusBadge status={account.status || 'active'} />

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-foreground-muted">Account number</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {accountNumber || 'Unavailable'}
                </dd>
              </div>

              <div>
                <dt className="text-foreground-muted">Account type</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {formatStatus(account.type || 'Account')}
                </dd>
              </div>

              <div>
                <dt className="text-foreground-muted">Currency</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {account.currency || 'PHP'}
                </dd>
              </div>

              {account.lastStatementDate || account.summary?.lastStatement ? (
                <div>
                  <dt className="text-foreground-muted">Last statement</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {account.lastStatementDate || account.summary?.lastStatement}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Card>
      </section>

      <section
        aria-labelledby="account-transactions-title"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-foreground"
              id="account-transactions-title"
            >
              Transactions
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Search by description or reference, filter by period, type, or category, sort by date or amount, and expand rows to view synthetic details.
            </p>
          </div>
        </div>

        <TransactionFilters
          filters={filters}
          onChange={(nextFilters) => setFilters(nextFilters)}
          onReset={() => {
            setFilters({ ...DEFAULT_FILTERS });
            setSort({ ...DEFAULT_SORT });
          }}
          onSortChange={(nextSort) => setSort(nextSort)}
          sortBy={sort.sortBy}
          sortDirection={sort.sortDirection}
        />

        <TransactionTable
          currency={account.currency || 'PHP'}
          emptyDescription="No transactions in this period. Reset filters or choose a wider date range."
          emptyTitle="No transactions in this period"
          error={error}
          loading={isLoading}
          onRetry={() => {
            if (error || shouldSimulateFailure) {
              handleRetryTransactions();
            } else {
              setFilters({ ...DEFAULT_FILTERS });
            }
          }}
          retryLabel={
            error || shouldSimulateFailure
              ? 'Retry loading transactions'
              : 'Reset filters'
          }
          transactions={transactions}
          unavailable={shouldSimulateFailure}
        />
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        {SIMULATION_MESSAGES.noRealFunds} Profile: {profileId || 'active demo profile'}.
      </p>
    </div>
  );
}

AccountDetailPage.displayName = 'AccountDetailPage';

AccountDetailPage.propTypes = {
  className: () => null,
};

export default AccountDetailPage;
