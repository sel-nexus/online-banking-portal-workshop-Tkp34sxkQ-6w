import React from 'react';
import {
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { SIMULATION_MESSAGES } from '../config/messages';
import { useAccess } from '../contexts/AccessContext';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import ProtectedRoute, { isSessionValid } from './ProtectedRoute';
import AppShell from '../components/shell/AppShell';
import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import AccountsPage from '../pages/AccountsPage';
import AccountDetailPage from '../pages/AccountDetailPage';
import TransactionPage from '../pages/TransactionPage';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import OffersPage from '../pages/OffersPage';
import OfferDetailPage from '../pages/OfferDetailPage';
import SupportPage from '../pages/SupportPage';
import ContactPage from '../pages/ContactPage';
import NotFoundPage from '../pages/NotFoundPage';
import { getTransaction } from '../services/TransactionService';
import { formatDate, formatStatus } from '../utils/formatters';

const SUPPORT_ROUTES = Object.freeze({
  SUPPORT: '/support',
  CONTACT: '/contact',
  PRODUCTS: '/products/:productId',
  OFFERS: '/offers/:offerId',
});

function PageMessage({ title, description, children }) {
  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl">{title}</h1>
        {description ? (
          <p className="mt-2 text-foreground-muted">{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function PublicLoginRoute() {
  const access = useAccess();

  if (isSessionValid(access.session, access)) {
    return <Navigate replace to="/home" />;
  }

  return <LoginPage />;
}

function TransactionDetailPage() {
  const { transactionId } = useParams();
  const { profile, state } = useCustomerProfile();
  const transaction = getTransaction(transactionId, {
    profileId: profile?.id,
    state,
  });

  if (!transaction) {
    return (
      <PageMessage
        title="Transaction not found"
        description="This transaction is not available for the current profile."
      />
    );
  }

  return (
    <PageMessage
      title={transaction.description}
      description={formatDate(transaction.date)}
    >
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-foreground-muted">Amount</dt>
          <dd className="font-semibold">{transaction.displayAmount}</dd>
        </div>
        <div>
          <dt className="text-sm text-foreground-muted">Status</dt>
          <dd className="font-semibold">{formatStatus(transaction.status)}</dd>
        </div>
        <div>
          <dt className="text-sm text-foreground-muted">Type</dt>
          <dd className="font-semibold">{formatStatus(transaction.type)}</dd>
        </div>
        <div>
          <dt className="text-sm text-foreground-muted">Reference</dt>
          <dd className="font-semibold">
            {transaction.reference || 'Synthetic transaction'}
          </dd>
        </div>
      </dl>
    </PageMessage>
  );
}

function SimpleProtectedPage({ title }) {
  return (
    <PageMessage
      title={title}
      description="This feature is available in the secure demonstration environment."
    >
      <p className="mt-5 text-sm text-foreground-muted">
        {SIMULATION_MESSAGES.noRealTransactions}
      </p>
    </PageMessage>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<PublicLoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate replace to="/home" />} />
        <Route path="/home" element={<HomePage />} />
        <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
        <Route
          path={`${ROUTES.ACCOUNTS}/:accountId`}
          element={<AccountDetailPage />}
        />
        <Route path="/transactions" element={<TransactionPage />} />
        <Route
          path="/transactions/:transactionId"
          element={<TransactionDetailPage />}
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/:offerId" element={<OfferDetailPage />} />
        <Route path={SUPPORT_ROUTES.SUPPORT} element={<SupportPage />} />
        <Route path={SUPPORT_ROUTES.CONTACT} element={<ContactPage />} />
        <Route
          path={ROUTES.TRANSFERS}
          element={<SimpleProtectedPage title="Transfers" />}
        />
        <Route
          path={ROUTES.PAYMENTS}
          element={<SimpleProtectedPage title="Payments" />}
        />
        <Route
          path={ROUTES.PROFILE}
          element={<SimpleProtectedPage title="Profile" />}
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

PageMessage.propTypes = {
  title: () => null,
  description: () => null,
  children: () => null,
};

SimpleProtectedPage.propTypes = {
  title: () => null,
};

const DashboardPage = HomePage;

export {
  AppRoutes,
  ContactPage,
  DashboardPage,
  LoginPage,
  NotFoundPage,
  SUPPORT_ROUTES,
  SupportPage,
};

export default AppRoutes;
