import {
  listTransactionsByAccount,
} from './FixtureRepository';
import {
  getActiveProfile,
  getProfileAccounts,
  getProfileTransactions,
} from './ProfileService';
import { getAccount } from './AccountService';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  isMoneyIn,
  isMoneyOut,
} from '../utils/formatters';
import {
  downloadText as downloadTextFile,
  createDemoStatementFilename,
} from '../utils/downloadUtils';
import { isDateInRange, parseDate } from '../utils/dateUtils';

const TRANSACTION_RETRIEVAL_ERROR_CODE = 'TRANSACTION_RETRIEVAL_FAILED';
const TRANSACTION_NOT_FOUND_ERROR_CODE = 'TRANSACTION_NOT_FOUND';
const INVALID_TRANSACTION_QUERY_ERROR_CODE = 'INVALID_TRANSACTION_QUERY';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_BY = 'date';
const DEFAULT_SORT_DIRECTION = 'desc';

const SORT_FIELDS = Object.freeze([
  'date',
  'postedAt',
  'amount',
  'description',
  'merchant',
  'payee',
  'type',
  'status',
]);

const CREDIT_TYPES = Object.freeze([
  'credit',
  'deposit',
  'income',
  'refund',
  'received',
  'money-in',
  'money_in',
]);

const DEBIT_TYPES = Object.freeze([
  'debit',
  'payment',
  'purchase',
  'transfer',
  'withdrawal',
  'expense',
  'sent',
  'money-out',
  'money_out',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIdentifier(value) {
  return normalizeText(value).toLowerCase();
}

function toNumber(value, fallback = 0) {
  const numericValue =
    typeof value === 'number'
      ? value
      : Number.parseFloat(String(value ?? '').replace(/,/g, ''));

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getTransactionIdentifier(transaction) {
  return transaction?.id ?? transaction?.transactionId ?? null;
}

function getAccountIdentifier(account) {
  return account?.id ?? account?.accountId ?? null;
}

function getTransactionDateValue(transaction) {
  return transaction?.postedAt || transaction?.date || transaction?.createdAt || '';
}

function getTimestamp(value) {
  const date = parseDate(value);

  return date ? date.getTime() : 0;
}

function normalizePage(value, fallback = DEFAULT_PAGE) {
  const page = Number(value);

  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : fallback;
}

function normalizePageSize(value, fallback = DEFAULT_PAGE_SIZE) {
  const pageSize = Number(value);

  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return fallback;
  }

  return Math.min(MAX_PAGE_SIZE, Math.floor(pageSize));
}

function normalizeSortBy(value) {
  const normalizedValue = normalizeText(value).replace(/[-\s]+/g, '');

  if (normalizedValue === 'postedat') {
    return 'postedAt';
  }

  return SORT_FIELDS.includes(value) ? value : DEFAULT_SORT_BY;
}

function normalizeSortDirection(value) {
  return normalizeText(value).toLowerCase() === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION;
}

function normalizeDate(value) {
  const date = parseDate(value);

  return date ? date.toISOString() : null;
}

function normalizeQuery(options = {}) {
  const source = isRecord(options.query)
    ? { ...options.query, ...options }
    : options;

  return {
    accountId: source.accountId ?? source.account ?? null,
    search: normalizeText(source.search ?? source.queryText ?? source.keyword),
    type: normalizeText(source.type || 'all').toLowerCase(),
    status: normalizeText(source.status || 'all').toLowerCase(),
    category: normalizeText(source.category || 'all').toLowerCase(),
    startDate: normalizeDate(source.startDate ?? source.dateFrom ?? source.fromDate),
    endDate: normalizeDate(source.endDate ?? source.dateTo ?? source.toDate),
    sortBy: normalizeSortBy(source.sortBy ?? source.sort),
    sortDirection: normalizeSortDirection(
      source.sortDirection ?? source.direction,
    ),
    page: normalizePage(source.page),
    pageSize: normalizePageSize(source.pageSize ?? source.limit),
  };
}

function createTransactionError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getTransactionDirection(transaction) {
  if (isMoneyIn(transaction) || CREDIT_TYPES.includes(normalizeText(transaction?.type).toLowerCase())) {
    return 'in';
  }

  if (isMoneyOut(transaction) || DEBIT_TYPES.includes(normalizeText(transaction?.type).toLowerCase())) {
    return 'out';
  }

  return '';
}

function getTransactionSearchText(transaction) {
  return [
    transaction?.description,
    transaction?.merchant,
    transaction?.payee,
    transaction?.type,
    transaction?.category,
    transaction?.status,
    transaction?.reference,
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function matchesQuery(transaction, query) {
  const normalizedType = normalizeText(transaction?.type).toLowerCase();
  const normalizedStatus = normalizeText(transaction?.status).toLowerCase();
  const normalizedCategory = normalizeText(transaction?.category).toLowerCase();
  const direction = getTransactionDirection(transaction);
  const accountId = normalizeIdentifier(
    transaction?.accountId ?? transaction?.account?.id,
  );

  if (
    query.accountId &&
    accountId !== normalizeIdentifier(
      isRecord(query.accountId)
        ? getAccountIdentifier(query.accountId)
        : query.accountId,
    )
  ) {
    return false;
  }

  if (query.type !== 'all') {
    const isDebitType = ['debit', 'withdrawal', 'out', 'money-out'].includes(query.type);
    const isCreditType = ['credit', 'deposit', 'in', 'money-in'].includes(query.type);

    const matchesDebit = isDebitType && (direction === 'out' || ['debit', 'withdrawal'].includes(normalizedType));
    const matchesCredit = isCreditType && (direction === 'in' || ['credit', 'deposit'].includes(normalizedType));
    const matchesDirect = query.type === normalizedType || query.type === direction;

    if (!matchesDebit && !matchesCredit && !matchesDirect) {
      return false;
    }
  }

  if (query.status !== 'all' && query.status !== normalizedStatus) {
    return false;
  }

  if (query.category !== 'all' && query.category !== normalizedCategory) {
    return false;
  }

  if (
    query.search &&
    !getTransactionSearchText(transaction).includes(query.search.toLowerCase())
  ) {
    return false;
  }

  if (
    !isDateInRange(
      getTransactionDateValue(transaction),
      query.startDate,
      query.endDate,
    )
  ) {
    return false;
  }

  return true;
}

function compareValues(firstValue, secondValue, sortBy) {
  if (sortBy === 'date' || sortBy === 'postedAt') {
    return getTimestamp(firstValue) - getTimestamp(secondValue);
  }

  if (sortBy === 'amount') {
    return toNumber(firstValue) - toNumber(secondValue);
  }

  return normalizeText(firstValue).localeCompare(normalizeText(secondValue), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function sortTransactions(transactions, query) {
  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((first, second) => {
      const firstValue =
        query.sortBy === 'date'
          ? getTransactionDateValue(first.transaction)
          : first.transaction?.[query.sortBy];
      const secondValue =
        query.sortBy === 'date'
          ? getTransactionDateValue(second.transaction)
          : second.transaction?.[query.sortBy];
      const comparison = compareValues(firstValue, secondValue, query.sortBy);

      if (comparison !== 0) {
        return query.sortDirection === 'asc' ? comparison : -comparison;
      }

      return first.index - second.index;
    })
    .map(({ transaction }) => transaction);
}

function uniqueTransactions(transactions) {
  const seen = new Set();

  return transactions.filter((transaction) => {
    const identifier = String(
      getTransactionIdentifier(transaction) || JSON.stringify(transaction),
    );

    if (seen.has(identifier)) {
      return false;
    }

    seen.add(identifier);
    return true;
  });
}

function getSourceTransactions(options = {}) {
  if (options.accountId !== undefined && options.accountId !== null) {
    const account = getAccount(
      options.accountId,
      options.profileId,
      options.state,
    );

    return account
      ? listTransactionsByAccount(getAccountIdentifier(account))
      : [];
  }

  return getProfileTransactions(options.profileId, options.state);
}

function createTransactionRow(transaction, options = {}) {
  const amount = toNumber(transaction?.amount);
  const direction = getTransactionDirection(transaction);
  const identifier = getTransactionIdentifier(transaction);

  return Object.freeze({
    ...transaction,
    id: identifier,
    transactionId: transaction?.transactionId ?? identifier,
    rowId: String(identifier ?? ''),
    accountId: transaction?.accountId ?? null,
    amount,
    direction,
    isCredit: transaction?.isCredit ?? direction === 'in',
    isExpanded: options.isExpanded === true,
    displayAmount: formatCurrency(amount, {
      currency: transaction?.currency || 'PHP',
    }),
    displayDate: formatDate(getTransactionDateValue(transaction)),
    displayDateTime: formatDateTime(
      transaction?.postedAt || transaction?.date,
    ),
    displayStatus: formatStatus(transaction?.status),
  });
}

function createRows(transactions, options = {}) {
  return transactions.map((transaction) =>
    createTransactionRow(transaction, options),
  );
}

function paginate(items, query) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
  const page = totalPages > 0 ? Math.min(query.page, totalPages) : query.page;
  const start = (page - 1) * query.pageSize;

  return {
    items: items.slice(start, start + query.pageSize),
    page,
    pageSize: query.pageSize,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
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

  return Number.isFinite(numericValue) && numericValue >= 0
    ? Math.floor(numericValue)
    : fallback;
}

/**
 * Normalizes transaction search and filter options.
 *
 * @param {object} options Search options.
 * @returns {object} Normalized transaction query.
 */
export function normalizeTransactionQuery(options = {}) {
  return normalizeQuery(options);
}

/**
 * Returns transactions visible to the requested profile and matching a query.
 *
 * @param {object} options Transaction query options.
 * @returns {object} Query result containing rows and pagination metadata.
 */
export function queryTransactions(options = {}) {
  const query = normalizeQuery(options);
  const sourceTransactions = uniqueTransactions(
    getSourceTransactions({
      ...options,
      profileId: options.profileId,
      accountId: query.accountId,
    }),
  );
  const filteredTransactions = sourceTransactions.filter((transaction) =>
    matchesQuery(transaction, query),
  );
  const sortedTransactions = sortTransactions(filteredTransactions, query);
  const paginated = paginate(sortedTransactions, query);
  const rows = createRows(paginated.items, options);

  return {
    ...paginated,
    items: rows,
    rows,
    transactions: rows,
    query,
    error: null,
    status: 'ready',
  };
}

/**
 * Lists all matching transactions without pagination.
 *
 * @param {object} options Transaction query options.
 * @returns {object[]} Matching transaction rows.
 */
export function listTransactions(options = {}) {
  const result = queryTransactions({
    ...options,
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });

  return result.items;
}

/**
 * Retrieves a transaction by identifier for the active profile.
 *
 * @param {string|number} transactionId Transaction identifier.
 * @param {object|string|number} profileOrOptions Profile or query options.
 * @param {object} state Application state.
 * @returns {object|null} Matching transaction row.
 */
export function getTransaction(transactionId, profileOrOptions, state) {
  const options = isRecord(profileOrOptions)
    ? { ...profileOrOptions, state: profileOrOptions.state || state }
    : {
        profileId: profileOrOptions,
        state,
      };
  const identifier = normalizeIdentifier(transactionId);

  if (!identifier) {
    return null;
  }

  return (
    listTransactions({
      ...options,
      search: '',
    }).find(
      (transaction) =>
        normalizeIdentifier(getTransactionIdentifier(transaction)) === identifier,
    ) || null
  );
}

/**
 * Creates expansion-safe transaction rows.
 *
 * @param {object[]} transactions Transactions to transform.
 * @param {object} options Row options.
 * @returns {object[]} Immutable-safe transaction rows.
 */
export function createTransactionRows(transactions = [], options = {}) {
  return createRows(Array.isArray(transactions) ? transactions : [], options);
}

/**
 * Updates the expansion state of a transaction row without mutating the source.
 *
 * @param {object} row Transaction row.
 * @param {boolean} expanded Whether the row is expanded.
 * @returns {object|null} Updated transaction row.
 */
export function setTransactionExpanded(row, expanded = true) {
  return isRecord(row)
    ? {
        ...row,
        isExpanded: expanded === true,
      }
    : null;
}

/**
 * Generates a local synthetic statement for matching transactions.
 *
 * @param {object} options Statement options.
 * @returns {{filename: string, content: string, transactions: object[], query: object}} Statement data.
 */
export function generateStatement(options = {}) {
  const result = queryTransactions({
    ...options,
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });
  const accountIdentifier = normalizeText(
    options.accountId || options.accountIdentifier || 'all-accounts',
  );
  const lines = [
    'ONLINE BANKING PORTAL DEMO',
    'SIMULATED TRANSACTION STATEMENT',
    'No real transactions or funds are represented.',
    '',
    `Generated: ${formatDateTime(new Date())}`,
    `Account: ${accountIdentifier}`,
    `Transactions: ${result.total}`,
    '',
    'Date | Description | Type | Status | Amount',
  ];

  result.items.forEach((transaction) => {
    const description = normalizeText(
      transaction.description || transaction.merchant || transaction.payee,
    ).replace(/\|/g, '/');
    const amount = transaction.displayAmount || formatCurrency(transaction.amount);
    const direction = transaction.direction === 'in' ? '+' : '-';

    lines.push(
      `${transaction.displayDate || formatDate(transaction.date)} | ${description} | ${normalizeText(
        transaction.type,
      )} | ${transaction.displayStatus || normalizeText(transaction.status)} | ${direction}${amount}`,
    );
  });

  lines.push(
    '',
    'This statement is synthetic sample data for demonstration only.',
  );

  return {
    filename:
      options.filename ||
      createDemoStatementFilename(accountIdentifier, options.extension || 'txt'),
    content: lines.join('\n'),
    transactions: result.items,
    query: result.query,
  };
}

/**
 * Downloads a locally generated synthetic statement.
 *
 * @param {object} options Statement and download options.
 * @returns {string} Downloaded filename.
 */
export function downloadStatement(options = {}) {
  const statement = generateStatement(options);

  return downloadTextFile(statement.content, {
    ...options,
    filename: statement.filename,
    type: 'text/plain;charset=utf-8',
  });
}

/**
 * Retrieves transactions through a simulated local service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Transaction query result.
 */
export async function retrieveTransactions(options = {}) {
  const maxRetries = normalizeRetryCount(
    options.maxRetries ?? options.retries,
  );
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (getRetrievalFailure(options)) {
        throw createTransactionError(
          'We could not load your transactions.',
          TRANSACTION_RETRIEVAL_ERROR_CODE,
          { attempt: attempt + 1, retryable: true },
        );
      }

      return queryTransactions(options);
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === TRANSACTION_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createTransactionError(
          'We could not load your transactions.',
          TRANSACTION_RETRIEVAL_ERROR_CODE,
          { cause: error, attempt: attempt + 1, retryable: true },
        );
      }

      attempt += 1;
    }
  }

  throw createTransactionError(
    'We could not load your transactions.',
    TRANSACTION_RETRIEVAL_ERROR_CODE,
    { retryable: true },
  );
}

/**
 * Retries simulated transaction retrieval.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Transaction query result.
 */
export async function retryTransactionRetrieval(options = {}) {
  return retrieveTransactions({
    ...options,
    maxRetries: Math.max(1, normalizeRetryCount(options.maxRetries)),
  });
}

export const getTransactions = listTransactions;
export const fetchTransactions = retrieveTransactions;
export const searchTransactions = queryTransactions;
export const filterTransactions = queryTransactions;
export const getTransactionById = getTransaction;
export const buildTransactionRows = createTransactionRows;
export const createStatement = generateStatement;
export const downloadLocalStatement = downloadStatement;
export const TRANSACTION_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: TRANSACTION_RETRIEVAL_ERROR_CODE,
  NOT_FOUND: TRANSACTION_NOT_FOUND_ERROR_CODE,
  INVALID_QUERY: INVALID_TRANSACTION_QUERY_ERROR_CODE,
});

const transactionService = Object.freeze({
  normalizeTransactionQuery,
  queryTransactions,
  searchTransactions,
  filterTransactions,
  listTransactions,
  getTransactions,
  retrieveTransactions,
  fetchTransactions,
  retryTransactionRetrieval,
  getTransaction,
  getTransactionById,
  createTransactionRows,
  buildTransactionRows,
  setTransactionExpanded,
  generateStatement,
  createStatement,
  downloadStatement,
  downloadLocalStatement,
  TRANSACTION_SERVICE_ERROR_CODES,
});

export default transactionService;