import React, {
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useCustomerProfile } from '../../contexts/CustomerProfileContext';

const childrenPropType = () => null;

function getAccountIdentifier(account) {
  return account?.id || account?.accountId || null;
}

function getAccountLabel(account) {
  return (
    account?.name ||
    account?.title ||
    `Account ${getAccountIdentifier(account) || ''}`.trim()
  );
}

function getAccountNumber(account) {
  return (
    account?.maskedAccountNumber ||
    account?.accountNumber ||
    account?.number ||
    ''
  );
}

function normalizeAccounts(accounts) {
  return Array.isArray(accounts) ? accounts : [];
}

function filterProfileAccounts(accounts, visibleAccounts) {
  const allowedIdentifiers = new Set(
    normalizeAccounts(visibleAccounts)
      .map(getAccountIdentifier)
      .filter((identifier) => identifier !== null && identifier !== undefined)
      .map((identifier) => String(identifier)),
  );

  return normalizeAccounts(accounts).filter((account) => {
    const identifier = getAccountIdentifier(account);

    return (
      identifier !== null &&
      identifier !== undefined &&
      allowedIdentifiers.has(String(identifier))
    );
  });
}

/**
 * Renders a profile-scoped account selection control.
 *
 * Account identifiers are resolved against the active profile's visible
 * accounts before selection changes are applied. Unknown and foreign account
 * identifiers are ignored.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.accounts Optional account choices.
 * @param {object[]} props.items Alias for accounts.
 * @param {string|number} props.selectedAccountId Selected account identifier.
 * @param {string|number} props.value Alias for selectedAccountId.
 * @param {Function} props.onChange Selection-change callback.
 * @param {Function} props.onAccountChange Alias for onChange.
 * @param {string} props.label Accessible control label.
 * @param {string} props.id Control identifier.
 * @param {string} props.placeholder Placeholder option label.
 * @param {boolean} props.disabled Whether the control is disabled.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Account selection control.
 */
function AccountSwitcher({
  accounts: providedAccounts,
  className = '',
  disabled = false,
  id,
  items,
  label = 'Select account',
  onAccountChange,
  onChange,
  placeholder = 'Select an account',
  selectedAccountId,
  value,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `account-switcher-${generatedId}`;
  const { selectAccount, selectedAccount, visibleAccounts } =
    useCustomerProfile();

  const profileAccounts = useMemo(
    () => normalizeAccounts(visibleAccounts),
    [visibleAccounts],
  );
  const accounts = useMemo(() => {
    const sourceAccounts =
      providedAccounts === undefined ? items : providedAccounts;

    return sourceAccounts === undefined
      ? profileAccounts
      : filterProfileAccounts(sourceAccounts, profileAccounts);
  }, [items, profileAccounts, providedAccounts]);

  const contextSelectedAccountId = getAccountIdentifier(selectedAccount);
  const providedSelectedAccountId =
    selectedAccountId !== undefined ? selectedAccountId : value;
  const isControlled = providedSelectedAccountId !== undefined;
  const [localSelectedAccountId, setLocalSelectedAccountId] = useState(
    providedSelectedAccountId ??
      contextSelectedAccountId ??
      getAccountIdentifier(accounts[0]),
  );

  const selectedId = isControlled
    ? providedSelectedAccountId
    : localSelectedAccountId;
  const matchedAccount = accounts.find(
    (account) =>
      String(getAccountIdentifier(account)) === String(selectedId),
  );
  const resolvedSelectedId = matchedAccount
    ? getAccountIdentifier(matchedAccount)
    : '';

  useEffect(() => {
    if (!isControlled) {
      const hasSelectedAccount = accounts.some(
        (account) =>
          String(getAccountIdentifier(account)) === String(localSelectedAccountId),
      );

      if (!hasSelectedAccount) {
        setLocalSelectedAccountId(
          contextSelectedAccountId ?? getAccountIdentifier(accounts[0]) ?? '',
        );
      }
    }
  }, [
    accounts,
    contextSelectedAccountId,
    isControlled,
    localSelectedAccountId,
  ]);

  const handleChange = (event) => {
    const nextId = event.target.value;
    const nextAccount = accounts.find(
      (account) => String(getAccountIdentifier(account)) === String(nextId),
    );

    if (!nextAccount) {
      return;
    }

    const nextAccountId = getAccountIdentifier(nextAccount);

    if (!isControlled) {
      setLocalSelectedAccountId(nextAccountId);
    }

    selectAccount?.(nextAccount);
    onChange?.(event, nextAccount);
    onAccountChange?.(nextAccount, event);
  };

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <label
        className="block text-sm font-medium text-foreground"
        htmlFor={inputId}
      >
        {label}
      </label>

      <select
        {...props}
        aria-label={label}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-background-muted disabled:opacity-60"
        disabled={disabled || accounts.length === 0}
        id={inputId}
        onChange={handleChange}
        value={resolvedSelectedId}
      >
        {!resolvedSelectedId ? (
          <option value="">{placeholder}</option>
        ) : null}

        {accounts.map((account) => {
          const accountId = getAccountIdentifier(account);
          const accountNumber = getAccountNumber(account);

          return (
            <option key={String(accountId)} value={String(accountId)}>
              {getAccountLabel(account)}
              {accountNumber ? ` • ${accountNumber}` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}

AccountSwitcher.displayName = 'AccountSwitcher';

AccountSwitcher.propTypes = {
  accounts: () => null,
  className: () => null,
  disabled: () => null,
  id: () => null,
  items: () => null,
  label: () => null,
  onAccountChange: () => null,
  onChange: () => null,
  placeholder: () => null,
  selectedAccountId: () => null,
  value: () => null,
};

export {
  filterProfileAccounts,
  getAccountIdentifier,
  getAccountLabel,
  getAccountNumber,
};

export default AccountSwitcher;