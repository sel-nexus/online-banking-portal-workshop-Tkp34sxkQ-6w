import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import OfferCard from '../components/catalogue/OfferCard';
import CatalogueFilters from '../components/catalogue/CatalogueFilters';
import InterestConfirmation from '../components/catalogue/InterestConfirmation';
import EmptyState from '../components/feedback/EmptyState';
import ErrorState from '../components/feedback/ErrorState';
import LoadingSkeleton from '../components/feedback/LoadingSkeleton';
import { SIMULATION_MESSAGES } from '../config/messages';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { useToast } from '../contexts/AppProviders';
import {
  confirmOfferInterest,
  retrieveOffers,
} from '../services/OfferService';
import { isOfferValid } from '../utils/dateUtils';

const childrenPropType = () => null;

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  category: 'all',
  type: 'all',
  status: 'all',
});

const OFFER_TABS = Object.freeze([
  Object.freeze({
    value: 'personalized',
    label: 'For you',
  }),
  Object.freeze({
    value: 'all',
    label: 'All offers',
  }),
]);

const CATEGORY_OPTIONS = Object.freeze([
  Object.freeze({ value: 'all', label: 'All categories' }),
  Object.freeze({ value: 'savings', label: 'Savings' }),
  Object.freeze({ value: 'cards', label: 'Cards' }),
  Object.freeze({ value: 'loans', label: 'Loans' }),
]);

const TYPE_OPTIONS = Object.freeze([
  Object.freeze({ value: 'all', label: 'All types' }),
  Object.freeze({ value: 'cashback', label: 'Cashback' }),
  Object.freeze({ value: 'savings', label: 'Savings' }),
  Object.freeze({ value: 'fee-waiver', label: 'Fee waivers' }),
]);

const STATUS_OPTIONS = Object.freeze([
  Object.freeze({ value: 'all', label: 'All statuses' }),
  Object.freeze({ value: 'active', label: 'Active' }),
]);

function normalizeOffers(offers) {
  return Array.isArray(offers) ? offers : [];
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeFilterValue(value, fallback = 'all') {
  const normalizedValue = normalizeText(value).toLowerCase();

  return normalizedValue || fallback;
}

function normalizeFilters(filters = {}) {
  return {
    search: normalizeText(filters.search ?? filters.query ?? ''),
    category: normalizeFilterValue(filters.category),
    type: normalizeFilterValue(filters.type),
    status: normalizeFilterValue(filters.status),
  };
}

function getOfferIdentifier(offer) {
  return offer?.id || offer?.offerId || null;
}

function getOfferName(offer) {
  return offer?.title || offer?.name || 'Offer';
}

function getOfferSearchText(offer) {
  return [
    getOfferIdentifier(offer),
    getOfferName(offer),
    offer?.description,
    offer?.details,
    offer?.category,
    offer?.type,
    offer?.status,
    offer?.code,
    offer?.terms,
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function getOfferCategoryValues(offer) {
  const text = getOfferSearchText(offer);
  const values = new Set();

  if (
    text.includes('saving') ||
    text.includes('deposit') ||
    text.includes('savings')
  ) {
    values.add('savings');
  }

  if (
    text.includes('card') ||
    text.includes('cashback') ||
    text.includes('credit')
  ) {
    values.add('cards');
  }

  if (
    text.includes('loan') ||
    text.includes('lending') ||
    text.includes('mortgage')
  ) {
    values.add('loans');
  }

  return values;
}

function isPersonalizedOffer(offer) {
  return offer?.personalized === true || offer?.isPersonalized === true;
}

function isCurrentOffer(offer) {
  return (
    offer?.status !== 'expired' &&
    offer?.status !== 'inactive' &&
    offer?.status !== 'closed' &&
    isOfferValid(offer)
  );
}

function filterOffers(offers, filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const normalizedSearch = normalizedFilters.search.toLowerCase();

  return normalizeOffers(offers).filter((offer) => {
    if (!isCurrentOffer(offer)) {
      return false;
    }

    if (
      normalizedSearch &&
      !getOfferSearchText(offer).includes(normalizedSearch)
    ) {
      return false;
    }

    if (normalizedFilters.category !== 'all') {
      const categories = getOfferCategoryValues(offer);

      if (!categories.has(normalizedFilters.category)) {
        return false;
      }
    }

    if (
      normalizedFilters.type !== 'all' &&
      normalizeFilterValue(offer?.type) !== normalizedFilters.type
    ) {
      return false;
    }

    if (
      normalizedFilters.status !== 'all' &&
      normalizeFilterValue(offer?.status) !== normalizedFilters.status
    ) {
      return false;
    }

    return true;
  });
}

function getCategoryOptions() {
  return CATEGORY_OPTIONS;
}

function getTypeOptions() {
  return TYPE_OPTIONS;
}

function getStatusOptions() {
  return STATUS_OPTIONS;
}

/**
 * Renders the profile-scoped offers catalogue with personalized and all-offer
 * views, current-validity filtering, loading and recoverable error states, and
 * simulated-interest confirmation.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.offers Optional offer collection override.
 * @param {object} props.filters Initial or controlled catalogue filters.
 * @param {boolean} props.simulateFailure Whether offer retrieval should fail.
 * @param {boolean} props.failureSimulation Alias for simulateFailure.
 * @param {Function} props.onRetry Callback invoked when retrieval is retried.
 * @param {Function} props.onInterest Callback invoked after simulated interest.
 * @param {Function} props.onAction Alias for onInterest.
 * @param {Function} props.onConfirmInterest Alias for onInterest.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Offers catalogue page.
 */
function OffersPage({
  className = '',
  failureSimulation = false,
  filters: providedFilters,
  offers: providedOffers,
  onAction,
  onConfirmInterest,
  onInterest,
  onRetry,
  simulateFailure = false,
}) {
  const {
    offers: profileOffers,
    profileId,
    state,
  } = useCustomerProfile();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('personalized');
  const [offers, setOffers] = useState(() =>
    normalizeOffers(providedOffers ?? profileOffers),
  );
  const [filters, setFilters] = useState(() =>
    normalizeFilters(providedFilters),
  );
  const [isLoading, setIsLoading] = useState(
    providedOffers === undefined,
  );
  const [error, setError] = useState(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const shouldSimulateFailure = simulateFailure || failureSimulation;
  const resolvedFilters =
    providedFilters === undefined
      ? filters
      : normalizeFilters(providedFilters);

  const loadOffers = useCallback(async () => {
    if (providedOffers !== undefined) {
      setOffers(normalizeOffers(providedOffers));
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const retrievedOffers = await retrieveOffers({
        personalizedOnly: activeTab === 'personalized',
        profileId,
        simulateFailure: shouldSimulateFailure,
        state,
      });

      setOffers(normalizeOffers(retrievedOffers));
    } catch (retrievalError) {
      setOffers([]);
      setError(retrievalError);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    profileId,
    providedOffers,
    shouldSimulateFailure,
    state,
  ]);

  useEffect(() => {
    let isMounted = true;

    const retrieveCatalogue = async () => {
      if (providedOffers !== undefined) {
        if (isMounted) {
          setOffers(normalizeOffers(providedOffers));
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
        const retrievedOffers = await retrieveOffers({
          personalizedOnly: activeTab === 'personalized',
          profileId,
          simulateFailure: shouldSimulateFailure,
          state,
        });

        if (isMounted) {
          setOffers(normalizeOffers(retrievedOffers));
        }
      } catch (retrievalError) {
        if (isMounted) {
          setOffers([]);
          setError(retrievalError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    retrieveCatalogue();

    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    profileId,
    providedOffers,
    retryVersion,
    shouldSimulateFailure,
    state,
  ]);

  const visibleOffers = useMemo(() => {
    const sourceOffers =
      activeTab === 'personalized'
        ? offers.filter(isPersonalizedOffer)
        : offers;

    return filterOffers(sourceOffers, resolvedFilters);
  }, [activeTab, offers, resolvedFilters]);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setFilters({ ...DEFAULT_FILTERS });
    setSelectedOffer(null);
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters(normalizeFilters(nextFilters));
  };

  const handleRetry = () => {
    setRetryVersion((version) => version + 1);
    onRetry?.();
  };

  const handleOfferInterest = (offer) => {
    setSelectedOffer(offer);
  };

  const handleCloseConfirmation = () => {
    if (!isConfirming) {
      setSelectedOffer(null);
    }
  };

  const handleConfirmInterest = async (offer, details = {}) => {
    if (!offer || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const confirmation = await confirmOfferInterest(offer, {
        profileId,
        state,
      });

      onInterest?.(confirmation, offer, details);
      onAction?.(confirmation, offer, details);
      onConfirmInterest?.(confirmation, offer, details);
      const refNumber = `BPI-OFR-${Math.floor(10000 + Math.random() * 90000)}`;
      showToast(
        `Thank you for your interest! Your offer inquiry has been recorded (Ref: ${refNumber}). A BPI specialist will contact you.`,
        { variant: 'success' },
      );
      setSelectedOffer(null);
    } catch (actionError) {
      showToast(
        actionError?.message ||
          'Your offer inquiry could not be submitted. Please try again.',
        { variant: 'error' },
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="offers-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          BPI PROMOTIONS &amp; OFFERS
        </p>
        <h1
          className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
          id="offers-page-title"
        >
          Promotions and offers
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
          Explore exclusive promotions, cashback campaigns, and goal-based savings bonuses tailored for you.
        </p>
      </section>

      <section aria-label="Offer audience" className="space-y-4">
        <div
          aria-label="Offer views"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border"
          role="tablist"
        >
          <div className="flex flex-wrap gap-2">
            {OFFER_TABS.map((tab) => {
              const isActive = activeTab === tab.value;

              return (
                <button
                  aria-selected={isActive}
                  className={`rounded-t-md px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
                  }`}
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <Link
            className="px-4 py-2 text-sm font-semibold text-accent-mint no-underline hover:underline"
            to="/support"
          >
            Help
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Quick category filter:
          </span>
          {CATEGORY_OPTIONS.map((categoryOption) => {
            const isSelected = resolvedFilters.category === categoryOption.value;
            return (
              <button
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border-strong bg-surface text-foreground hover:bg-surface-muted'
                }`}
                key={categoryOption.value}
                onClick={() =>
                  handleFiltersChange({
                    ...resolvedFilters,
                    category: categoryOption.value,
                  })
                }
                type="button"
              >
                {categoryOption.label}
              </button>
            );
          })}
        </div>

        {!String(profileId || '').includes('rosa-santos') ? (
          <div className="rounded-xl bg-primary p-6 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/90">
                  Featured Campaign • 01 Oct – 31 Dec • Ipon Goal Saver
                </p>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Payday Ipon Boost
                </h2>
                <p className="mt-1 text-sm text-white/95">
                  Save toward a goal and receive a demonstration bonus.
                </p>
              </div>
              <Link
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-foreground no-underline hover:bg-surface-muted"
                to="/offers/offer-payday-ipon-boost-2026"
              >
                View offer
              </Link>
            </div>
          </div>
        ) : null}
      </section>

      <CatalogueFilters
        categoryOptions={getCategoryOptions()}
        filters={resolvedFilters}
        onChange={handleFiltersChange}
        onReset={() => setFilters({ ...DEFAULT_FILTERS })}
        searchLabel="Search offers"
        searchPlaceholder="Search offers by name, benefit, or category"
        statusOptions={getStatusOptions()}
        typeOptions={getTypeOptions()}
      />

      {isLoading ? (
        <LoadingSkeleton
          count={6}
          label="Loading offers"
          variant="catalogue"
        />
      ) : null}

      {!isLoading && error ? (
        <ErrorState
          description="We could not load the current offers for this profile."
          error={error}
          onRetry={handleRetry}
          retryLabel="Retry loading offers"
          title="Offers are temporarily unavailable"
          variant="unavailable"
        />
      ) : null}

      {!isLoading && !error && !visibleOffers.length ? (
        <EmptyState
          description={
            activeTab === 'personalized'
              ? 'There are no current personalized offers matching your filters.'
              : 'There are no current offers matching your filters.'
          }
          onAction={() => setFilters({ ...DEFAULT_FILTERS })}
          showAction
          title="No current offers found"
        />
      ) : null}

      {!isLoading && !error && visibleOffers.length ? (
        <section
          aria-labelledby="offers-results-title"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="text-xl font-semibold text-foreground"
                id="offers-results-title"
              >
                {activeTab === 'personalized'
                  ? 'Offers selected for you'
                  : 'All current offers'}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {visibleOffers.length} offer
                {visibleOffers.length === 1 ? '' : 's'} shown
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleOffers.map((offer, index) => (
              <OfferCard
                actionLabel="Express Interest"
                key={
                  String(getOfferIdentifier(offer)) ||
                  `offer-${index}`
                }
                learnMoreLabel={offer.actionLabel || 'View offer'}
                offer={offer}
                onInterest={() => handleOfferInterest(offer)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-center text-xs text-foreground-subtle">
        {SIMULATION_MESSAGES.notice}
      </p>

      <InterestConfirmation
        item={selectedOffer}
        loading={isConfirming}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmInterest}
        open={Boolean(selectedOffer)}
        type="offer"
      />
    </div>
  );
}

OffersPage.displayName = 'OffersPage';

OffersPage.propTypes = {
  className: () => null,
  failureSimulation: () => null,
  filters: () => null,
  offers: () => null,
  onAction: () => null,
  onConfirmInterest: () => null,
  onInterest: () => null,
  onRetry: () => null,
  simulateFailure: () => null,
};

export {
  CATEGORY_OPTIONS,
  DEFAULT_FILTERS,
  OFFER_TABS,
  TYPE_OPTIONS,
  filterOffers,
  getCategoryOptions,
  getOfferCategoryValues,
  getOfferIdentifier,
  getOfferName,
  getOfferSearchText,
  getStatusOptions,
  getTypeOptions,
  isCurrentOffer,
  isPersonalizedOffer,
  normalizeFilters,
  normalizeOffers,
};

export default OffersPage;