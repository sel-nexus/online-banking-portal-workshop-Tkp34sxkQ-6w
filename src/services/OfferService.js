import { OFFERS } from '../fixtures/offers';
import {
  getProfileOffers,
  getActiveProfile,
} from './ProfileService';
import { listOffers as listRepositoryOffers } from './FixtureRepository';
import { isOfferValid, getReferenceDate } from '../utils/dateUtils';
import { redactForAnalytics } from '../utils/redaction';
import { simulateLoading } from '../utils/asyncUtils';

const OFFER_RETRIEVAL_ERROR_CODE = 'OFFER_RETRIEVAL_FAILED';
const OFFER_NOT_FOUND_ERROR_CODE = 'OFFER_NOT_FOUND';
const INVALID_OFFER_ACTION_ERROR_CODE = 'INVALID_OFFER_ACTION';

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

function normalizeOfferType(value) {
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

function normalizeReferenceDate(value) {
  if (value === undefined || value === null || value === '') {
    return getReferenceDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? getReferenceDate() : date;
}

function getOfferIdentifier(offer) {
  if (isRecord(offer)) {
    return offer.id || offer.offerId || null;
  }

  return offer ?? null;
}

function createOfferError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getOfferSource(options = {}) {
  if (Array.isArray(options.offers)) {
    return options.offers;
  }

  return listRepositoryOffers();
}

function isPersonalizedOffer(offer) {
  return offer?.personalized === true || offer?.isPersonalized === true;
}

function getOfferSearchText(offer) {
  return [
    offer?.id,
    offer?.offerId,
    offer?.title,
    offer?.name,
    offer?.description,
    offer?.details,
    offer?.type,
    offer?.category,
    offer?.code,
    offer?.terms,
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function offerMatchesQuery(offer, query) {
  const normalizedType = normalizeOfferType(offer?.type);
  const normalizedCategory = normalizeOfferType(offer?.category);
  const normalizedStatus = normalizeText(offer?.status).toLowerCase();

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
    query.personalized !== 'all' &&
    isPersonalizedOffer(offer) !== query.personalized
  ) {
    return false;
  }

  if (
    query.search &&
    !getOfferSearchText(offer).includes(query.search.toLowerCase())
  ) {
    return false;
  }

  return true;
}

function normalizeOfferQuery(options = {}) {
  const source = isRecord(options.query)
    ? { ...options.query, ...options }
    : isRecord(options)
      ? options
      : {};
  const personalizedValue = source.personalized ?? source.isPersonalized;

  return {
    search: normalizeText(
      source.search ?? source.queryText ?? source.keyword,
    ),
    type: normalizeOfferType(source.type || 'all'),
    category: normalizeOfferType(source.category || 'all'),
    status: normalizeText(source.status || 'all').toLowerCase(),
    personalized:
      personalizedValue === true || personalizedValue === false
        ? personalizedValue
        : 'all',
    page: normalizePage(source.page),
    pageSize: normalizePageSize(source.pageSize ?? source.limit),
  };
}

function belongsToRequestedProfile(offer, options) {
  if (!isPersonalizedOffer(offer)) {
    return true;
  }

  if (options.personalizedOnly !== true && offer?.includeInAllOffers === true) {
    return true;
  }

  if (options.personalizedOnly === true && !isPersonalizedOffer(offer)) {
    return false;
  }

  const profile = getActiveProfile(options.profileId, options.state);

  if (!profile) {
    return false;
  }

  const profileOffers = getProfileOffers(profile, options.state);
  const identifier = normalizeIdentifier(getOfferIdentifier(offer));

  return profileOffers.some(
    (profileOffer) =>
      normalizeIdentifier(getOfferIdentifier(profileOffer)) === identifier,
  );
}

function isVisibleOffer(offer, options = {}) {
  if (!isRecord(offer)) {
    return false;
  }

  const status = normalizeText(offer.status).toLowerCase();

  if (
    options.includeInactive !== true &&
    (status === 'inactive' || status === 'closed')
  ) {
    return false;
  }

  if (options.includeExpired !== true) {
    return isOfferValid(offer, normalizeReferenceDate(options.referenceDate));
  }

  return true;
}

function createOfferViewModel(offer, options = {}) {
  if (!isRecord(offer)) {
    return null;
  }

  const referenceDate = normalizeReferenceDate(options.referenceDate);
  const active = isOfferValid(offer, referenceDate);

  return Object.freeze({
    ...offer,
    id: offer.id || offer.offerId || null,
    offerId: offer.offerId || offer.id || null,
    title: offer.title || offer.name || 'Offer',
    name: offer.name || offer.title || 'Offer',
    description: offer.description || '',
    details: offer.details || offer.description || '',
    type: offer.type || '',
    category: offer.category || '',
    status: offer.status || (active ? 'active' : 'expired'),
    currency: offer.currency || 'PHP',
    isPersonalized: isPersonalizedOffer(offer),
    personalized: isPersonalizedOffer(offer),
    isActive: active,
    isExpired: !active,
    referenceDate: referenceDate.toISOString(),
    terms: offer.terms || '',
    startDate: offer.startDate || null,
    endDate: offer.endDate || offer.expiresAt || null,
    expiresAt: offer.expiresAt || offer.endDate || null,
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

function resolveOfferFromSource(offerOrId, offers) {
  const identifier = normalizeIdentifier(getOfferIdentifier(offerOrId));

  if (!identifier) {
    return null;
  }

  return (
    offers.find(
      (offer) =>
        normalizeIdentifier(offer.id) === identifier ||
        normalizeIdentifier(offer.offerId) === identifier,
    ) || null
  );
}

function getActionDetails(offer, options = {}) {
  return {
    offerId: offer?.id || offer?.offerId || null,
    offerType: offer?.type || null,
    offerCategory: offer?.category || null,
    action: options.action || 'offer_action',
    success: options.success !== false,
    simulated: true,
    timestamp: options.timestamp || new Date().toISOString(),
  };
}

/**
 * Records a privacy-safe simulated offer action.
 *
 * @param {string} action Action name.
 * @param {object} details Action details.
 * @param {object} options Analytics integration options.
 * @returns {object} Redacted analytics event.
 */
export function trackOfferAction(action, details = {}, options = {}) {
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
    // Analytics failures must not interrupt simulated offer actions.
  }

  return event;
}

/**
 * Lists active offers visible to the requested profile.
 *
 * @param {object} options Offer listing options.
 * @returns {object[]} Offer view models.
 */
export function listOffers(options = {}) {
  const sourceOffers = getOfferSource(options);

  return sourceOffers
    .filter((offer) => isVisibleOffer(offer, options))
    .filter((offer) => belongsToRequestedProfile(offer, options))
    .filter(
      (offer) =>
        options.personalizedOnly !== true || isPersonalizedOffer(offer),
    )
    .map((offer) => createOfferViewModel(offer, options))
    .filter(Boolean);
}

/**
 * Gets an active offer by identifier.
 *
 * @param {string|number|object} offerOrId Offer identifier or offer.
 * @param {object} options Offer lookup options.
 * @returns {object|null} Matching offer, or null.
 */
export function getOffer(offerOrId, options = {}) {
  const offer = resolveOfferFromSource(
    offerOrId,
    getOfferSource(options),
  );

  if (
    !offer ||
    !isVisibleOffer(offer, options) ||
    !belongsToRequestedProfile(offer, options)
  ) {
    return null;
  }

  return createOfferViewModel(offer, options);
}

/**
 * Returns detailed terms and eligibility information for an offer.
 *
 * @param {string|number|object} offerOrId Offer identifier or offer.
 * @param {object} options Offer detail options.
 * @returns {object|null} Detailed offer view model.
 */
export function selectOffer(offerOrId, options = {}) {
  const offer = getOffer(offerOrId, options);

  if (!offer) {
    return null;
  }

  return {
    ...offer,
    selected: true,
    terms: offer.terms || 'Terms and conditions are not available.',
    details: offer.details || offer.description || '',
    conditions: offer.conditions || null,
    eligibility: offer.eligibility || null,
    requirements: Array.isArray(offer.requirements)
      ? [...offer.requirements]
      : [],
  };
}

/**
 * Searches and filters offers with pagination.
 *
 * @param {object} options Offer query options.
 * @returns {object} Paginated offer result.
 */
export function queryOffers(options = {}) {
  const query = normalizeOfferQuery(options);
  const offers = listOffers(options).filter((offer) =>
    offerMatchesQuery(offer, query),
  );
  const paginated = paginate(offers, query);

  return {
    ...paginated,
    items: paginated.items,
    offers: paginated.items,
    query,
    status: 'ready',
    error: null,
  };
}

/**
 * Lists all active offers matching search and filters.
 *
 * @param {object} options Offer query options.
 * @returns {object[]} Matching offers.
 */
export function searchOffers(options = {}) {
  return queryOffers({
    ...options,
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  }).items;
}

/**
 * Confirms a simulated offer interaction.
 *
 * @param {string|number|object} offerOrId Offer identifier or offer.
 * @param {string} action Action name.
 * @param {object} options Action options.
 * @returns {object} Simulated confirmation.
 */
export function confirmOfferAction(offerOrId, action, options = {}) {
  const offer = getOffer(offerOrId, options);

  if (!offer) {
    throw createOfferError(
      'The requested offer could not be found.',
      OFFER_NOT_FOUND_ERROR_CODE,
    );
  }

  const actionName = normalizeText(action) || 'offer_action';
  const timestamp = new Date().toISOString();

  return {
    success: true,
    status: 'confirmed',
    simulated: true,
    offer,
    offerId: offer.id,
    action: actionName,
    confirmedAt: timestamp,
    message:
      'This offer interaction is simulated. No real offer has been redeemed or applied.',
    analytics: trackOfferAction(
      actionName,
      getActionDetails(offer, {
        action: actionName,
        timestamp,
        success: true,
      }),
      options,
    ),
  };
}

/**
 * Confirms simulated interest in an offer after a local loading delay.
 *
 * @param {string|number|object} offerOrId Offer identifier or offer.
 * @param {object} options Confirmation options.
 * @returns {Promise<object>} Simulated interest confirmation.
 */
export async function confirmOfferInterest(offerOrId, options = {}) {
  try {
    return await simulateLoading(
      () =>
        confirmOfferAction(offerOrId, 'offer_interest_confirmed', options),
      options,
    );
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createOfferError(
      'The simulated offer interest could not be confirmed.',
      INVALID_OFFER_ACTION_ERROR_CODE,
      { cause: error, retryable: true },
    );
  }
}

/**
 * Retrieves offers through a simulated local service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object[]>} Retrieved offers.
 */
export async function retrieveOffers(options = {}) {
  const maxRetries = Math.max(
    0,
    Number.isFinite(Number(options.maxRetries ?? options.retries))
      ? Math.floor(Number(options.maxRetries ?? options.retries))
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
        throw createOfferError(
          'We could not load the offer catalogue.',
          OFFER_RETRIEVAL_ERROR_CODE,
          { attempt: attempt + 1, retryable: true },
        );
      }

      return listOffers(options);
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === OFFER_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createOfferError(
          'We could not load the offer catalogue.',
          OFFER_RETRIEVAL_ERROR_CODE,
          { cause: error, attempt: attempt + 1, retryable: true },
        );
      }

      attempt += 1;
    }
  }

  throw createOfferError(
    'We could not load the offer catalogue.',
    OFFER_RETRIEVAL_ERROR_CODE,
    { retryable: true },
  );
}

export const getOffers = listOffers;
export const fetchOffers = retrieveOffers;
export const getOfferById = getOffer;
export const getOfferDetails = selectOffer;
export const findOffer = getOffer;
export const filterOffers = queryOffers;
export const searchOfferCatalogue = searchOffers;
export const confirmInterest = confirmOfferInterest;
export const confirmOffer = confirmOfferAction;

export const OFFER_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: OFFER_RETRIEVAL_ERROR_CODE,
  NOT_FOUND: OFFER_NOT_FOUND_ERROR_CODE,
  INVALID_ACTION: INVALID_OFFER_ACTION_ERROR_CODE,
});

const offerService = Object.freeze({
  listOffers,
  getOffers,
  retrieveOffers,
  fetchOffers,
  getOffer,
  getOfferById,
  findOffer,
  selectOffer,
  getOfferDetails,
  queryOffers,
  filterOffers,
  searchOffers,
  searchOfferCatalogue,
  confirmOfferAction,
  confirmOffer,
  confirmOfferInterest,
  confirmInterest,
  trackOfferAction,
  OFFER_SERVICE_ERROR_CODES,
});

export default offerService;