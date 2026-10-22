import { ROUTES, ROUTE_NAMES } from './constants';

export { ROUTES, ROUTE_NAMES };

export const PUBLIC_ROUTES = Object.freeze({
  LOGIN: ROUTES.LOGIN,
});

export const PROTECTED_ROUTES = Object.freeze({
  DASHBOARD: ROUTES.DASHBOARD,
  ACCOUNTS: ROUTES.ACCOUNTS,
  TRANSFERS: ROUTES.TRANSFERS,
  PAYMENTS: ROUTES.PAYMENTS,
  PROFILE: ROUTES.PROFILE,
});

export const PARAMETERIZED_ROUTES = Object.freeze({
  ACCOUNT_DETAILS: `${ROUTES.ACCOUNTS}/:accountId`,
  TRANSACTION_DETAILS: '/transactions/:transactionId',
});

export const TRANSACTION_ROUTES = Object.freeze({
  TRANSFERS: ROUTES.TRANSFERS,
  PAYMENTS: ROUTES.PAYMENTS,
  TRANSACTION_DETAILS: PARAMETERIZED_ROUTES.TRANSACTION_DETAILS,
});

const publicRouteDefinitions = Object.freeze([
  Object.freeze({
    name: ROUTE_NAMES.LOGIN,
    path: PUBLIC_ROUTES.LOGIN,
    access: 'public',
    requiresAuth: false,
  }),
]);

const protectedRouteDefinitions = Object.freeze([
  Object.freeze({
    name: ROUTE_NAMES.DASHBOARD,
    path: PROTECTED_ROUTES.DASHBOARD,
    access: 'protected',
    requiresAuth: true,
  }),
  Object.freeze({
    name: ROUTE_NAMES.ACCOUNTS,
    path: PROTECTED_ROUTES.ACCOUNTS,
    access: 'protected',
    requiresAuth: true,
  }),
  Object.freeze({
    name: ROUTE_NAMES.TRANSFERS,
    path: PROTECTED_ROUTES.TRANSFERS,
    access: 'protected',
    requiresAuth: true,
  }),
  Object.freeze({
    name: ROUTE_NAMES.PAYMENTS,
    path: PROTECTED_ROUTES.PAYMENTS,
    access: 'protected',
    requiresAuth: true,
  }),
  Object.freeze({
    name: ROUTE_NAMES.PROFILE,
    path: PROTECTED_ROUTES.PROFILE,
    access: 'protected',
    requiresAuth: true,
  }),
]);

const parameterizedRouteDefinitions = Object.freeze([
  Object.freeze({
    name: 'account-details',
    path: PARAMETERIZED_ROUTES.ACCOUNT_DETAILS,
    access: 'protected',
    requiresAuth: true,
  }),
  Object.freeze({
    name: 'transaction-details',
    path: PARAMETERIZED_ROUTES.TRANSACTION_DETAILS,
    access: 'protected',
    requiresAuth: true,
  }),
]);

export const ROUTE_DEFINITIONS = Object.freeze([
  ...publicRouteDefinitions,
  ...protectedRouteDefinitions,
  ...parameterizedRouteDefinitions,
]);

export const ROUTE_REGISTRY = Object.freeze({
  public: publicRouteDefinitions,
  protected: protectedRouteDefinitions,
  parameterized: parameterizedRouteDefinitions,
  transactions: Object.freeze(
    ROUTE_DEFINITIONS.filter(({ path }) =>
      [
        TRANSACTION_ROUTES.TRANSFERS,
        TRANSACTION_ROUTES.PAYMENTS,
        TRANSACTION_ROUTES.TRANSACTION_DETAILS,
      ].includes(path),
    ),
  ),
  all: ROUTE_DEFINITIONS,
});

/**
 * Builds the route for a specific account.
 *
 * @param {string|number} accountId Account identifier.
 * @returns {string} Account details route.
 */
export function getAccountDetailsRoute(accountId) {
  return `${ROUTES.ACCOUNTS}/${encodeURIComponent(String(accountId))}`;
}

/**
 * Builds the route for a specific transaction.
 *
 * @param {string|number} transactionId Transaction identifier.
 * @returns {string} Transaction details route.
 */
export function getTransactionDetailsRoute(transactionId) {
  return `/transactions/${encodeURIComponent(String(transactionId))}`;
}

export const accountDetailsPath = getAccountDetailsRoute;
export const transactionDetailsPath = getTransactionDetailsRoute;