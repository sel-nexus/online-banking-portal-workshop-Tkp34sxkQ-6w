import React, { useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { getProduct, confirmProductAction } from '../services/ProductService';
import { useToast } from '../contexts/AppProviders';
import { SIMULATION_MESSAGES } from '../config/messages';
import {
  formatCurrency,
  formatStatus,
} from '../utils/formatters';
import {
  getEligibilitySummary,
  getProductBenefit,
  getProductName,
  getProductRate,
} from '../components/catalogue/ProductCard';
import InterestConfirmation from '../components/catalogue/InterestConfirmation';
import ErrorState from '../components/feedback/ErrorState';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';

const childrenPropType = () => null;

function formatRate(rate) {
  return rate === null || rate === undefined
    ? 'Rate information unavailable'
    : `${Number(rate).toFixed(2)}% p.a.`;
}

function formatTermValue(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([key, childValue]) => {
        const label = formatStatus(key);

        return `${label}: ${formatTermValue(childValue)}`;
      })
      .join(' • ');
  }

  if (Array.isArray(value)) {
    return value.map(formatTermValue).filter(Boolean).join(' • ');
  }

  return String(value);
}

function getProductTerms(product) {
  const terms = product?.terms || product?.conditions;

  if (!terms) {
    return 'Terms and conditions apply.';
  }

  return formatTermValue(terms);
}

function getMinimumAmount(product) {
  return (
    product?.minimumAmount ??
    product?.minimumOpeningDeposit ??
    product?.minimumPlacement ??
    product?.terms?.minimumOpeningDeposit ??
    product?.terms?.minimumPlacement ??
    null
  );
}

function getMaximumAmount(product) {
  return (
    product?.maximumAmount ??
    product?.maximumLoanAmount ??
    product?.terms?.maximumAmount ??
    null
  );
}

/**
 * Renders a detailed catalogue product page with illustrative information and
 * a simulated apply or express-interest action.
 *
 * No application, account change, or external request is submitted.
 *
 * @param {object} props Component properties.
 * @param {string} props.className Additional page classes.
 * @param {object} props.product Optional product override.
 * @param {Function} props.onAction Callback invoked after the simulated action.
 * @param {Function} props.onApply Alias for onAction.
 * @returns {JSX.Element} Product detail page.
 */
function ProductDetailPage({
  className = '',
  onAction,
  onApply,
  product: providedProduct,
}) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const product = providedProduct || getProduct(productId);
  const resolvedName = getProductName(product);
  const resolvedRate = getProductRate(product);
  const resolvedBenefit = getProductBenefit(product);
  const resolvedEligibility = getEligibilitySummary(product);
  const resolvedTerms = getProductTerms(product);
  const minimumAmount = getMinimumAmount(product);
  const maximumAmount = getMaximumAmount(product);

  const handleAction = () => {
    setIsConfirmationOpen(true);
  };

  const handleCloseConfirmation = () => {
    if (!isConfirming) {
      setIsConfirmationOpen(false);
    }
  };

  const handleConfirmAction = (selectedProduct, details = {}) => {
    if (!selectedProduct || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const confirmation = confirmProductAction(
        selectedProduct,
        'product_application_confirmed',
      );

      onAction?.(confirmation, selectedProduct, details);
      onApply?.(confirmation, selectedProduct, details);
      const refNumber = `BPI-INQ-${Math.floor(10000 + Math.random() * 90000)}`;
      showToast(
        `Thank you for your interest! Your product inquiry has been recorded (Ref: ${refNumber}). A BPI representative will contact you.`,
        { variant: 'success' },
      );
      setIsConfirmationOpen(false);
    } catch (error) {
      showToast(
        error?.message ||
          'Your product inquiry could not be submitted. Please try again.',
        { variant: 'error' },
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!product) {
    return (
      <div
        className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
      >
        <ErrorState
          description="The requested product could not be found or is no longer available."
          onAction={() => navigate('/products')}
          retryLabel="Return to products"
          showRetry
          title="Product not found"
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
        aria-labelledby="product-detail-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline"
              to="/products"
            >
              ← Back to products
            </Link>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-primary">
              BPI PRODUCT DETAILS
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="product-detail-page-title"
            >
              {resolvedName}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              {formatStatus(product.category || product.type || 'banking')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={product.status || 'active'} />
            <button
              aria-label={`Apply or express interest in ${resolvedName}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={handleAction}
              type="button"
            >
              Apply / express interest
            </button>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-6 text-foreground-muted">
          {product.description ||
            'Review this banking product and its features before expressing interest.'}
        </p>
      </section>

      <section
        aria-labelledby="product-overview-title"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card
          heading="Product overview"
          headingId="product-overview-title"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Primary benefit
              </p>
              <p className="mt-2 text-sm text-foreground">
                {resolvedBenefit}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Indicative rate
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {formatRate(resolvedRate)}
              </p>
            </div>

            {minimumAmount !== null ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                  Minimum amount
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatCurrency(minimumAmount, {
                    currency: product.currency || 'PHP',
                  })}
                </p>
              </div>
            ) : null}

            {maximumAmount !== null ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                  Maximum amount
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {formatCurrency(maximumAmount, {
                    currency: product.currency || 'PHP',
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card heading="Eligibility">
          <p className="text-sm leading-6 text-foreground-muted">
            {resolvedEligibility}
          </p>
        </Card>
      </section>

      <section
        aria-labelledby="product-features-title"
        className="grid gap-5 lg:grid-cols-2"
      >
        <Card
          heading="Product features"
          headingId="product-features-title"
        >
          {Array.isArray(product.features) && product.features.length ? (
            <ul className="space-y-3 text-sm text-foreground-muted">
              {product.features.map((feature, index) => (
                <li className="flex gap-3" key={`${feature}-${index}`}>
                  <span
                    aria-hidden="true"
                    className="font-bold text-success-700"
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">
              Feature information is not currently available.
            </p>
          )}
        </Card>

        <Card heading="Terms &amp; Conditions">
          <p className="text-sm leading-6 text-foreground-muted">
            {resolvedTerms}
          </p>
        </Card>
      </section>

      <section
        aria-label="Product inquiry guidance"
        className="rounded-xl border border-border bg-surface-muted p-5 text-sm text-foreground-muted sm:p-6"
      >
        <p className="font-semibold text-foreground">Interested in this product?</p>
        <p className="mt-1">
          Select &quot;Apply / express interest&quot; above to submit an inquiry. A dedicated BPI relationship officer will review your account eligibility and guide you through the enrollment process.
        </p>
        <span className="sr-only">Simulation only</span>
      </section>

      <InterestConfirmation
        item={product}
        loading={isConfirming}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmAction}
        open={isConfirmationOpen}
        type="product"
      />
    </div>
  );
}

ProductDetailPage.displayName = 'ProductDetailPage';

ProductDetailPage.propTypes = {
  className: () => null,
  onAction: () => null,
  onApply: () => null,
  product: () => null,
};

export {
  formatRate,
  formatTermValue,
  getMaximumAmount,
  getMinimumAmount,
  getProductTerms,
};

export default ProductDetailPage;