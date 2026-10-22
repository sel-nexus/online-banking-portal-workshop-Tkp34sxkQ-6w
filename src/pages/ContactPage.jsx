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
import {
  submitSecureMessage,
  validateSecureMessage,
} from '../services/SupportService';
import { openChat } from '../services/ChatService';
import { useDemoDispatch } from '../store/DemoStoreContext';
import Alert from '../components/feedback/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const childrenPropType = () => null;

const DEFAULT_SUPPORT = SUPPORT;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function getChannelIdentifier(channel, index) {
  return String(
    channel?.id ||
      channel?.channelId ||
      `support-channel-${index}`,
  );
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

function getSecureMessageCategories(support) {
  const fields = support?.secureMessage?.fields;

  if (!Array.isArray(fields)) {
    return [];
  }

  const categoryField = fields.find(
    (field) => field?.name === 'category',
  );

  return Array.isArray(categoryField?.options)
    ? categoryField.options
        .map(normalizeText)
        .filter(Boolean)
    : [];
}

function getFieldErrors(errors) {
  return (Array.isArray(errors) ? errors : []).reduce(
    (result, error) => {
      if (error?.field && !result[error.field]) {
        result[error.field] = error.message;
      }

      return result;
    },
    {},
  );
}

function createInitialForm(categories) {
  return {
    category: categories[0] || '',
    message: '',
    subject: '',
  };
}

/**
 * Renders the simulated contact page with static support channels, FAQ
 * access, and a locally validated secure-message form.
 *
 * Secure-message submissions produce a simulated receipt only. No support
 * case is opened, no message is sent externally, and submitted message
 * contents are not included in the receipt.
 *
 * @param {object} props Component properties.
 * @param {object} props.support Optional support-content override.
 * @param {Function} props.onSubmit Callback invoked with the simulated receipt.
 * @param {Function} props.onContact Alias for onSubmit.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Contact page.
 */
function ContactPage({
  className = '',
  onContact,
  onSubmit,
  support: providedSupport,
}) {
  const support = providedSupport || DEFAULT_SUPPORT;
  const dispatch = useDemoDispatch();
  const categories = useMemo(
    () => getSecureMessageCategories(support),
    [support],
  );
  const [form, setForm] = useState(() => createInitialForm(categories));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channels = Array.isArray(support.channels)
    ? support.channels
    : [];
  const faqs = Array.isArray(support.faqs)
    ? support.faqs
    : [];
  const secureMessage = support.secureMessage || {};

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: '',
    }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setReceipt(null);
    setSubmitError('');

    const normalizedForm = {
      ...form,
      subject: normalizeText(form.subject) || `${form.category || 'Support'} enquiry`,
    };
    const validation = validateSecureMessage(normalizedForm, { support });

    if (!validation.valid) {
      setFieldErrors(getFieldErrors(validation.errors));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await submitSecureMessage(normalizedForm, { support });

      setReceipt(result);
      setForm(createInitialForm(categories));
      onSubmit?.(result);
      onContact?.(result);
    } catch (error) {
      if (Array.isArray(error?.errors)) {
        setFieldErrors(getFieldErrors(error.errors));
      }

      setSubmitError(
        error?.message ||
          'The secure message could not be submitted. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="contact-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              BPI Customer Care
            </p>
            <h1
              className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
              id="contact-page-title"
            >
              Contact us
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
              Contact our dedicated customer support team, browse frequently asked questions, or send a secure online inquiry.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={() => openChat(dispatch)}
              type="button"
            >
              Chat with us
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              to="/support"
            >
              View Help &amp; Support
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

      <section aria-labelledby="contact-channels-title">
        <div className="mb-4">
          <h2
            className="text-xl font-semibold text-foreground"
            id="contact-channels-title"
          >
            Contact channels
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Choose your preferred customer support channel.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel, index) => {
            const channelId = getChannelIdentifier(channel, index);
            const channelTitle =
              channel?.title || channel?.name || 'Support channel';

            return (
              <Card
                heading={channelTitle}
                key={channelId}
                subtitle={
                  channel?.availability === 'always'
                    ? 'Available anytime'
                    : channel?.hours || 'Availability information'
                }
              >
                <p className="text-sm text-foreground-muted">
                  {channel?.description ||
                    'Official BPI customer service channel.'}
                </p>

                {channel?.phone ? (
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {channel.phone}
                  </p>
                ) : null}

                {channel?.email ? (
                  <p className="mt-4 break-words text-sm font-semibold text-foreground">
                    {channel.email}
                  </p>
                ) : null}

                {channel?.url ? (
                  <a
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    href={channel.url}
                  >
                    Open channel
                  </a>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="contact-faq-title"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card
          heading="Frequently asked questions"
          headingId="contact-faq-title"
          subtitle="Find quick answers before contacting support."
        >
          {faqs.length ? (
            <ul className="divide-y divide-border">
              {faqs.slice(0, 5).map((faq, index) => (
                <li
                  className="py-3 first:pt-0 last:pb-0"
                  key={getFaqIdentifier(faq, index)}
                >
                  <Link
                    className="font-medium text-foreground no-underline hover:text-primary hover:underline"
                    to="/support"
                  >
                    {getFaqTitle(faq)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">
              FAQ information is not currently available.
            </p>
          )}

          <Link
            className="mt-5 inline-flex text-sm font-semibold text-primary hover:text-primary-700 hover:underline"
            to="/support"
          >
            Browse all FAQs
          </Link>
        </Card>

        <Card heading="Support hours">
          <p className="text-sm text-foreground-muted">
            {support?.hours?.description ||
              SUPPORT_MESSAGES.supportHours}
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-foreground-muted">Weekdays</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {support?.hours?.weekdays || 'Monday to Friday'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Hours</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {support?.hours?.weekdayHours || '8:00 AM to 5:00 PM'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Saturday</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {support?.hours?.saturdayHours || '08:00–12:00'}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Sunday</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {support?.hours?.sundayHours || 'Closed'}
              </dd>
            </div>
          </dl>
        </Card>
      </section>

      <section
        aria-labelledby="secure-message-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="max-w-3xl">
          <h2
            className="text-xl font-semibold text-foreground"
            id="secure-message-title"
          >
            Send a secure message
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {secureMessage.description ||
              'Send an inquiry or request directly to our customer support team.'}
          </p>
        </div>

        {receipt ? (
          <Alert
            className="mt-6"
            description="Your message has been received. A BPI customer care representative will review your inquiry and follow up within one business day."
            message={`Reference Number: ${receipt.referenceId}`}
            role="status"
            title="Message sent successfully"
            variant="success"
          />
        ) : null}

        {submitError ? (
          <Alert
            className="mt-6"
            message={submitError}
            role="alert"
            title="Message could not be prepared"
            variant="error"
          />
        ) : null}

        <form
          className="mt-6 max-w-3xl space-y-5"
          noValidate
          onSubmit={handleSubmit}
        >
          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="contact-subject"
            >
              Subject
            </label>
            <input
              aria-describedby={
                fieldErrors.subject ? 'contact-subject-error' : undefined
              }
              aria-invalid={fieldErrors.subject ? 'true' : undefined}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id="contact-subject"
              onChange={(event) =>
                updateField('subject', event.target.value)
              }
              placeholder="What can we help with?"
              type="text"
              value={form.subject}
            />
            {fieldErrors.subject ? (
              <p
                className="mt-1 text-sm text-danger-700"
                id="contact-subject-error"
                role="alert"
              >
                {fieldErrors.subject}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="contact-category"
            >
              Topic
            </label>
            <select
              aria-describedby={
                fieldErrors.category ? 'contact-category-error' : undefined
              }
              aria-invalid={fieldErrors.category ? 'true' : undefined}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id="contact-category"
              onChange={(event) =>
                updateField('category', event.target.value)
              }
              value={form.category}
            >
              <option value="">Select a topic</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {fieldErrors.category ? (
              <p
                className="mt-1 text-sm text-danger-700"
                id="contact-category-error"
                role="alert"
              >
                {fieldErrors.category}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="contact-message"
            >
              Message
            </label>
            <textarea
              aria-describedby={
                fieldErrors.message ? 'contact-message-error' : undefined
              }
              aria-invalid={fieldErrors.message ? 'true' : undefined}
              className="mt-1 min-h-32 w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id="contact-message"
              onChange={(event) =>
                updateField('message', event.target.value)
              }
              placeholder="Tell us how we can help."
              rows="5"
              value={form.message}
            />
            {fieldErrors.message ? (
              <p
                className="mt-1 text-sm text-danger-700"
                id="contact-message-error"
                role="alert"
              >
                {fieldErrors.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
            <p className="font-semibold">Protect your information</p>
            <p className="mt-1">
              {secureMessage.submissionNotice ||
                SUPPORT_MESSAGES.secureSupportNotice}
            </p>
          </div>

          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Sending message..."
            type="submit"
          >
            Send secure message
          </Button>
        </form>
      </section>

      <p className="text-center text-xs text-foreground-subtle">
        Bank of the Philippine Islands is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph). Deposits are insured by PDIC up to PHP 500,000 per depositor.
      </p>
    </div>
  );
}

ContactPage.displayName = 'ContactPage';

ContactPage.propTypes = {
  className: () => null,
  onContact: () => null,
  onSubmit: () => null,
  support: childrenPropType,
};

export {
  createInitialForm,
  getChannelIdentifier,
  getFaqIdentifier,
  getFaqTitle,
  getFieldErrors,
  getSecureMessageCategories,
  normalizeText,
};

export default ContactPage;