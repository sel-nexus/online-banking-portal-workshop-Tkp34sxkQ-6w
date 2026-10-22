import React, {
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import {
  SIMULATION_MESSAGES,
  SUPPORT_MESSAGES,
} from '../config/messages';
import { SUPPORT } from '../fixtures/support';
import { openChat } from '../services/ChatService';
import { useDemoDispatch } from '../store/DemoStoreContext';

const childrenPropType = () => null;

const DEFAULT_SUPPORT = SUPPORT;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function getFaqIdentifier(faq, index) {
  return String(
    faq?.id ||
      faq?.faqId ||
      `faq-${index}`,
  );
}

function getFaqTitle(faq) {
  return (
    faq?.title ||
    faq?.question ||
    'Frequently asked question'
  );
}

function getFaqAnswer(faq) {
  return (
    faq?.answer ||
    faq?.description ||
    faq?.content ||
    'Answer information is not currently available.'
  );
}

function getChannelIdentifier(channel, index) {
  return String(
    channel?.id ||
      channel?.channelId ||
      `support-channel-${index}`,
  );
}

function getLocationIdentifier(location, index) {
  return String(
    location?.id ||
      location?.locationId ||
      `support-location-${index}`,
  );
}

function filterFaqs(faqs, search) {
  const normalizedSearch = normalizeText(search).toLowerCase();

  if (!normalizedSearch) {
    return Array.isArray(faqs) ? faqs : [];
  }

  return (Array.isArray(faqs) ? faqs : []).filter((faq) =>
    [
      getFaqTitle(faq),
      getFaqAnswer(faq),
      faq?.category,
    ]
      .map(normalizeText)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch),
  );
}

/**
 * Renders the Help and Support page with synthetic support content.
 *
 * All support content is local fixture data. Contact and chat controls are
 * demonstration-only and do not send messages or make external requests.
 *
 * @param {object} props Component properties.
 * @param {object} props.support Optional support-content override.
 * @param {Function} props.onChatOpen Callback invoked when chat is selected.
 * @param {Function} props.onContact Callback invoked when contact is selected.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Help and Support page.
 */
function SupportPage({
  className = '',
  onChatOpen,
  onContact,
  support: providedSupport,
}) {
  const support = providedSupport || DEFAULT_SUPPORT;
  const dispatch = useDemoDispatch();
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState('faq-login-assistance');

  const handleStartChat = (event) => {
    openChat(dispatch);
    onChatOpen?.(event);
  };

  const faqs = useMemo(
    () => filterFaqs(support.faqs, search),
    [search, support.faqs],
  );
  const channels = Array.isArray(support.channels) ? support.channels : [];
  const locations = Array.isArray(support.locations)
    ? support.locations
    : [];
  const hours = support.hours || {};
  const secureMessage = support.secureMessage || {};

  const handleFaqToggle = (faqId) => {
    setOpenFaqId((currentId) => (
      currentId === faqId ? null : faqId
    ));
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="support-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {support.title || SUPPORT_MESSAGES.title} • 24/7 Customer Care
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="support-page-title"
            >
              {support.heading || 'How can we help today?'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Connect with our 24/7 BPI Digital Assistant or explore frequently asked questions below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={handleStartChat}
              type="button"
            >
              Chat with us
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={(event) => onContact?.(event)}
              to="/contact"
            >
              Contact us
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          <p className="font-semibold">
            {support.lostCard?.title || 'Lost or stolen card'}: (+63 2) 889-10000 / Domestic Toll-Free 1-800-188-89100
          </p>
          <p className="mt-1">
            {support.lostCard?.securityNotice || 'Never share your password, PIN, or government identification numbers.'}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="support-faq-title"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          <div className="border-b border-border p-5 sm:p-6">
            <h2
              className="text-xl font-semibold text-foreground"
              id="support-faq-title"
            >
              Frequently asked questions
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Find quick answers to common online-banking questions.
            </p>

            <div className="mt-4">
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor="support-faq-search"
              >
                Search FAQs
              </label>
              <input
                aria-label="Search FAQs"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                id="support-faq-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions and answers"
                type="search"
                value={search}
              />
            </div>
          </div>

          {faqs.length ? (
            <div className="divide-y divide-border">
              {faqs.map((faq, index) => {
                const faqId = getFaqIdentifier(faq, index);
                const isOpen = openFaqId === faqId;
                const answerId = `${faqId}-answer`;

                return (
                  <div key={faqId}>
                    <h3>
                      <button
                        aria-controls={answerId}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 sm:px-6"
                        onClick={() => handleFaqToggle(faqId)}
                        type="button"
                      >
                        <span>{getFaqTitle(faq)}</span>
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-lg text-foreground-muted"
                        >
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                    </h3>

                    {isOpen ? (
                      <div
                        className="px-5 pb-5 text-sm leading-6 text-foreground-muted sm:px-6"
                        id={answerId}
                      >
                        {getFaqAnswer(faq)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-5 text-sm text-foreground-muted sm:p-6">
              No FAQs match your search. Try a different term.
            </p>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Need more help?
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Our dedicated customer care channels are here to assist with your BPI accounts, cards, and online banking.
            </p>
            <div className="mt-4 space-y-2">
              <button
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={handleStartChat}
                type="button"
              >
                Chat with us — Connect with BPI Assistant
              </button>
              <Link
                className="block w-full rounded-md border border-border-strong px-4 py-2 text-center text-sm font-semibold text-foreground no-underline hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={(event) => onContact?.(event)}
                to="/contact"
              >
                Send a secure message
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-700">
            <p className="font-semibold">Protect your information</p>
            <p className="mt-1">
              {SUPPORT_MESSAGES.secureSupportNotice}
            </p>
          </div>
        </aside>
      </section>

      <section aria-labelledby="support-channels-title">
        <div className="mb-4">
          <h2
            className="text-xl font-semibold text-foreground"
            id="support-channels-title"
          >
            Support channels
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Choose the support channel that works best for you.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel, index) => (
            <article
              className="rounded-xl border border-border bg-surface p-5 shadow-sm"
              key={getChannelIdentifier(channel, index)}
            >
              <h3 className="font-semibold text-foreground">
                {channel.title || channel.name || 'Support channel'}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                {channel.description || 'Support information is available.'}
              </p>

              {channel.phone ? (
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {channel.phone}
                </p>
              ) : null}

              {channel.email ? (
                <p className="mt-4 break-words text-sm font-semibold text-foreground">
                  {channel.email}
                </p>
              ) : null}

              {channel.hours ? (
                <p className="mt-2 text-xs text-foreground-subtle">
                  {channel.hours}
                </p>
              ) : null}

              {channel.type === 'chat' ? (
                <button
                  className="mt-4 inline-flex text-sm font-semibold text-accent-mint hover:underline"
                  onClick={handleStartChat}
                  type="button"
                >
                  Open chat →
                </button>
              ) : channel.url ? (
                <Link
                  className="mt-4 inline-flex text-sm font-semibold text-accent-mint hover:underline"
                  onClick={(event) => onContact?.(event, channel)}
                  to={channel.url}
                >
                  Open secure message →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="support-hours-title"
        className="grid gap-5 lg:grid-cols-2"
      >
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2
            className="text-xl font-semibold text-foreground"
            id="support-hours-title"
          >
            Support hours
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {hours.description || SUPPORT_MESSAGES.supportHours}
          </p>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground-muted">Weekdays</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {hours.weekdays || 'Monday to Friday'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Hours</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {hours.weekdayHours || '8:00 AM to 5:00 PM'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Saturday</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {hours.saturdayHours || 'Closed'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Sunday</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {hours.sundayHours || 'Closed'}
              </dd>
            </div>
          </dl>

          {hours.timezoneLabel ? (
            <p className="mt-5 border-t border-border pt-4 text-xs text-foreground-subtle">
              Time zone: {hours.timezoneLabel}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Secure messages
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {secureMessage.description ||
              'Send a secure inquiry to our customer support team.'}
          </p>
          <p className="mt-4 text-sm text-foreground-muted">
            Response time:{' '}
            <strong className="text-foreground">
              {secureMessage.responseTime || 'Within one business day'}
            </strong>
          </p>
          <Link
            className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            onClick={(event) => onContact?.(event)}
            to="/contact"
          >
            Contact us
          </Link>
        </div>
      </section>

      {locations.length ? (
        <section aria-labelledby="support-locations-title">
          <div className="mb-4">
            <h2
              className="text-xl font-semibold text-foreground"
              id="support-locations-title"
            >
              Branches and ATMs
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Visit our branches, Express Banking Centers, and ATMs nationwide.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <article
                className="rounded-xl border border-border bg-surface p-5 shadow-sm"
                key={getLocationIdentifier(location, index)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">
                    {location.name || 'Support location'}
                  </h3>
                  {location.status ? (
                    <span className="shrink-0 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
                      {location.status}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-foreground-muted">
                  {location.address || 'Address information unavailable.'}
                </p>

                {location.branchHours ? (
                  <p className="mt-4 text-sm text-foreground-muted">
                    Branch: {location.branchHours}
                  </p>
                ) : null}

                {location.atmHours ? (
                  <p className="mt-1 text-sm text-foreground-muted">
                    ATM: {location.atmHours}
                  </p>
                ) : null}

                {Array.isArray(location.services) &&
                location.services.length ? (
                  <ul className="mt-4 space-y-1 text-xs text-foreground-subtle">
                    {location.services.map((service) => (
                      <li key={service}>• {service}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-label="Security and Privacy reminder"
        className="rounded-xl border border-border bg-surface-muted p-5 text-sm text-foreground-muted sm:p-6"
      >
        <p className="font-semibold text-foreground">Security Reminder</p>
        <p className="mt-1">
          BPI will never ask for your password, One-Time PIN (OTP), CVV, or ATM PIN through email, SMS, phone call, or chat. Always access your account only through the official BPI portal.
        </p>
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph). Deposits are insured by PDIC up to PHP 500,000 per depositor.
      </p>
    </div>
  );
}

SupportPage.displayName = 'SupportPage';

SupportPage.propTypes = {
  className: () => null,
  onChatOpen: () => null,
  onContact: () => null,
  support: childrenPropType,
};

export {
  filterFaqs,
  getChannelIdentifier,
  getFaqAnswer,
  getFaqIdentifier,
  getFaqTitle,
  getLocationIdentifier,
  normalizeText,
};

export default SupportPage;