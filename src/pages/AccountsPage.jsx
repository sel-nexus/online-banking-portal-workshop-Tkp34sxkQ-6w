import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import AccountGrid from '../components/accounts/AccountGrid';
import AccountSwitcher from '../components/accounts/AccountSwitcher';
import { ERROR_MESSAGES, SIMULATION_MESSAGES } from '../config/messages';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { useDemoDispatch } from '../store/DemoStoreContext';
import { retrieveAccounts } from '../services/AccountService';

const childrenPropType = () => null;

function normalizeAccounts(accounts) {
  return Array.isArray(accounts) ? accounts : [];
}

function getAccountIdentifier(account) {
  return account?.id || account?.accountId || null;
}

/**
 * Renders the active profile's owned accounts with local retrieval states and
 * profile-scoped account selection.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.accounts Optional account collection override.
 * @param {string|number} props.selectedAccountId Selected account identifier.
 * @param {Function} props.onAccountChange Callback invoked after account selection.
 * @param {Function} props.onRetry Callback invoked when account retrieval is retried.
 * @param {boolean} props.simulateFailure Whether to simulate retrieval failure.
 * @param {boolean} props.failureSimulation Alias for simulateFailure.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Accounts page.
 */
function AccountsPage({
  accounts: providedAccounts,
  className = '',
  failureSimulation = false,
  onAccountChange,
  onRetry,
  selectedAccountId,
  simulateFailure = false,
}) {
  const {
    profile,
    profileId,
    selectedAccount,
    selectAccount,
    state,
    visibleAccounts,
  } = useCustomerProfile();
  const dispatch = useDemoDispatch();
  const [accounts, setAccounts] = useState(() =>
    normalizeAccounts(providedAccounts ?? visibleAccounts),
  );
  const [isLoading, setIsLoading] = useState(providedAccounts === undefined);
  const [error, setError] = useState(null);
  const [retryVersion, setRetryVersion] = useState(0);

  const shouldSimulateFailure =
    simulateFailure ||
    failureSimulation ||
    Boolean(state?.facilitator?.failureSimulation);
  const resolvedSelectedAccountId =
    selectedAccountId ?? getAccountIdentifier(selectedAccount);

  const loadAccounts = useCallback(async () => {
    if (providedAccounts !== undefined) {
      setAccounts(normalizeAccounts(providedAccounts));
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const retrievedAccounts = await retrieveAccounts({
        profileId,
        simulateFailure: shouldSimulateFailure,
        state,
      });

      setAccounts(normalizeAccounts(retrievedAccounts));
    } catch (retrievalError) {
      setAccounts([]);
      setError(retrievalError);
    } finally {
      setIsLoading(false);
    }
  }, [
    profileId,
    providedAccounts,
    shouldSimulateFailure,
    state,
  ]);

  useEffect(() => {
    let isMounted = true;

    const retrieveProfileAccounts = async () => {
      if (providedAccounts !== undefined) {
        if (isMounted) {
          setAccounts(normalizeAccounts(providedAccounts));
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const retrievedAccounts = await retrieveAccounts({
          profileId,
          simulateFailure: shouldSimulateFailure,
          state,
        });

        if (isMounted) {
          setAccounts(normalizeAccounts(retrievedAccounts));
        }
      } catch (retrievalError) {
        if (isMounted) {
          setAccounts([]);
          setError(retrievalError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    retrieveProfileAccounts();

    return () => {
      isMounted = false;
    };
  }, [
    profileId,
    providedAccounts,
    retryVersion,
    shouldSimulateFailure,
    state,
  ]);

  const handleRetry = () => {
    if (state?.facilitator?.failureSimulation) {
      dispatch({
        type: 'facilitator/setFailureSimulation',
        payload: { enabled: false },
      });
    }
    setRetryVersion((version) => version + 1);
    onRetry?.();
  };

  const handleAccountChange = (event, account) => {
    if (account) {
      selectAccount?.(account);
      onAccountChange?.(account, event);
    }
  };

  const profileName =
    profile?.firstName ||
    profile?.fullName ||
    profile?.name ||
    'your';

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="accounts-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              BPI Online Banking
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="accounts-page-title"
            >
              Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Manage your BPI deposit accounts, view balances, and download official statements.
            </p>
          </div>

          <div className="w-full lg:max-w-sm">
            <AccountSwitcher
              accounts={accounts}
              onAccountChange={handleAccountChange}
              selectedAccountId={resolvedSelectedAccountId}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="owned-accounts-title" className="space-y-4">
        <div>
          <h2
            className="text-xl font-semibold text-foreground"
            id="owned-accounts-title"
          >
            Accounts available to you
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Active accounts associated with your online banking profile.
          </p>
        </div>

        <AccountGrid
          accounts={accounts}
          error={error}
          loading={isLoading}
          onRetry={handleRetry}
          retryLabel="Retry loading accounts"
        />
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph). Deposits are insured by PDIC up to PHP 500,000 per depositor.
      </p>
    </div>
  );
}

AccountsPage.displayName = 'AccountsPage';

AccountsPage.propTypes = {
  accounts: () => null,
  className: () => null,
  failureSimulation: () => null,
  onAccountChange: () => null,
  onRetry: () => null,
  selectedAccountId: () => null,
  simulateFailure: () => null,
};

export {
  getAccountIdentifier,
  normalizeAccounts,
};

export default AccountsPage;