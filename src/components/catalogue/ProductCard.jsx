import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatStatus } from '../../utils/formatters';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';

const childrenPropType = () => null;

const DEFAULT_PRODUCT_PATH = '/products';

function getProductIdentifier(product) {
  return product?.id || product?.productId || null;
}

function getProductName(product) {
  return product?.name || product?.title || 'Product';
}

function normalizeProductCategory(product) {
  return (
    product?.category ||
    product?.type ||
    'banking'
  );
}

function getProductRate(product) {
  const rate =
    product?.interestRate ??
    product?.rate ??
    product?.annualRate ??
    product?.rates?.interestRate;

  if (rate === undefined || rate === null || rate === '') {
    return null;
  }

  const numericRate =
    typeof rate === 'number'
      ? rate
      : Number.parseFloat(String(rate).replace(/,/g, ''));

  return Number.isFinite(numericRate) ? numericRate : null;
}

function getProductBenefit(product) {
  if (product?.benefit || product?.primaryBenefit) {
    return product.benefit || product.primaryBenefit;
  }

  if (Array.isArray(product?.benefits) && product.benefits.length) {
    return product.benefits[0];
  }

  if (Array.isArray(product?.features) && product.features.length) {
    return product.features[0];
  }

  return product?.description || 'Explore this product and its illustrative features.';
}

function getEligibilitySummary(product) {
  const eligibility = product?.eligibility || {};
  const requirements = Array.isArray(eligibility.requirements)
    ? eligibility.requirements
    : Array.isArray(product?.requirements)
      ? product.requirements
      : [];
  const minimumAge =
    eligibility.minimumAge ??
    product?.minimumAge;
  const residency = eligibility.residency || product?.residency;

  if (requirements.length) {
    return requirements[0];
  }

  if (minimumAge || residency) {
    const details = [];

    if (minimumAge) {
      details.push(`Age ${minimumAge}+`);
    }

    if (residency) {
      details.push(String(residency));
    }

    return details.join(' • ');
  }

  return 'Eligibility requirements apply.';
}

function getProductPath(product, viewDetailsTo) {
  if (viewDetailsTo) {
    return viewDetailsTo;
  }

  const productId = getProductIdentifier(product);

  return productId
    ? `${DEFAULT_PRODUCT_PATH}/${encodeURIComponent(String(productId))}`
    : null;
}

function formatRate(rate) {
  return rate === null ? 'Rate information unavailable' : `${rate.toFixed(2)}% p.a.`;
}

/**
 * Renders a reusable product catalogue card.
 *
 * @param {object} props Component properties.
 * @param {object} props.product Product data to display.
 * @param {string} props.name Optional product-name override.
 * @param {string} props.category Optional product-category override.
 * @param {string|number} props.interestRate Optional interest-rate override.
 * @param {React.ReactNode} props.benefit Optional primary benefit override.
 * @param {React.ReactNode} props.eligibility Optional eligibility-summary override.
 * @param {string} props.viewDetailsTo Destination for the Learn More link.
 * @param {string} props.learnMoreLabel Learn More link label.
 * @param {Function} props.onLearnMore Callback invoked when Learn More is selected.
 * @param {Function} props.onAction Callback invoked for the simulated action.
 * @param {Function} props.onApply Alias for onAction.
 * @param {string} props.actionLabel Simulated-action button label.
 * @param {boolean} props.showAction Whether to show the simulated-action button.
 * @param {string} props.className Additional card classes.
 * @returns {JSX.Element} Product catalogue card.
 */
function ProductCard({
  actionLabel = 'Simulate action',
  benefit,
  category,
  className = '',
  eligibility,
  interestRate,
  learnMoreLabel = 'Learn more',
  name,
  onAction,
  onApply,
  onLearnMore,
  product = {},
  showAction = true,
  viewDetailsTo,
  ...props
}) {
  const resolvedName = name || getProductName(product);
  const resolvedCategory = category || normalizeProductCategory(product);
  const resolvedRate =
    interestRate !== undefined
      ? Number.isFinite(Number(interestRate))
        ? Number(interestRate)
        : null
      : getProductRate(product);
  const resolvedBenefit = benefit || getProductBenefit(product);
  const resolvedEligibility =
    eligibility || getEligibilitySummary(product);
  const productPath = getProductPath(product, viewDetailsTo);
  const actionHandler = onAction || onApply;
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

          <StatusBadge status={product.status || 'active'} />
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
              Indicative rate
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatRate(resolvedRate)}
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
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          {productPath ? (
            <Link
              aria-label={learnMoreAriaLabel}
              className="inline-flex rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={onLearnMore}
              to={productPath}
            >
              {learnMoreLabel}
            </Link>
          ) : (
            <Button
              aria-label={learnMoreAriaLabel}
              onClick={onLearnMore}
              type="button"
              variant="secondary"
            >
              {learnMoreLabel}
            </Button>
          )}

          {showAction ? (
            <Button
              aria-label={actionAriaLabel}
              onClick={actionHandler}
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

ProductCard.displayName = 'ProductCard';

ProductCard.propTypes = {
  actionLabel: () => null,
  benefit: childrenPropType,
  category: () => null,
  className: () => null,
  eligibility: childrenPropType,
  interestRate: () => null,
  learnMoreLabel: () => null,
  name: () => null,
  onAction: () => null,
  onApply: () => null,
  onLearnMore: () => null,
  product: () => null,
  showAction: () => null,
  viewDetailsTo: () => null,
};

export {
  formatRate,
  getEligibilitySummary,
  getProductBenefit,
  getProductIdentifier,
  getProductName,
  getProductPath,
  getProductRate,
  normalizeProductCategory,
};

export default ProductCard;