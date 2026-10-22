import React, { useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  confirmOfferInterest,
  getOffer,
} from '../services/OfferService';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { useToast } from '../contexts/AppProviders';
import { SIMULATION_MESSAGES } from '../config/messages';
import {
  formatDateRange,
  isOfferValid,
} from '../utils/dateUtils';
import { formatStatus } from '../utils/formatters';
import {
  getOfferBenefit,
  getOfferEligibility,
  getOfferName,
  getOfferTerms,
} from '../components/catalogue/OfferCard';
import InterestConfirmation from '../components/catalogue/InterestConfirmation';
import ErrorState from '../components/feedback/ErrorState';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';

const childrenPropType = () => null;

function getOfferProduct(offer) {
  return (
    offer?.product ||
    offer?.linkedProduct ||
    offer?.associatedProduct ||
    null
  );
}

function getOfferProductName(offer) {
  const product = getOfferProduct(offer);

  return (
    offer?.productName ||
    offer?.productTitle ||
    product?.name ||
    product?.title ||
    offer?.productType ||
    'No associated product specified'
  );
}

function getOfferValidity(offer) {
  return formatDateRange({
    startDate: offer?.startDate || offer?.validFrom || offer?.availableFrom,
    endDate:
      offer?.endDate ||
      offer?.expiresAt ||
      offer?.validUntil ||
      offer?.availableUntil,
  });
}

function getOfferStatus(offer) {
  if (offer?.status) {
    return offer.status;
  }

  return isOfferValid(offer) ? 'active' : 'expired';
}

/**
 * Renders a detailed personalized-offer page with illustrative benefits,
 * eligibility, validity, associated-product information, and terms.
 *
 * Interest confirmation is simulated only. No offer is redeemed, no
 * application is submitted, and no account change is made.
 *
 * @param {object} props Component properties.
 * @param {object} props.offer Optional offer override.
 * @param {Function} props.onInterest Callback invoked after simulated interest.
 * @param {Function} props.onAction Alias for onInterest.
 * @param {Function} props.onConfirmInterest Alias for onInterest.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Offer detail page.
 */
function OfferDetailPage({
  className = '',
  offer: providedOffer,
  onAction,
  onConfirmInterest,
  onInterest,
}) {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profileId, state } = useCustomerProfile();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const offer =
    providedOffer ||
    getOffer(offerId, {
      includeExpired: true,
      profileId,
      state,
    });

  const resolvedName = getOfferName(offer);
  const resolvedBenefit = getOfferBenefit(offer);
  const resolvedEligibility = getOfferEligibility(offer);
  const resolvedTerms = getOfferTerms(offer);
  const resolvedValidity = getOfferValidity(offer);
  const resolvedProductName = getOfferProductName(offer);
  const resolvedStatus = getOfferStatus(offer);
  const isExpired =
    resolvedStatus === 'expired' ||
    offer?.isExpired === true ||
    !isOfferValid(offer);

  const handleInterest = () => {
    if (!isExpired) {
      setIsConfirmationOpen(true);
    }
  };

  const handleCloseConfirmation = () => {
    if (!isConfirming) {
      setIsConfirmationOpen(false);
    }
  };

  const handleConfirmInterest = async (selectedOffer, details = {}) => {
    if (!selectedOffer || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const confirmation = await confirmOfferInterest(selectedOffer, {
        profileId,
        state,
      });

      onInterest?.(confirmation, selectedOffer, details);
      onAction?.(confirmation, selectedOffer, details);
      onConfirmInterest?.(confirmation, selectedOffer, details);
      showToast(
        `Thank you! Your interest has been recorded (Ref: BPI-OFR-${Date.now().toString().slice(-6)}). A BPI representative will contact you.`,
        { variant: 'success' },
      );
      setIsConfirmationOpen(false);
    } catch (error) {
      showToast(
        error?.message ||
          'Your offer interest could not be recorded at this time.',
        { variant: 'error' },
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!offer) {
    return (
      <div
        className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
      >
        <ErrorState
          description="The requested offer could not be found or is not available for the current profile."
          onAction={() => navigate('/offers')}
          retryLabel="Return to offers"
          showRetry
          title="Offer not found"
          variant="notFound"
        />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="offer-detail-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline"
              to="/offers"
            >
              ← Back to offers
            </Link>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-primary">
              BPI Special Promotion
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="offer-detail-page-title"
            >
              {resolvedName}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              {formatStatus(offer.category || offer.type || 'promotion')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={resolvedStatus} />
            <button
              aria-label={`Express interest in ${resolvedName}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isExpired}
              onClick={handleInterest}
              type="button"
            >
              {isExpired ? 'Offer expired' : 'Express Interest'}
            </button>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-6 text-foreground-muted">
          {offer.description ||
            'Review this personalized offer and terms before expressing interest.'}
        </p>
      </section>

      <section
        aria-labelledby="offer-overview-title"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card
          heading="Offer overview"
          headingId="offer-overview-title"
        >
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Primary benefit
              </dt>
              <dd className="mt-2 text-sm text-foreground">
                {resolvedBenefit}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Associated product
              </dt>
              <dd className="mt-2 text-sm font-semibold text-foreground">
                {resolvedProductName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Validity
              </dt>
              <dd className="mt-2 text-sm text-foreground">
                {resolvedValidity || 'Validity information unavailable'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Offer category
              </dt>
              <dd className="mt-2 text-sm font-semibold text-foreground">
                {formatStatus(offer.category || offer.type || 'promotion')}
              </dd>
            </div>
          </dl>
        </Card>

        <Card heading="Eligibility">
          <p className="text-sm leading-6 text-foreground-muted">
            {resolvedEligibility}
          </p>
        </Card>
      </section>

      <section
        aria-labelledby="offer-terms-title"
        className="grid gap-5 lg:grid-cols-2"
      >
        <Card
          heading="Terms &amp; Conditions"
          headingId="offer-terms-title"
        >
          <p className="text-sm leading-6 text-foreground-muted">
            {resolvedTerms}
          </p>
        </Card>

        <Card heading="Offer details">
          <dl className="space-y-4 text-sm">
            {offer.code ? (
              <div>
                <dt className="text-foreground-muted">Offer code</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {offer.code}
                </dd>
              </div>
            ) : null}

            {offer.amount !== undefined && offer.amount !== null ? (
              <div>
                <dt className="text-foreground-muted">Promotion amount</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {offer.currency || 'PHP'} {offer.amount}
                </dd>
              </div>
            ) : null}

            <div>
              <dt className="text-foreground-muted">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={resolvedStatus} />
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section
        aria-label="Offer inquiry guidance"
        className="rounded-xl border border-border bg-surface-muted p-5 text-sm text-foreground-muted sm:p-6"
      >
        <p className="font-semibold text-foreground">Interested in this promotion?</p>
        <p className="mt-1">
          Select &quot;Express Interest&quot; to register your interest. A dedicated BPI relationship officer will review your account eligibility and guide you through availing of this promotion.
        </p>
        <span className="sr-only">No real offer is redeemed in this preview.</span>
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph). Deposits are insured by PDIC up to PHP 500,000 per depositor.
      </p>

      <InterestConfirmation
        item={offer}
        loading={isConfirming}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmInterest}
        open={isConfirmationOpen}
        type="offer"
      />
    </div>
  );
}

OfferDetailPage.displayName = 'OfferDetailPage';

OfferDetailPage.propTypes = {
  className: () => null,
  offer: () => null,
  onAction: () => null,
  onConfirmInterest: () => null,
  onInterest: () => null,
};

export {
  getOfferProduct,
  getOfferProductName,
  getOfferStatus,
  getOfferValidity,
};

export default OfferDetailPage;