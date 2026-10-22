import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { SIMULATION_MESSAGES } from '../config/messages';

const CONTENT_DEFINITIONS = Object.freeze({
  account: Object.freeze({
    title: 'Account unavailable',
    description:
      'This account could not be found or is not available for the current profile.',
    actionLabel: 'Return to accounts',
    actionTo: ROUTES.ACCOUNTS,
  }),
  offer: Object.freeze({
    title: 'Offer unavailable',
    description:
      'This offer could not be found, may have expired, or is not available for the current profile.',
    actionLabel: 'Return to offers',
    actionTo: '/offers',
  }),
  default: Object.freeze({
    title: 'Page not found',
    description:
      'The page you requested could not be found. Check the address or return to the dashboard.',
    actionLabel: 'Return to dashboard',
    actionTo: ROUTES.DASHBOARD,
  }),
});

function normalizeContext(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase();

  if (
    normalizedValue === 'account' ||
    normalizedValue === 'accounts' ||
    normalizedValue === 'account-unavailable'
  ) {
    return 'account';
  }

  if (
    normalizedValue === 'offer' ||
    normalizedValue === 'offers' ||
    normalizedValue === 'offer-unavailable' ||
    normalizedValue === 'expired-offer'
  ) {
    return 'offer';
  }

  return 'default';
}

function getContextFromPath(pathname) {
  const normalizedPath = String(pathname ?? '')
    .trim()
    .toLowerCase();

  if (normalizedPath === ROUTES.ACCOUNTS.toLowerCase() ||
      normalizedPath.startsWith(`${ROUTES.ACCOUNTS.toLowerCase()}/`)) {
    return 'account';
  }

  if (
    normalizedPath === '/offers' ||
    normalizedPath.startsWith('/offers/')
  ) {
    return 'offer';
  }

  return 'default';
}

function getNotFoundContent(context, overrides = {}) {
  const normalizedContext = normalizeContext(context);
  const definition = CONTENT_DEFINITIONS[normalizedContext];

  return {
    context: normalizedContext,
    title: overrides.title || definition.title,
    description: overrides.description || definition.description,
    actionLabel: overrides.actionLabel || definition.actionLabel,
    actionTo: overrides.actionTo || definition.actionTo,
  };
}

/**
 * Renders a safe, accessible page for unknown or unavailable routes.
 *
 * Account and offer paths receive contextual, user-safe messaging without
 * exposing internal identifiers or implementation details.
 *
 * @param {object} props Component properties.
 * @param {'default'|'account'|'offer'} props.context Optional message context.
 * @param {'default'|'account'|'offer'} props.variant Alias for context.
 * @param {string} props.title Optional heading override.
 * @param {string} props.description Optional description override.
 * @param {string} props.actionLabel Return-link label.
 * @param {string} props.actionTo Return-link destination.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Accessible not-found page.
 */
function NotFoundPage({
  actionLabel,
  actionTo,
  className = '',
  context,
  description,
  title,
  variant,
}) {
  const location = useLocation();
  const resolvedContext =
    context || variant || getContextFromPath(location.pathname);
  const content = getNotFoundContent(resolvedContext, {
    actionLabel,
    actionTo,
    description,
    title,
  });

  return (
    <main
      aria-labelledby="not-found-page-title"
      className={`mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section className="w-full rounded-xl border border-border bg-surface p-6 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {SIMULATION_MESSAGES.sampleData}
        </p>

        <h1
          className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl"
          id="not-found-page-title"
        >
          {content.title}
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground-muted">
          {content.description}
        </p>

        <Link
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          to={content.actionTo}
        >
          {content.actionLabel}
        </Link>

        <p className="mt-6 text-xs text-foreground-subtle">
          {SIMULATION_MESSAGES.simulationOnly}. No real banking activity or
          account changes are performed.
        </p>
      </section>
    </main>
  );
}

NotFoundPage.displayName = 'NotFoundPage';

NotFoundPage.propTypes = {
  actionLabel: () => null,
  actionTo: () => null,
  className: () => null,
  context: () => null,
  description: () => null,
  title: () => null,
  variant: () => null,
};

export {
  CONTENT_DEFINITIONS,
  getContextFromPath,
  getNotFoundContent,
  normalizeContext,
};

export default NotFoundPage;