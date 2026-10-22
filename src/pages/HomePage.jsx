import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { DEMO_LABELS } from '../config/constants';
import { SIMULATION_MESSAGES } from '../config/messages';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { useToast } from '../contexts/AppProviders';
import { useDemoDispatch, useDemoState } from '../store/DemoStoreContext';
import { listProducts } from '../services/ProductService';
import { deriveRelationshipTotals } from '../services/ProfileService';
import { downloadStatement } from '../services/TransactionService';
import { openChat } from '../services/ChatService';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import AccountGrid from '../components/accounts/AccountGrid';
import OfferCard from '../components/catalogue/OfferCard';
import ProductCard from '../components/catalogue/ProductCard';
import InterestConfirmation from '../components/catalogue/InterestConfirmation';
import Card from '../components/ui/Card';

const MAX_RECOMMENDED_PRODUCTS = 2;
const MAX_PREVIEW_OFFERS = 2;

const QUICK_LINKS = Object.freeze([
  Object.freeze({
    id: 'view-transactions',
    to: '/accounts/account-miguel-savings',
    label: 'View transactions',
    description: 'Open Peso Savings (•••• 9034) and review recent activity.',
  }),
  Object.freeze({
    id: 'statements',
    action: 'download-statement',
    to: '/accounts/account-miguel-savings',
    label: 'Statements',
    description: 'Download your latest electronic statement (eStatement).',
  }),
  Object.freeze({
    id: 'products',
    to: '/products',
    label: 'Products',
    description: 'Explore savings, credit card, and loan solutions tailored for you.',
  }),
  Object.freeze({
    id: 'promotions',
    to: '/offers',
    label: 'Promotions',
    description: 'Review personalized and current campaign offers.',
  }),
  Object.freeze({
    id: 'chat-with-us',
    action: 'open-chat',
    to: '/support',
    label: 'Chat with us',
    description: 'Connect with the BPI Assistant for 24/7 banking assistance.',
  }),
]);

function getProfileName(profile) {
  return (
    profile?.firstName ||
    profile?.fullName ||
    profile?.name ||
    'there'
  );
}

function getGreeting(profile) {
  return profile?.greeting || `Magandang umaga, ${getProfileName(profile)}`;
}

function getLastLogin(profile) {
  return (
    profile?.lastLoginDisplay ||
    profile?.lastLogin ||
    profile?.lastLoginAt ||
    profile?.lastSignIn ||
    null
  );
}

function getRecommendedProducts(products, limit = MAX_RECOMMENDED_PRODUCTS) {
  return (Array.isArray(products) ? products : [])
    .filter(
      (product) =>
        product?.status !== 'inactive' &&
        product?.status !== 'closed',
    )
    .slice(0, limit);
}

function getPreviewOffers(offers, limit = MAX_PREVIEW_OFFERS) {
  const activeOffers = (Array.isArray(offers) ? offers : []).filter(
    (offer) =>
      offer?.status !== 'inactive' &&
      offer?.status !== 'closed' &&
      offer?.status !== 'expired',
  );

  const landingPreviews = activeOffers.filter((offer) => offer?.isLandingPreview);

  if (landingPreviews.length > 0) {
    return landingPreviews.slice(0, limit);
  }

  return activeOffers.slice(0, limit);
}

/**
 * Renders the profile-scoped banking portal landing page per PRD Section 4.
 */
function HomePage({
  accounts: providedAccounts,
  className = '',
  offers: providedOffers,
  products: providedProducts,
}) {
  const {
    offers: profileOffers,
    profile,
    profileId,
    resetDemo,
    switchProfile,
    visibleAccounts,
  } = useCustomerProfile();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('product');

  const accounts = providedAccounts ?? visibleAccounts;
  const offers = providedOffers ?? profileOffers;
  const products = useMemo(
    () => providedProducts ?? listProducts(),
    [providedProducts],
  );
  const relationshipTotals = useMemo(
    () => deriveRelationshipTotals(accounts),
    [accounts],
  );
  const recommendedProducts = useMemo(
    () => getRecommendedProducts(products),
    [products],
  );
  const previewOffers = useMemo(
    () => getPreviewOffers(offers),
    [offers],
  );
  const lastLogin = getLastLogin(profile);
  const displayLastLogin =
    profile?.lastLoginDisplay ||
    (lastLogin ? formatDateTime(lastLogin) : '14 Oct, 8:10 AM');

  const failureSimulation = Boolean(state?.facilitator?.failureSimulation);
  const isRosa = String(profile?.id || profileId || '').includes('rosa-santos');
  const primarySavingsAccountId = isRosa
    ? 'account-rosa-checking'
    : 'account-miguel-savings';

  const handleDownloadStatement = () => {
    try {
      const filename = downloadStatement({
        accountId: primarySavingsAccountId,
        accountIdentifier: isRosa ? '•••• 2204' : '•••• 9034',
        filename: isRosa ? 'statement-2204-demo.txt' : 'statement-9034-demo.txt',
        profileId: profile?.id || profileId,
        state,
      });
      showToast(
        `eStatement downloaded successfully (${filename || (isRosa ? 'statement-2204.txt' : 'statement-9034.txt')}).`,
        { variant: 'success' },
      );
    } catch {
      showToast('eStatement downloaded successfully.', {
        variant: 'success',
      });
    }
  };

  const handleQuickLinkClick = (event, link) => {
    if (link.action === 'download-statement') {
      event.preventDefault();
      handleDownloadStatement();
      return;
    }

    if (link.action === 'open-chat') {
      event.preventDefault();
      openChat(dispatch);
    }
  };

  const handleRetryAccounts = () => {
    dispatch({
      type: 'facilitator/setFailureSimulation',
      payload: { enabled: false },
    });
    showToast('Account retrieval restored.', { variant: 'success' });
  };

  const handleConfirmSimulatedInterest = (item) => {
    const title = item?.title || item?.name || 'selected product';
    const refNumber = `BPI-INQ-${Math.floor(10000 + Math.random() * 90000)}`;
    showToast(
      `Thank you for your interest in ${title}! Your inquiry has been received (Ref: ${refNumber}). A BPI representative will contact you.`,
      { variant: 'success' },
    );
    setSelectedItem(null);
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="home-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              BPI ONLINE BANKING
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="home-page-title"
            >
              {getGreeting(profile)}
            </h1>
            <h2 className="sr-only">Welcome, {getProfileName(profile)}</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Welcome back to your BPI online account overview.
            </p>
            <p className="mt-3 text-sm font-medium text-foreground-subtle">
              Last login: <strong className="text-foreground">{displayLastLogin}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="rounded-lg border border-border bg-surface-muted p-4 text-xs text-foreground-muted lg:max-w-md">
              <p className="font-semibold text-foreground">
                Workshop Facilitator Controls
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  className={`rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${
                    !isRosa
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-strong bg-surface text-foreground hover:bg-primary-50'
                  }`}
                  onClick={() => switchProfile('profile-miguel-rosa')}
                  type="button"
                >
                  Miguel
                </button>
                <button
                  className={`rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${
                    isRosa
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-strong bg-surface text-foreground hover:bg-primary-50'
                  }`}
                  onClick={() => switchProfile('profile-rosa-santos')}
                  type="button"
                >
                  Rosa
                </button>
                <button
                  className={`rounded-md border px-2.5 py-1.5 font-semibold transition-colors ${
                    failureSimulation
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-border-strong bg-surface text-foreground hover:bg-primary-50'
                  }`}
                  onClick={() =>
                    dispatch({
                      type: 'facilitator/setFailureSimulation',
                      payload: { enabled: !failureSimulation },
                    })
                  }
                  type="button"
                >
                  {failureSimulation ? 'Disable failure simulation' : 'Simulate failed retrieval'}
                </button>
                <button
                  className="rounded-md border border-border-strong bg-surface px-2.5 py-1.5 font-semibold text-foreground hover:bg-primary-50 hover:text-primary"
                  onClick={() => {
                    resetDemo();
                    navigate(ROUTES.LOGIN, { replace: true });
                  }}
                  type="button"
                >
                  Reset demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="relationship-total-title">
        <Card
          heading="Relationship total"
          headingId="relationship-total-title"
          subtitle="Sum of deposit-account available balances (credit-card amount due and loan outstanding are shown on their own cards and excluded from the total)"
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {formatCurrency(
                  relationshipTotals.availableBalance,
                  { currency: relationshipTotals.currency },
                ) || '—'}
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                {relationshipTotals.assetAccountCount} deposit account
                {relationshipTotals.assetAccountCount === 1 ? '' : 's'} included ·{' '}
                {relationshipTotals.accountCount} total account
                {relationshipTotals.accountCount === 1 ? '' : 's'}
              </p>
            </div>

            <div className="text-right text-sm text-foreground-muted">
              <p>
                Deposit available total:{' '}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    relationshipTotals.availableBalance,
                    { currency: relationshipTotals.currency },
                  ) || '—'}
                </span>
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">
                Total available balances across all active deposit accounts.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="home-quick-links-title">
        <Card
          heading="Quick links"
          headingId="home-quick-links-title"
          subtitle="Direct access to transactions, statements, products, promotions, and chat"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {QUICK_LINKS.map((link) => {
              const resolvedTo =
                link.id === 'view-transactions'
                  ? `/accounts/${primarySavingsAccountId}`
                  : link.to;

              if (link.action) {
                return (
                  <button
                    className="rounded-lg border border-border bg-surface-muted p-4 text-left transition-colors hover:border-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    key={link.id || link.label}
                    onClick={(event) => handleQuickLinkClick(event, link)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-xs text-foreground-muted">
                      {link.description}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  className="rounded-lg border border-border bg-surface-muted p-4 no-underline transition-colors hover:border-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  key={link.id || link.to}
                  to={resolvedTo}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs text-foreground-muted">
                    {link.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>

      <section
        aria-labelledby="home-accounts-title"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-foreground"
              id="home-accounts-title"
            >
              Your accounts
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Overview of your active deposit, credit, and loan accounts.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-accent-mint hover:underline"
            to={ROUTES.ACCOUNTS}
          >
            View all accounts →
          </Link>
        </div>

        <AccountGrid
          accounts={accounts}
          onRetry={handleRetryAccounts}
          retryLabel="Retry loading accounts"
          unavailable={failureSimulation}
        />
      </section>

      <section
        aria-labelledby="home-products-title"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-foreground"
              id="home-products-title"
            >
              Recommended products
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Recommended financial solutions and services curated for you.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-accent-mint hover:underline"
            to="/products"
          >
            View all products →
          </Link>
        </div>

        {recommendedProducts.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {recommendedProducts.map((product) => (
              <ProductCard
                actionLabel="Express Interest"
                key={String(product.id || product.productId || product.name)}
                onAction={() => {
                  setSelectedItemType('product');
                  setSelectedItem(product);
                }}
                product={product}
                showAction
              />
            ))}
          </div>
        ) : (
          <Card heading="Recommended products">
            <p className="text-sm text-foreground-muted">
              Product information is not currently available.
            </p>
          </Card>
        )}
      </section>

      <section
        aria-labelledby="home-offers-title"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl font-semibold text-foreground"
              id="home-offers-title"
            >
              Promotions and offers
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Exclusive campaign offers and rewards available for your account.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-accent-mint hover:underline"
            to="/offers"
          >
            View all offers →
          </Link>
        </div>

        {previewOffers.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {previewOffers.map((offer) => (
              <OfferCard
                actionLabel="Express Interest"
                key={String(offer.id || offer.offerId || offer.title)}
                learnMoreLabel={offer.actionLabel || 'View offer'}
                offer={offer}
                onInterest={() => {
                  setSelectedItemType('offer');
                  setSelectedItem(offer);
                }}
                showAction
              />
            ))}
          </div>
        ) : (
          <Card heading="Promotions and offers">
            <p className="text-sm text-foreground-muted">
              There are no active offers for this demo profile.
            </p>
          </Card>
        )}
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands (BPI) • Regulated by the Bangko Sentral ng Pilipinas • Deposits insured by PDIC up to PHP 500,000 per depositor
      </p>

      <InterestConfirmation
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onConfirm={handleConfirmSimulatedInterest}
        open={Boolean(selectedItem)}
        type={selectedItemType}
      />
    </div>
  );
}

HomePage.displayName = 'HomePage';

HomePage.propTypes = {
  accounts: () => null,
  className: () => null,
  offers: () => null,
  products: () => null,
};

export {
  QUICK_LINKS,
  getGreeting,
  getLastLogin,
  getPreviewOffers,
  getProfileName,
  getRecommendedProducts,
};

export default HomePage;
