import { ACCOUNTS } from '../fixtures/accounts';
import { OFFERS } from '../fixtures/offers';
import { PROFILES } from '../fixtures/profiles';
import { TRANSACTIONS } from '../fixtures/transactions';
import { NOTIFICATIONS } from '../fixtures/notifications';
import {
  findAccountById,
  findProfileById,
  listAccountsByProfile,
  listTransactionsByAccount,
} from './FixtureRepository';

const DEFAULT_PROFILE = PROFILES[0] || null;
const LIABILITY_ACCOUNT_TYPES = Object.freeze([
  'credit',
  'credit-card',
  'loan',
  'mortgage',
]);

function normalizeIdentifier(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim().toLowerCase();
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getNumericValue(value, fallback = 0) {
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getStateProfile(state) {
  if (!isRecord(state)) {
    return null;
  }

  if (isRecord(state.profile?.data)) {
    return state.profile.data;
  }

  if (isRecord(state.profile)) {
    if (
      state.profile.id ||
      state.profile.profileId ||
      state.profile.userId ||
      state.profile.email
    ) {
      return state.profile;
    }
  }

  return null;
}

function getStateSession(state) {
  return isRecord(state?.session) ? state.session : null;
}

function getProfileIdentifiers(profile) {
  if (!profile) {
    return [];
  }

  return [
    profile.id,
    profile.profileId,
    profile.userId,
    profile.email,
    profile.credentials?.username,
    profile.credentials?.legacyUsername,
    profile.demoCredentialMetadata?.username,
    profile.demoCredentialMetadata?.legacyUsername,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map(normalizeIdentifier)
    .filter(Boolean);
}

function resolveProfile(profileOrId, state) {
  if (isRecord(profileOrId)) {
    return profileOrId;
  }

  const stateProfile = getStateProfile(state);

  if (stateProfile && profileOrId === undefined) {
    return stateProfile;
  }

  const requestedIdentifier = normalizeIdentifier(
    profileOrId ??
      getStateSession(state)?.profileId ??
      getStateSession(state)?.userId,
  );

  if (!requestedIdentifier) {
    return stateProfile || DEFAULT_PROFILE;
  }

  return (
    PROFILES.find((profile) =>
      getProfileIdentifiers(profile).includes(requestedIdentifier),
    ) ||
    findProfileById(profileOrId) ||
    stateProfile ||
    null
  );
}

function getAccountIdentifier(account) {
  return account?.id || account?.accountId;
}

function getAccountBalance(account) {
  return getNumericValue(
    account?.balance ?? account?.currentBalance ?? account?.availableBalance,
  );
}

function isLiabilityAccount(account) {
  const accountType = normalizeIdentifier(account?.type);

  return LIABILITY_ACCOUNT_TYPES.includes(accountType);
}

function accountBelongsToProfile(account, profile) {
  if (!account || !profile) {
    return false;
  }

  const profileIdentifiers = new Set(getProfileIdentifiers(profile));
  const accountIdentifiers = [
    account.profileId,
    account.userId,
  ].map(normalizeIdentifier);

  return accountIdentifiers.some(
    (identifier) => identifier && profileIdentifiers.has(identifier),
  );
}

function getProfileAccountFixtures(profile) {
  if (!profile) {
    return [];
  }

  const repositoryAccounts = listAccountsByProfile(profile.id || profile.userId);
  const accounts = repositoryAccounts.length > 0 ? repositoryAccounts : ACCOUNTS;

  return accounts.filter((account) => accountBelongsToProfile(account, profile));
}

function resolveSelectedAccount(accounts, selectedAccount) {
  const selectedIdentifier = normalizeIdentifier(
    isRecord(selectedAccount)
      ? getAccountIdentifier(selectedAccount)
      : selectedAccount,
  );

  if (!selectedIdentifier) {
    return accounts[0] || null;
  }

  return (
    accounts.find((account) =>
      [
        account.id,
        account.accountId,
        account.number,
        account.accountNumber,
      ]
        .map(normalizeIdentifier)
        .includes(selectedIdentifier),
    ) || accounts[0] || null
  );
}

function getProfileOfferSegment(profile) {
  return normalizeIdentifier(
    profile?.id
      ?.replace(/^profile-/, '')
      .replace(/-/g, '-') || profile?.userId,
  );
}

function offerBelongsToProfile(offer, profile) {
  if (!offer || !profile) {
    return false;
  }

  const profileIdentifiers = new Set(getProfileIdentifiers(profile));
  const segment = getProfileOfferSegment(profile);
  const offerSegments = [
    offer.profileId,
    offer.userId,
    offer.customerId,
    offer.segment,
    ...(Array.isArray(offer.segments) ? offer.segments : []),
  ]
    .map(normalizeIdentifier)
    .filter(Boolean);

  if (offerSegments.some((value) => profileIdentifiers.has(value))) {
    return true;
  }

  if (segment && offerSegments.includes(segment)) {
    return true;
  }

  return offer.personalized !== true && offer.isPersonalized !== true;
}

function getProfileNotificationItems(notifications, profile) {
  if (!Array.isArray(notifications)) {
    return [];
  }

  const profileIdentifiers = new Set(getProfileIdentifiers(profile));

  return notifications.filter((notification) => {
    const notificationIdentifiers = [
      notification.profileId,
      notification.userId,
      notification.customerId,
    ]
      .map(normalizeIdentifier)
      .filter(Boolean);

    return (
      notificationIdentifiers.length === 0 ||
      notificationIdentifiers.some((identifier) =>
        profileIdentifiers.has(identifier),
      )
    );
  });
}

/**
 * Returns the active profile represented by a state, profile object, or
 * profile identifier.
 *
 * @param {object|string|number} profileOrState Profile, state, or identifier.
 * @param {object} state Optional application state.
 * @returns {object|null} Active profile.
 */
export function getActiveProfile(profileOrState, state) {
  if (isRecord(profileOrState) && !state) {
    const stateProfile = getStateProfile(profileOrState);

    if (stateProfile) {
      return stateProfile;
    }

    if (
      profileOrState.id ||
      profileOrState.profileId ||
      profileOrState.userId ||
      profileOrState.email
    ) {
      return resolveProfile(profileOrState);
    }
  }

  return resolveProfile(profileOrState, state);
}

/**
 * Returns accounts owned by a profile.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Accounts owned by the profile.
 */
export function getProfileAccounts(profileOrId, state) {
  const profile = resolveProfile(profileOrId, state);

  return getProfileAccountFixtures(profile);
}

/**
 * Returns only accounts that are safe to display for the active profile.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Visible accounts.
 */
export function getVisibleAccounts(profileOrId, state) {
  return getProfileAccounts(profileOrId, state).filter(
    (account) => account.status !== 'inactive' && account.status !== 'closed',
  );
}

/**
 * Selects an account only when it belongs to the active profile.
 *
 * @param {object|string|number} accountOrId Account or account identifier.
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object|null} Safe selected account.
 */
export function selectVisibleAccount(accountOrId, profileOrId, state) {
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

  const accounts = getVisibleAccounts(requestedProfile, currentState);

  return resolveSelectedAccount(accounts, requestedAccount);
}

/**
 * Returns transactions belonging to a profile's accounts.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Profile transactions.
 */
export function getProfileTransactions(profileOrId, state) {
  const accounts = getProfileAccounts(profileOrId, state);
  const accountIds = new Set(
    accounts.map((account) => normalizeIdentifier(getAccountIdentifier(account))),
  );

  const transactions = accounts.flatMap((account) =>
    listTransactionsByAccount(getAccountIdentifier(account)),
  );

  TRANSACTIONS.forEach((transaction) => {
    if (
      accountIds.has(normalizeIdentifier(transaction.accountId)) &&
      !transactions.some(
        (existingTransaction) =>
          String(existingTransaction.id) === String(transaction.id),
      )
    ) {
      transactions.push(transaction);
    }
  });

  return transactions;
}

/**
 * Returns offers visible to a profile.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Profile offers.
 */
export function getProfileOffers(profileOrId, state) {
  const profile = resolveProfile(profileOrId, state);

  return OFFERS.filter((offer) => offerBelongsToProfile(offer, profile));
}

/**
 * Returns notifications visible to a profile.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Profile notifications.
 */
export function getProfileNotifications(profileOrId, state) {
  const profile = resolveProfile(profileOrId, state);
  const stateNotifications = state?.notifications?.items;

  return getProfileNotificationItems(
    Array.isArray(stateNotifications) ? stateNotifications : NOTIFICATIONS,
    profile,
  );
}

/**
 * Derives relationship totals from a profile's accounts.
 *
 * @param {object[]} accounts Accounts used for the calculation.
 * @returns {object} Relationship totals.
 */
export function deriveRelationshipTotals(accounts = []) {
  const normalizedAccounts = Array.isArray(accounts) ? accounts : [];
  const assetAccounts = normalizedAccounts.filter(
    (account) => !isLiabilityAccount(account),
  );
  const liabilityAccounts = normalizedAccounts.filter(isLiabilityAccount);
  const totalAssets = assetAccounts.reduce(
    (total, account) => total + getAccountBalance(account),
    0,
  );
  const totalLiabilities = liabilityAccounts.reduce(
    (total, account) => total + getAccountBalance(account),
    0,
  );
  const availableAssets = assetAccounts.reduce(
    (total, account) =>
      total + getNumericValue(account?.availableBalance, getAccountBalance(account)),
    0,
  );
  const availableCredit = liabilityAccounts.reduce(
    (total, account) =>
      total + getNumericValue(account?.availableBalance, 0),
    0,
  );

  return {
    currency: normalizedAccounts[0]?.currency || 'PHP',
    accountCount: normalizedAccounts.length,
    assetAccountCount: assetAccounts.length,
    liabilityAccountCount: liabilityAccounts.length,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    totalBalance: totalAssets,
    availableBalance: availableAssets,
    availableAssets,
    availableCredit,
  };
}

/**
 * Builds the home-page model for the active profile.
 *
 * @param {object} state Application state or profile data.
 * @param {object} options Home model options.
 * @returns {object} Profile-owned home model.
 */
export function getHomeModel(state, options = {}) {
  const currentState = isRecord(state) ? state : {};
  const profile = resolveProfile(
    options.profileId ?? getStateProfile(currentState),
    currentState,
  );
  const accounts = getVisibleAccounts(profile, currentState);
  const selectedAccount = selectVisibleAccount(
    options.accountId ??
      currentState.selectedAccount?.id ??
      currentState.selectedAccount?.account?.id,
    profile,
    currentState,
  );
  const transactions = getProfileTransactions(profile, currentState);
  const notifications = getProfileNotifications(profile, currentState);
  const offers = getProfileOffers(profile, currentState);

  return {
    profile,
    accounts,
    selectedAccount,
    transactions,
    recentTransactions: transactions.slice(0, options.recentTransactionLimit || 5),
    notifications,
    unreadNotificationCount: notifications.filter(
      (notification) =>
        notification.read !== true && notification.isRead !== true,
    ).length,
    offers,
    relationshipTotals: deriveRelationshipTotals(accounts),
  };
}

/**
 * Switches the active profile and returns a safe profile-owned selection.
 *
 * @param {string|number|object} profileId Profile identifier or profile.
 * @param {object} state Current application state.
 * @returns {object} Switched profile model.
 */
export function switchProfile(profileId, state = {}) {
  const profile = resolveProfile(profileId, state);

  if (!profile) {
    return {
      success: false,
      profile: null,
      accounts: [],
      selectedAccount: null,
      relationshipTotals: deriveRelationshipTotals([]),
      error: 'The profile could not be found.',
    };
  }

  const accounts = getVisibleAccounts(profile, state);

  return {
    success: true,
    profile,
    profileId: profile.id,
    userId: profile.userId || profile.id,
    accounts,
    selectedAccount: accounts[0] || null,
    relationshipTotals: deriveRelationshipTotals(accounts),
    homeModel: getHomeModel(state, {
      profileId: profile.id,
      accountId: accounts[0]?.id,
    }),
  };
}

export const selectProfileAccounts = getProfileAccounts;
export const selectVisibleAccounts = getVisibleAccounts;
export const selectProfileTransactions = getProfileTransactions;
export const selectProfileOffers = getProfileOffers;
export const selectProfileNotifications = getProfileNotifications;
export const getRelationshipTotals = deriveRelationshipTotals;
export const getProfileRelationshipTotals = (profileOrId, state) =>
  deriveRelationshipTotals(getProfileAccounts(profileOrId, state));

const profileService = Object.freeze({
  getActiveProfile,
  getHomeModel,
  switchProfile,
  getProfileAccounts,
  selectProfileAccounts,
  getVisibleAccounts,
  selectVisibleAccounts,
  selectVisibleAccount,
  getProfileTransactions,
  selectProfileTransactions,
  getProfileOffers,
  selectProfileOffers,
  getProfileNotifications,
  selectProfileNotifications,
  deriveRelationshipTotals,
  getRelationshipTotals,
  getProfileRelationshipTotals,
});

export default profileService;