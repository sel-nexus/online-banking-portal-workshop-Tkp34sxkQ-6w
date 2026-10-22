import { PRODUCTS } from '../fixtures/products';
import { listProducts as listRepositoryProducts } from './FixtureRepository';
import { redactForAnalytics } from '../utils/redaction';
import { simulateLoading } from '../utils/asyncUtils';

const PRODUCT_RETRIEVAL_ERROR_CODE = 'PRODUCT_RETRIEVAL_FAILED';
const PRODUCT_NOT_FOUND_ERROR_CODE = 'PRODUCT_NOT_FOUND';
const INVALID_PRODUCT_ACTION_ERROR_CODE = 'INVALID_PRODUCT_ACTION';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

function getProductIdentifier(product) {
  if (isRecord(product)) {
    return product.id || product.productId || null;
  }

  return product ?? null;
}

function normalizeProductType(value) {
  return normalizeText(value).toLowerCase().replace(/[_\s]+/g, '-');
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

function createProductError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getProductSearchText(product) {
  return [
    product?.id,
    product?.productId,
    product?.name,
    product?.type,
    product?.category,
    product?.description,
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.benefits) ? product.benefits : []),
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function productMatchesQuery(product, query) {
  const normalizedType = normalizeProductType(product?.type);
  const normalizedCategory = normalizeProductType(product?.category);
  const normalizedStatus = normalizeText(product?.status).toLowerCase();

  if (
    query.type !== 'all' &&
    normalizedType !== query.type &&
    normalizedCategory !== query.type
  ) {
    return false;
  }

  if (query.category !== 'all' && normalizedCategory !== query.category) {
    return false;
  }

  if (query.status !== 'all' && normalizedStatus !== query.status) {
    return false;
  }

  if (
    query.search &&
    !getProductSearchText(product).includes(query.search.toLowerCase())
  ) {
    return false;
  }

  return true;
}

function normalizeProductQuery(options = {}) {
  const source = isRecord(options.query)
    ? { ...options.query, ...options }
    : isRecord(options)
      ? options
      : {};

  return {
    search: normalizeText(source.search ?? source.queryText ?? source.keyword),
    type: normalizeProductType(source.type || 'all'),
    category: normalizeProductType(source.category || 'all'),
    status: normalizeText(source.status || 'all').toLowerCase(),
    page: normalizePage(source.page),
    pageSize: normalizePageSize(source.pageSize ?? source.limit),
  };
}

function getProductSource(options = {}) {
  if (Array.isArray(options.products)) {
    return options.products;
  }

  return listRepositoryProducts();
}

function createProductViewModel(product) {
  if (!isRecord(product)) {
    return null;
  }

  return Object.freeze({
    ...product,
    id: product.id || product.productId || null,
    productId: product.productId || product.id || null,
    type: product.type || '',
    category: product.category || '',
    status: product.status || 'active',
    currency: product.currency || 'PHP',
    interestRate:
      product.interestRate === undefined
        ? null
        : toNumber(product.interestRate),
    annualFee:
      product.annualFee === undefined ? null : toNumber(product.annualFee),
    minimumBalance:
      product.minimumBalance === undefined
        ? null
        : toNumber(product.minimumBalance),
    minimumAmount:
      product.minimumAmount === undefined
        ? null
        : toNumber(product.minimumAmount),
    maximumAmount:
      product.maximumAmount === undefined
        ? null
        : toNumber(product.maximumAmount),
    features: Array.isArray(product.features) ? [...product.features] : [],
  });
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

function resolveProductFromSource(productOrId, products) {
  const identifier = normalizeIdentifier(getProductIdentifier(productOrId));

  if (!identifier) {
    return null;
  }

  return (
    products.find(
      (product) =>
        normalizeIdentifier(product.id) === identifier ||
        normalizeIdentifier(product.productId) === identifier,
    ) || null
  );
}

function getActionDetails(product, options = {}) {
  return {
    productId: product?.id || product?.productId || null,
    productType: product?.type || null,
    productCategory: product?.category || null,
    action: options.action || 'product_action',
    success: options.success !== false,
    simulated: true,
    timestamp: options.timestamp || new Date().toISOString(),
  };
}

/**
 * Records a privacy-safe product action through the supplied analytics
 * integration.
 *
 * @param {string} action Action name.
 * @param {object} details Action details.
 * @param {object} options Analytics integration options.
 * @returns {object|null} Redacted analytics event, when an integration exists.
 */
export function trackProductAction(action, details = {}, options = {}) {
  const event = redactForAnalytics({
    event: action,
    ...details,
    simulated: true,
    timestamp: details.timestamp || new Date().toISOString(),
  });

  try {
    if (typeof options.dispatch === 'function') {
      options.dispatch({
        type: 'analytics/track',
        payload: event,
      });
    }

    if (typeof options.track === 'function') {
      options.track(event);
    }

    if (typeof options.onAnalytics === 'function') {
      options.onAnalytics(event);
    }
  } catch {
    // Analytics failures must not interrupt simulated product actions.
  }

  return event;
}

/**
 * Lists catalogue products.
 *
 * @param {object} options Product listing options.
 * @returns {object[]} Product view models.
 */
export function listProducts(options = {}) {
  const products = getProductSource(options);
  const includeInactive = options.includeInactive === true;

  return products
    .filter(
      (product) =>
        includeInactive ||
        (product.status !== 'inactive' && product.status !== 'closed'),
    )
    .map(createProductViewModel)
    .filter(Boolean);
}

/**
 * Gets a catalogue product by identifier.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {object} options Product lookup options.
 * @returns {object|null} Matching product, or null.
 */
export function getProduct(productOrId, options = {}) {
  const product = resolveProductFromSource(
    productOrId,
    getProductSource(options),
  );

  if (
    !product ||
    (product.status === 'inactive' || product.status === 'closed') &&
      options.includeInactive !== true
  ) {
    return null;
  }

  return createProductViewModel(product);
}

/**
 * Returns a detailed product selection.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {object} options Product selection options.
 * @returns {object|null} Product detail view model.
 */
export function selectProduct(productOrId, options = {}) {
  const product = getProduct(productOrId, options);

  if (!product) {
    return null;
  }

  return {
    ...product,
    selected: true,
    details: product.details || null,
    rates: product.rates || null,
    eligibility: product.eligibility || null,
    terms: product.terms || null,
    benefits: Array.isArray(product.benefits) ? [...product.benefits] : [],
  };
}

/**
 * Searches and filters catalogue products.
 *
 * @param {object} options Search and filter options.
 * @returns {object} Paginated product search result.
 */
export function queryProducts(options = {}) {
  const query = normalizeProductQuery(options);
  const products = listProducts(options);
  const matchingProducts = products.filter((product) =>
    productMatchesQuery(product, query),
  );
  const paginated = paginate(matchingProducts, query);

  return {
    ...paginated,
    items: paginated.items,
    products: paginated.items,
    query,
    status: 'ready',
    error: null,
  };
}

/**
 * Lists all products matching search and filter criteria.
 *
 * @param {object} options Search and filter options.
 * @returns {object[]} Matching products.
 */
export function searchProducts(options = {}) {
  return queryProducts({
    ...options,
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  }).items;
}

/**
 * Calculates illustrative simple interest for a product.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {object} options Interest calculation options.
 * @returns {object} Simulated interest calculation.
 */
export function calculateInterest(productOrId, options = {}) {
  const product = getProduct(productOrId, options);

  if (!product) {
    throw createProductError(
      'The requested product could not be found.',
      PRODUCT_NOT_FOUND_ERROR_CODE,
    );
  }

  const principal = Math.max(
    0,
    toNumber(
      options.amount ??
        options.principal ??
        options.balance ??
        product.minimumAmount ??
        0,
    ),
  );
  const annualRate = Math.max(
    0,
    toNumber(options.rate ?? product.interestRate ?? 0),
  );
  const years = Math.max(0, toNumber(options.years ?? options.termYears ?? 1));
  const interest = principal * (annualRate / 100) * years;

  return {
    product,
    principal,
    annualRate,
    years,
    interest,
    projectedValue: principal + interest,
    currency: product.currency || 'PHP',
    simulated: true,
  };
}

/**
 * Calculates illustrative interest after a local simulation delay.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {object} options Interest calculation options.
 * @returns {Promise<object>} Simulated interest calculation.
 */
export async function simulateInterestCalculation(productOrId, options = {}) {
  try {
    return await simulateLoading(
      () => calculateInterest(productOrId, options),
      options,
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Confirms a simulated product application without sending it externally.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {object} options Application and analytics options.
 * @returns {Promise<object>} Simulated application confirmation.
 */
export async function applyForProduct(productOrId, options = {}) {
  const product = getProduct(productOrId, options);

  if (!product) {
    throw createProductError(
      'The requested product could not be found.',
      PRODUCT_NOT_FOUND_ERROR_CODE,
    );
  }

  if (product.status !== 'active') {
    throw createProductError(
      'This product is not available for application.',
      INVALID_PRODUCT_ACTION_ERROR_CODE,
      { productId: product.id },
    );
  }

  try {
    return await simulateLoading(() => {
      const confirmation = {
        success: true,
        status: 'confirmed',
        simulated: true,
        product,
        productId: product.id,
        applicationId: `demo-application-${product.id}`,
        message:
          'Your simulated application has been confirmed. No real application has been submitted.',
        submittedAt: new Date().toISOString(),
      };

      const analytics = trackProductAction(
        'product_application_confirmed',
        getActionDetails(product, {
          action: 'product_application_confirmed',
          success: true,
          timestamp: confirmation.submittedAt,
        }),
        options,
      );

      return {
        ...confirmation,
        analytics,
      };
    }, options);
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createProductError(
      'The simulated product application could not be completed.',
      PRODUCT_RETRIEVAL_ERROR_CODE,
      { cause: error, retryable: true },
    );
  }
}

/**
 * Confirms a simulated interest or product action for analytics purposes.
 *
 * @param {string|number|object} productOrId Product identifier or product.
 * @param {string} action Action name.
 * @param {object} options Action options.
 * @returns {object} Simulated action confirmation.
 */
export function confirmProductAction(productOrId, action, options = {}) {
  const product = getProduct(productOrId, options);

  if (!product) {
    throw createProductError(
      'The requested product could not be found.',
      PRODUCT_NOT_FOUND_ERROR_CODE,
    );
  }

  const actionName = normalizeText(action) || 'product_action';
  const timestamp = new Date().toISOString();

  return {
    success: true,
    status: 'confirmed',
    simulated: true,
    product,
    productId: product.id,
    action: actionName,
    confirmedAt: timestamp,
    message:
      'This action is simulated. No real product request or account change has been made.',
    analytics: trackProductAction(
      actionName,
      getActionDetails(product, {
        action: actionName,
        timestamp,
        success: true,
      }),
      options,
    ),
  };
}

/**
 * Retrieves catalogue products through a simulated local service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object[]>} Retrieved products.
 */
export async function retrieveProducts(options = {}) {
  const maxRetries = Math.max(
    0,
    Number.isFinite(Number(options.maxRetries))
      ? Math.floor(Number(options.maxRetries))
      : 0,
  );
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (
        options.simulateFailure === true ||
        options.shouldFail === true ||
        options.fail === true
      ) {
        throw createProductError(
          'We could not load the product catalogue.',
          PRODUCT_RETRIEVAL_ERROR_CODE,
          { attempt: attempt + 1, retryable: true },
        );
      }

      return listProducts(options);
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === PRODUCT_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createProductError(
          'We could not load the product catalogue.',
          PRODUCT_RETRIEVAL_ERROR_CODE,
          { cause: error, attempt: attempt + 1, retryable: true },
        );
      }

      attempt += 1;
    }
  }

  throw createProductError(
    'We could not load the product catalogue.',
    PRODUCT_RETRIEVAL_ERROR_CODE,
    { retryable: true },
  );
}

export const getProducts = listProducts;
export const fetchProducts = retrieveProducts;
export const getProductById = getProduct;
export const getProductDetails = selectProduct;
export const findProduct = getProduct;
export const filterProducts = queryProducts;
export const searchProductCatalogue = searchProducts;
export const calculateEstimatedInterest = calculateInterest;
export const simulateInterest = simulateInterestCalculation;
export const applyProduct = applyForProduct;
export const confirmApplication = applyForProduct;

export const PRODUCT_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: PRODUCT_RETRIEVAL_ERROR_CODE,
  NOT_FOUND: PRODUCT_NOT_FOUND_ERROR_CODE,
  INVALID_ACTION: INVALID_PRODUCT_ACTION_ERROR_CODE,
});

const productService = Object.freeze({
  listProducts,
  getProducts,
  retrieveProducts,
  fetchProducts,
  getProduct,
  getProductById,
  findProduct,
  selectProduct,
  getProductDetails,
  queryProducts,
  filterProducts,
  searchProducts,
  searchProductCatalogue,
  calculateInterest,
  calculateEstimatedInterest,
  simulateInterestCalculation,
  simulateInterest,
  applyForProduct,
  applyProduct,
  confirmApplication,
  confirmProductAction,
  trackProductAction,
  PRODUCT_SERVICE_ERROR_CODES,
});

export default productService;