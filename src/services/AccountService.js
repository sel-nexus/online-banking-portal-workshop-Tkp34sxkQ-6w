import {
  findAccountById,
  listAccountsByProfile,
} from './FixtureRepository';
import {
  deriveRelationshipTotals,
  getActiveProfile,
  getProfileAccounts,
} from './ProfileService';
import { formatAccountIdentifier, formatCurrency } from '../utils/formatters';

const ACCOUNT_RETRIEVAL_ERROR_CODE = 'ACCOUNT_RETRIEVAL_FAILED';
const ACCOUNT_NOT_FOUND_ERROR_CODE = 'ACCOUNT_NOT_FOUND';
const INVALID_SELECTED_ACCOUNT_ERROR_CODE = 'INVALID_SELECTED_ACCOUNT';

const LIABILITY_ACCOUNT_TYPES = Object.freeze([
  'credit',
  'credit-card',
  'loan',
  'mortgage',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeIdentifier(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim().toLowerCase();
}

function getAccountIdentifier(account) {
  if (!account) {
    return '';
  }

  if (isRecord(account)) {
    return normalizeIdentifier(account.id || account.accountId);
  }

  return normalizeIdentifier(account);
}

function getAccountBalance(account) {
  const value =
    account?.balance ??
    account?.currentBalance ??
    account?.availableBalance ??
    0;
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getAvailableBalance(account) {
  const value = account?.availableBalance ?? getAccountBalance(account);
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function isLiabilityAccount(account) {
  return LIABILITY_ACCOUNT_TYPES.includes(
    normalizeIdentifier(account?.type),
  );
}

function resolveProfileIdentifier(profileOrId, state) {
  if (isRecord(profileOrId)) {
    return profileOrId;
  }

  if (profileOrId !== undefined && profileOrId !== null) {
    return profileOrId;
  }

  return getActiveProfile(state, state);
}

function resolveAccounts(profileOrId, state) {
  const profile = resolveProfileIdentifier(profileOrId, state);

  if (profile) {
    return getProfileAccounts(profile, state);
  }

  return [];
}

function createAccountError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getRetrievalFailure(options = {}) {
  return (
    options.simulateFailure === true ||
    options.shouldFail === true ||
    options.fail === true
  );
}

function normalizeRetryCount(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return Math.floor(numericValue);
}

function normalizeAccountOptions(profileOrOptions, state) {
  if (isRecord(profileOrOptions) && !profileOrOptions.id &&
    !profileOrOptions.profileId && !profileOrOptions.userId &&
    !profileOrOptions.email) {
    return {
      ...profileOrOptions,
      state: profileOrOptions.state || state,
      profileId: profileOrOptions.profileId,
    };
  }

  return {
    profileId: profileOrOptions,
    state,
  };
}

/**
 * Lists accounts visible to a profile.
 *
 * @param {object|string|number} profileOrOptions Profile, profile identifier, or options.
 * @param {object} state Optional application state.
 * @returns {object[]} Profile-owned accounts.
 */
export function listAccounts(profileOrOptions, state) {
  const options = normalizeAccountOptions(profileOrOptions, state);
  const accounts = resolveAccounts(options.profileId, options.state);

  if (options.includeInactive === true) {
    return accounts;
  }

  return accounts.filter(
    (account) =>
      account.status !== 'inactive' && account.status !== 'closed',
  );
}

/**
 * Gets an account when it belongs to the requested profile.
 *
 * @param {string|number|object} accountOrId Account identifier or account.
 * @param {string|number|object} profileOrId Profile identifier or profile.
 * @param {object} state Optional application state.
 * @returns {object|null} Matching account, or null when unavailable.
 */
export function getAccount(accountOrId, profileOrId, state) {
  let requestedAccount = accountOrId;
  let requestedProfile = profileOrId;
  let currentState = state;

  if (isRecord(profileOrId) && state === undefined) {
    currentState = profileOrId;
    requestedProfile = undefined;
  }

  if (isRecord(accountOrId) && accountOrId.account) {
    requestedAccount = accountOrId.account;
  }

  const accountIdentifier = getAccountIdentifier(requestedAccount);

  if (!accountIdentifier) {
    return null;
  }

  const accounts = listAccounts(requestedProfile, currentState);

  return (
    accounts.find(
      (account) =>
        getAccountIdentifier(account) === accountIdentifier ||
        normalizeIdentifier(account.number) === accountIdentifier ||
        normalizeIdentifier(account.accountNumber) === accountIdentifier ||
        normalizeIdentifier(account.maskedAccountNumber) === accountIdentifier,
    ) || null
  );
}

/**
 * Gets an account directly from the fixture repository.
 *
 * This helper does not bypass profile validation; callers should use
 * getAccount for user-visible account access.
 *
 * @param {string|number} accountId Account identifier.
 * @returns {object|null} Matching fixture account.
 */
export function findAccount(accountId) {
  return findAccountById(accountId) || null;
}

/**
 * Checks whether an account is owned by the active profile.
 *
 * @param {string|number|object} accountOrId Account identifier or account.
 * @param {string|number|object} profileOrId Profile identifier or profile.
 * @param {object} state Optional application state.
 * @returns {boolean} Whether the account is valid for the profile.
 */
export function isAccountValidForProfile(accountOrId, profileOrId, state) {
  return Boolean(getAccount(accountOrId, profileOrId, state));
}

/**
 * Validates and resolves a selected account.
 *
 * @param {string|number|object} accountOrId Selected account identifier or account.
 * @param {string|number|object} profileOrId Profile identifier or profile.
 * @param {object} state Optional application state.
 * @returns {{valid: boolean, account: object|null, error: string|null, code: string|null}} Validation result.
 */
export function validateSelectedAccount(accountOrId, profileOrId, state) {
  const account = getAccount(accountOrId, profileOrId, state);

  if (!account) {
    return {
      valid: false,
      account: null,
      error: 'The selected account is not available.',
      code: INVALID_SELECTED_ACCOUNT_ERROR_CODE,
    };
  }

  return {
    valid: true,
    account,
    error: null,
    code: null,
  };
}

/**
 * Creates a summary view model for an account.
 *
 * @param {object} account Account fixture.
 * @param {object} options Summary formatting options.
 * @returns {object|null} Account summary view model.
 */
export function createAccountSummaryViewModel(account, options = {}) {
  if (!isRecord(account)) {
    return null;
  }

  const balance = getAccountBalance(account);
  const availableBalance = getAvailableBalance(account);
  const currency = account.currency || options.currency || 'PHP';
  const liability = isLiabilityAccount(account);

  return {
    id: account.id || account.accountId || null,
    accountId: account.accountId || account.id || null,
    name: account.name || 'Account',
    type: account.type || 'account',
    currency,
    status: account.status || 'active',
    institution: account.institution || '',
    number:
      account.maskedAccountNumber ||
      account.accountNumber ||
      account.number ||
      '',
    maskedAccountNumber: formatAccountIdentifier(account),
    balance,
    availableBalance,
    currentBalance: account.currentBalance ?? balance,
    displayBalance: formatCurrency(balance, { currency }),
    displayAvailableBalance: formatCurrency(availableBalance, { currency }),
    isLiability: liability,
    isAsset: !liability,
    interestRate: account.interestRate ?? null,
    summary: account.summary || null,
    savingsSummary: account.savingsSummary || null,
    creditSummary: account.creditSummary || null,
    loanSummary: account.loanSummary || null,
    transactionCount: Array.isArray(account.transactions)
      ? account.transactions.length
      : 0,
  };
}

/**
 * Creates summary view models for a list of accounts.
 *
 * @param {object[]} accounts Account fixtures.
 * @param {object} options Summary formatting options.
 * @returns {object[]} Account summary view models.
 */
export function createAccountSummaryViewModels(accounts = [], options = {}) {
  return (Array.isArray(accounts) ? accounts : [])
    .map((account) => createAccountSummaryViewModel(account, options))
    .filter(Boolean);
}

/**
 * Creates a profile account summary view model.
 *
 * @param {string|number|object} profileOrId Profile identifier or profile.
 * @param {object} state Optional application state.
 * @returns {object} Account summary view model.
 */
export function createAccountSummary(profileOrId, state) {
  const accounts = listAccounts(profileOrId, state);
  const summaries = createAccountSummaryViewModels(accounts);
  const totals = deriveRelationshipTotals(accounts);

  return {
    accounts: summaries,
    items: summaries,
    accountCount: summaries.length,
    totals,
    relationshipTotals: totals,
  };
}

/**
 * Retrieves accounts through a simulated local service.
 *
 * @param {object} options Retrieval options.
 * @param {string|number|object} options.profileId Profile identifier or profile.
 * @param {object} options.state Optional application state.
 * @param {boolean} options.simulateFailure Force a simulated retrieval failure.
 * @param {number} options.maxRetries Number of retries after a failure.
 * @returns {Promise<object[]>} Retrieved accounts.
 */
export async function retrieveAccounts(options = {}) {
  const normalizedOptions = isRecord(options) ? options : {};
  const maxRetries = normalizeRetryCount(
    normalizedOptions.maxRetries ?? normalizedOptions.retries,
  );
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (getRetrievalFailure(normalizedOptions)) {
        throw createAccountError(
          'We could not load your accounts.',
          ACCOUNT_RETRIEVAL_ERROR_CODE,
          { attempt: attempt + 1, retryable: true },
        );
      }

      return listAccounts(
        normalizedOptions.profileId,
        normalizedOptions.state,
      );
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === ACCOUNT_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createAccountError(
          'We could not load your accounts.',
          ACCOUNT_RETRIEVAL_ERROR_CODE,
          { cause: error, attempt: attempt + 1, retryable: true },
        );
      }

      attempt += 1;
    }
  }

  throw createAccountError(
    'We could not load your accounts.',
    ACCOUNT_RETRIEVAL_ERROR_CODE,
    { retryable: true },
  );
}

/**
 * Retries simulated account retrieval.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object[]>} Retrieved accounts.
 */
export async function retryAccountRetrieval(options = {}) {
  return retrieveAccounts({
    ...options,
    maxRetries: Math.max(1, normalizeRetryCount(options.maxRetries, 0)),
  });
}

export const getAccounts = listAccounts;
export const fetchAccounts = retrieveAccounts;
export const retryAccounts = retryAccountRetrieval;
export const getAccountById = getAccount;
export const validateAccountSelection = validateSelectedAccount;

const accountService = Object.freeze({
  listAccounts,
  getAccounts,
  getAccount,
  getAccountById,
  findAccount,
  retrieveAccounts,
  fetchAccounts,
  retryAccountRetrieval,
  retryAccounts,
  isAccountValidForProfile,
  validateSelectedAccount,
  validateAccountSelection,
  createAccountSummaryViewModel,
  createAccountSummaryViewModels,
  createAccountSummary,
});

export default accountService;