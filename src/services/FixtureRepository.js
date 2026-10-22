import {
  ACCOUNTS,
} from '../fixtures/accounts';
import {
  OFFERS,
} from '../fixtures/offers';
import {
  PRODUCTS,
} from '../fixtures/products';
import {
  PROFILES,
} from '../fixtures/profiles';
import {
  SUPPORT,
} from '../fixtures/support';
import {
  TRANSACTIONS,
} from '../fixtures/transactions';
import {
  assertFixture,
  validateSchema,
  FIXTURE_SCHEMAS,
} from '../fixtures/fixtureSchemas';

function deepFreeze(value, seen = new WeakSet()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return value;
  }

  seen.add(value);
  Object.getOwnPropertyNames(value).forEach((propertyName) => {
    deepFreeze(value[propertyName], seen);
  });

  return Object.freeze(value);
}

function freezeList(items) {
  return deepFreeze([...items]);
}

const PROFILE_FIXTURES = deepFreeze(
  PROFILES.map((profile) => assertFixture('profile', profile)),
);
const ACCOUNT_FIXTURES = deepFreeze(
  ACCOUNTS.map((account) => assertFixture('account', account)),
);
const TRANSACTION_FIXTURES = deepFreeze(
  TRANSACTIONS.map((transaction) =>
    assertFixture('transaction', transaction),
  ),
);
const PRODUCT_FIXTURES = deepFreeze(
  PRODUCTS.map((product) => assertFixture('product', product)),
);
const OFFER_FIXTURES = deepFreeze(
  OFFERS.map((offer) => assertFixture('offer', offer)),
);
const SUPPORT_FIXTURE = deepFreeze(assertFixture('support', SUPPORT));

function findById(items, id) {
  if (id === undefined || id === null) {
    return undefined;
  }

  const normalizedId = String(id);

  return items.find(
    (item) =>
      String(item.id) === normalizedId ||
      (item.accountId !== undefined &&
        String(item.accountId) === normalizedId) ||
      (item.profileId !== undefined &&
        String(item.profileId) === normalizedId) ||
      (item.productId !== undefined &&
        String(item.productId) === normalizedId) ||
      (item.offerId !== undefined &&
        String(item.offerId) === normalizedId) ||
      (item.transactionId !== undefined &&
        String(item.transactionId) === normalizedId),
  );
}

/**
 * Finds a profile by its identifier.
 *
 * @param {string|number} profileId Profile identifier.
 * @returns {object|undefined} Matching profile, when available.
 */
export function findProfileById(profileId) {
  return findById(PROFILE_FIXTURES, profileId);
}

/**
 * Finds an account by its identifier.
 *
 * @param {string|number} accountId Account identifier.
 * @returns {object|undefined} Matching account, when available.
 */
export function findAccountById(accountId) {
  return findById(ACCOUNT_FIXTURES, accountId);
}

/**
 * Lists all accounts belonging to a profile.
 *
 * @param {string|number} profileId Profile identifier.
 * @returns {object[]} Immutable matching account list.
 */
export function listAccountsByProfile(profileId) {
  if (profileId === undefined || profileId === null) {
    return freezeList([]);
  }

  const normalizedProfileId = String(profileId);
  const accounts = ACCOUNT_FIXTURES.filter(
    (account) =>
      String(account.profileId) === normalizedProfileId ||
      String(account.userId) === normalizedProfileId,
  );

  return freezeList(accounts);
}

/**
 * Lists all transactions belonging to an account.
 *
 * @param {string|number} accountId Account identifier.
 * @returns {object[]} Immutable matching transaction list.
 */
export function listTransactionsByAccount(accountId) {
  if (accountId === undefined || accountId === null) {
    return freezeList([]);
  }

  const normalizedAccountId = String(accountId);
  const account = findAccountById(accountId);
  const accountTransactions = Array.isArray(account?.transactions)
    ? account.transactions
    : [];
  const repositoryTransactions = TRANSACTION_FIXTURES.filter(
    (transaction) => String(transaction.accountId) === normalizedAccountId,
  );

  return freezeList(
    [...accountTransactions, ...repositoryTransactions].filter(
      (transaction, index, transactions) =>
        transactions.findIndex(
          (candidate) =>
            String(candidate.id) === String(transaction.id),
        ) === index,
    ),
  );
}

/**
 * Lists all available products.
 *
 * @returns {object[]} Immutable product list.
 */
export function listProducts() {
  return freezeList(PRODUCT_FIXTURES);
}

/**
 * Lists all available offers.
 *
 * @returns {object[]} Immutable offer list.
 */
export function listOffers() {
  return freezeList(OFFER_FIXTURES);
}

/**
 * Returns the validated support content fixture.
 *
 * @returns {object} Immutable support content.
 */
export function getSupportContent() {
  return SUPPORT_FIXTURE;
}

export const fixtureRepository = Object.freeze({
  findProfileById,
  findAccountById,
  listAccountsByProfile,
  listTransactionsByAccount,
  listProducts,
  listOffers,
  getSupportContent,
});

export default fixtureRepository;