import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateRange } from '../../utils/dateUtils';
import { formatStatus } from '../../utils/formatters';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

const childrenPropType = () => null;

const DEFAULT_OFFER_PATH = '/offers';

function getOfferIdentifier(offer) {
  return offer?.id || offer?.offerId || null;
}

function getOfferName(offer) {
  return offer?.title || offer?.name || 'Offer';
}

function normalizeOfferCategory(offer) {
  return offer?.category || offer?.type || 'promotion';
}

function getOfferBenefit(offer) {
  if (offer?.benefit || offer?.primaryBenefit) {
    return offer.benefit || offer.primaryBenefit;
  }

  if (Array.isArray(offer?.benefits) && offer.benefits.length) {
    return offer.benefits[0];
  }

  return (
    offer?.description ||
    offer?.details ||
    'Explore this personalized offer and its illustrative benefits.'
  );
}

function getOfferEligibility(offer) {
  const eligibility = offer?.eligibility || {};
  const requirements = Array.isArray(eligibility.requirements)
    ? eligibility.requirements
    : Array.isArray(offer?.requirements)
      ? offer.requirements
      : [];

  if (requirements.length) {
    return requirements[0];
  }

  const minimumAge = eligibility.minimumAge ?? offer?.minimumAge;
  const residency = eligibility.residency || offer?.residency;
  const details = [];

  if (minimumAge) {
    details.push(`Age ${minimumAge}+`);
  }

  if (residency) {
    details.push(String(residency));
  }

  return details.length
    ? details.join(' • ')
    : 'Eligibility requirements apply.';
}

function getOfferTerms(offer) {
  return (
    offer?.terms ||
    offer?.conditions ||
    offer?.termsAndConditions ||
    'Terms and conditions apply.'
  );
}

function getOfferValidity(offer) {
  return {
    startDate: offer?.startDate || offer?.validFrom || offer?.availableFrom,
    endDate:
      offer?.endDate ||
      offer?.expiresAt ||
      offer?.validUntil ||
      offer?.availableUntil,
  };
}

function formatOfferValidity(offer) {
  const validity = getOfferValidity(offer);
  const formattedRange = formatDateRange(validity);

  return formattedRange || 'Validity information unavailable';
}

function getOfferPath(offer, viewDetailsTo) {
  if (viewDetailsTo) {
    return viewDetailsTo;
  }

  const offerId = getOfferIdentifier(offer);

  return offerId
    ? `${DEFAULT_OFFER_PATH}/${encodeURIComponent(String(offerId))}`
    : null;
}

/**
 * Renders a reusable personalized offer card.
 *
 * @param {object} props Component properties.
 * @param {object} props.offer Offer data to display.
 * @param {string} props.name Optional offer-name override.
 * @param {string} props.category Optional offer-category override.
 * @param {React.ReactNode} props.benefit Optional primary-benefit override.
 * @param {React.ReactNode} props.validity Optional validity-period override.
 * @param {React.ReactNode} props.eligibility Optional eligibility-summary override.
 * @param {React.ReactNode} props.terms Optional illustrative-terms override.
 * @param {string} props.viewDetailsTo Destination for the offer-details link.
 * @param {string} props.learnMoreLabel Offer-details link label.
 * @param {Function} props.onLearnMore Callback invoked when offer details are selected.
 * @param {Function} props.onInterest Callback invoked for the simulated interest action.
 * @param {Function} props.onAction Alias for onInterest.
 * @param {Function} props.onConfirmInterest Alias for onInterest.
 * @param {string} props.actionLabel Simulated-interest button label.
 * @param {boolean} props.showAction Whether to show the simulated-interest button.
 * @param {string} props.className Additional card classes.
 * @returns {JSX.Element} Personalized offer card.
 */
function OfferCard({
  actionLabel = 'I’m interested',
  benefit,
  category,
  className = '',
  eligibility,
  learnMoreLabel = 'View offer',
  name,
  offer = {},
  onAction,
  onConfirmInterest,
  onInterest,
  onLearnMore,
  showAction = true,
  terms,
  validity,
  viewDetailsTo,
  ...props
}) {
  const resolvedName = name || getOfferName(offer);
  const resolvedCategory = category || normalizeOfferCategory(offer);
  const resolvedBenefit = benefit || getOfferBenefit(offer);
  const resolvedValidity = validity || formatOfferValidity(offer);
  const resolvedEligibility = eligibility || getOfferEligibility(offer);
  const resolvedTerms = terms || getOfferTerms(offer);
  const offerPath = getOfferPath(offer, viewDetailsTo);
  const interestHandler = onInterest || onAction || onConfirmInterest;
  const learnMoreAriaLabel = `${learnMoreLabel} about ${resolvedName}`;
  const actionAriaLabel = `${actionLabel} for ${resolvedName}`;

  return (
    <Card
      {...props}
      className={`h-full ${className}`.trim()}
      heading={resolvedName}
      subtitle={formatStatus(resolvedCategory)}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Category
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatStatus(resolvedCategory)}
            </p>
          </div>

          <StatusBadge status={offer.status || 'active'} />
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Benefit
            </p>
            <p className="mt-1 text-sm text-foreground">
              {resolvedBenefit}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Validity
            </p>
            <p className="mt-1 text-sm text-foreground">
              {resolvedValidity}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Eligibility
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              {resolvedEligibility}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Terms &amp; Conditions
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              {resolvedTerms}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          {offerPath ? (
            <Link
              aria-label={learnMoreAriaLabel}
              className={`inline-flex rounded-md px-4 py-2 text-sm font-semibold no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                String(learnMoreLabel).toLowerCase().includes('view offer')
                  ? 'bg-primary text-white hover:bg-primary-700'
                  : 'border border-border-strong bg-surface text-foreground hover:bg-background-muted'
              }`}
              onClick={onLearnMore}
              to={offerPath}
            >
              {learnMoreLabel}
            </Link>
          ) : (
            <Button
              aria-label={learnMoreAriaLabel}
              onClick={onLearnMore}
              type="button"
              variant="primary"
            >
              {learnMoreLabel}
            </Button>
          )}

          {showAction ? (
            <Button
              aria-label={actionAriaLabel}
              disabled={!interestHandler}
              onClick={interestHandler}
              type="button"
              variant="secondary"
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

OfferCard.displayName = 'OfferCard';

OfferCard.propTypes = {
  actionLabel: () => null,
  benefit: childrenPropType,
  category: () => null,
  className: () => null,
  eligibility: childrenPropType,
  learnMoreLabel: () => null,
  name: () => null,
  offer: () => null,
  onAction: () => null,
  onConfirmInterest: () => null,
  onInterest: () => null,
  onLearnMore: () => null,
  showAction: () => null,
  terms: childrenPropType,
  validity: childrenPropType,
  viewDetailsTo: () => null,
};

export {
  formatOfferValidity,
  getOfferBenefit,
  getOfferEligibility,
  getOfferIdentifier,
  getOfferName,
  getOfferPath,
  getOfferTerms,
  getOfferValidity,
  normalizeOfferCategory,
};

export default OfferCard;