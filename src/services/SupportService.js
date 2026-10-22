import { SUPPORT } from '../fixtures/support';
import { getSupportContent as getRepositorySupportContent } from './FixtureRepository';
import { VALIDATION_MESSAGES } from '../config/messages';
import { simulateLoading } from '../utils/asyncUtils';

const SUPPORT_RETRIEVAL_ERROR_CODE = 'SUPPORT_RETRIEVAL_FAILED';
const SECURE_MESSAGE_VALIDATION_ERROR_CODE = 'SECURE_MESSAGE_VALIDATION_FAILED';
const SECURE_MESSAGE_SUBMISSION_ERROR_CODE = 'SECURE_MESSAGE_SUBMISSION_FAILED';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_SUBJECT_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_SIZE_MB = 5;

const DEFAULT_ATTACHMENT_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'application/pdf',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIdentifier(value) {
  return normalizeText(value).toLowerCase();
}

function normalizePage(value, fallback = DEFAULT_PAGE) {
  const page = Number(value);

  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : fallback;
}

function normalizePageSize(value, fallback = DEFAULT_PAGE_SIZE) {
  const pageSize = Number(value);

  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return fallback;
  }

  return Math.min(MAX_PAGE_SIZE, Math.floor(pageSize));
}

function normalizeOptions(options) {
  return isRecord(options) ? options : {};
}

function createSupportError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getSupportSource(options = {}) {
  return isRecord(options.support)
    ? options.support
    : getRepositorySupportContent() || SUPPORT;
}

function getSupportItems(support, key) {
  return Array.isArray(support?.[key]) ? support[key] : [];
}

function normalizeCategory(value) {
  return normalizeText(value).toLowerCase().replace(/[-_\s]+/g, '-');
}

function normalizeSecureMessage(message) {
  const source = isRecord(message) ? message : {};

  return {
    subject: normalizeText(source.subject),
    category: normalizeText(source.category),
    message: normalizeText(source.message ?? source.content),
    attachment: source.attachment || null,
  };
}

function containsSensitiveContent(value) {
  return /\b(password|passwd|passcode|pin|otp|one[-\s]?time password|cvv|cvc|complete card number|full card number)\b/i.test(
    normalizeText(value),
  );
}

function getAttachmentSizeMb(attachment) {
  if (!isRecord(attachment)) {
    return 0;
  }

  if (attachment.sizeMb !== undefined) {
    const sizeMb = Number(attachment.sizeMb);
    return Number.isFinite(sizeMb) ? sizeMb : NaN;
  }

  if (attachment.size !== undefined) {
    const size = Number(attachment.size);
    return Number.isFinite(size) ? size / (1024 * 1024) : NaN;
  }

  return 0;
}

function getAttachmentType(attachment) {
  return normalizeText(attachment?.type).toLowerCase();
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
    ? categoryField.options.map(normalizeText).filter(Boolean)
    : [];
}

function getValidationErrors(message, support) {
  const normalizedMessage = normalizeSecureMessage(message);
  const errors = [];
  const categories = getSecureMessageCategories(support);

  if (!normalizedMessage.subject) {
    errors.push({
      field: 'subject',
      message: VALIDATION_MESSAGES.required,
    });
  } else if (normalizedMessage.subject.length > MAX_SUBJECT_LENGTH) {
    errors.push({
      field: 'subject',
      message: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.`,
    });
  }

  if (!normalizedMessage.category) {
    errors.push({
      field: 'category',
      message: VALIDATION_MESSAGES.required,
    });
  } else if (
    categories.length > 0 &&
    !categories.some(
      (category) =>
        normalizeCategory(category) ===
        normalizeCategory(normalizedMessage.category),
    )
  ) {
    errors.push({
      field: 'category',
      message: 'Select a valid support category.',
    });
  }

  if (!normalizedMessage.message) {
    errors.push({
      field: 'message',
      message: VALIDATION_MESSAGES.required,
    });
  } else if (normalizedMessage.message.length > MAX_MESSAGE_LENGTH) {
    errors.push({
      field: 'message',
      message: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    });
  }

  if (containsSensitiveContent(normalizedMessage.message)) {
    errors.push({
      field: 'message',
      message:
        'Do not include your password, PIN, one-time password, or complete card number.',
    });
  }

  if (normalizedMessage.attachment) {
    const attachmentType = getAttachmentType(normalizedMessage.attachment);
    const attachmentSizeMb = getAttachmentSizeMb(
      normalizedMessage.attachment,
    );

    if (
      attachmentType &&
      !DEFAULT_ATTACHMENT_TYPES.includes(attachmentType)
    ) {
      errors.push({
        field: 'attachment',
        message: 'The attachment type is not supported.',
      });
    }

    if (
      Number.isNaN(attachmentSizeMb) ||
      attachmentSizeMb > MAX_ATTACHMENT_SIZE_MB
    ) {
      errors.push({
        field: 'attachment',
        message: `Attachments must be ${MAX_ATTACHMENT_SIZE_MB} MB or smaller.`,
      });
    }
  }

  return errors;
}

function createPagination(items, page, pageSize) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const normalizedPage =
    totalPages > 0 ? Math.min(page, totalPages) : page;
  const start = (normalizedPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: normalizedPage,
    pageSize,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && normalizedPage < totalPages,
    hasPreviousPage: normalizedPage > 1 && totalPages > 0,
  };
}

/**
 * Returns the support content used by the demonstration portal.
 *
 * @param {object} options Support content options.
 * @returns {object} Support content fixture.
 */
export function getSupportContent(options = {}) {
  return getSupportSource(normalizeOptions(options));
}

/**
 * Lists support channels.
 *
 * @param {object} options Support listing options.
 * @returns {object[]} Support channels.
 */
export function listSupportChannels(options = {}) {
  return getSupportItems(getSupportSource(normalizeOptions(options)), 'channels');
}

/**
 * Lists frequently asked questions.
 *
 * @param {object} options FAQ listing options.
 * @returns {object[]} Frequently asked questions.
 */
export function listFrequentlyAskedQuestions(options = {}) {
  return getSupportItems(getSupportSource(normalizeOptions(options)), 'faqs');
}

/**
 * Searches frequently asked questions.
 *
 * @param {object} options FAQ search and pagination options.
 * @returns {object} Paginated FAQ results.
 */
export function queryFrequentlyAskedQuestions(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const support = getSupportSource(normalizedOptions);
  const search = normalizeText(
    normalizedOptions.search ??
      normalizedOptions.query ??
      normalizedOptions.keyword,
  ).toLowerCase();
  const category = normalizeCategory(normalizedOptions.category || 'all');

  const matchingFaqs = listFrequentlyAskedQuestions(normalizedOptions).filter(
    (faq) => {
      const faqCategory = normalizeCategory(faq?.category);

      if (category !== 'all' && faqCategory !== category) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        faq?.id,
        faq?.title,
        faq?.question,
        faq?.answer,
        faq?.category,
      ]
        .map(normalizeText)
        .join(' ')
        .toLowerCase()
        .includes(search);
    },
  );

  const page = normalizePage(normalizedOptions.page);
  const pageSize = normalizePageSize(
    normalizedOptions.pageSize ?? normalizedOptions.limit,
  );
  const pagination = createPagination(matchingFaqs, page, pageSize);

  return {
    ...pagination,
    faqs: pagination.items,
    query: {
      search,
      category,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    status: 'ready',
    error: null,
    support,
  };
}

/**
 * Validates a secure support message locally.
 *
 * @param {object} message Secure message fields.
 * @param {object} options Validation options.
 * @returns {{valid: boolean, errors: object[], value: object}} Validation result.
 */
export function validateSecureMessage(message, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const value = normalizeSecureMessage(message);
  const errors = getValidationErrors(
    value,
    getSupportSource(normalizedOptions),
  );

  return {
    valid: errors.length === 0,
    errors,
    value,
  };
}

/**
 * Submits a locally validated secure support message.
 *
 * No message is sent externally and the returned receipt intentionally
 * excludes the submitted message contents.
 *
 * @param {object} message Secure message fields.
 * @param {object} options Submission options.
 * @returns {Promise<object>} Simulated submission receipt.
 */
export async function submitSecureMessage(message, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const validation = validateSecureMessage(
    message,
    normalizedOptions,
  );

  if (!validation.valid) {
    throw createSupportError(
      'Please check the secure message fields and try again.',
      SECURE_MESSAGE_VALIDATION_ERROR_CODE,
      {
        errors: validation.errors,
        retryable: false,
      },
    );
  }

  try {
    return await simulateLoading(
      () => {
        const submittedAt = new Date().toISOString();
        const referenceId = `demo-support-${Date.now()}`;

        return {
          success: true,
          status: 'submitted',
          simulated: true,
          referenceId,
          submittedAt,
          category: validation.value.category,
          subject: validation.value.subject,
          responseTime:
            getSupportSource(normalizedOptions)?.secureMessage?.responseTime ||
            'Within one business day',
          message:
            'Your secure message has been submitted for demonstration only. No real message has been sent.',
          disclosure:
            getSupportSource(normalizedOptions)?.secureMessage
              ?.submissionNotice ||
            'Do not include your password, PIN, one-time password, or complete card number in your message.',
        };
      },
      normalizedOptions,
    );
  } catch (error) {
    if (error?.code) {
      throw error;
    }

    throw createSupportError(
      'The secure message could not be submitted.',
      SECURE_MESSAGE_SUBMISSION_ERROR_CODE,
      {
        cause: error,
        retryable: true,
      },
    );
  }
}

/**
 * Retrieves support content through the local support service.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Support content.
 */
export async function retrieveSupport(options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const retries = Number(normalizedOptions.maxRetries ?? normalizedOptions.retries);
  const maxRetries =
    Number.isFinite(retries) && retries >= 0 ? Math.floor(retries) : 0;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (
        normalizedOptions.simulateFailure === true ||
        normalizedOptions.shouldFail === true ||
        normalizedOptions.fail === true
      ) {
        throw createSupportError(
          'We could not load help and support content.',
          SUPPORT_RETRIEVAL_ERROR_CODE,
          {
            attempt: attempt + 1,
            retryable: true,
          },
        );
      }

      return getSupportContent(normalizedOptions);
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error?.code === SUPPORT_RETRIEVAL_ERROR_CODE) {
          throw error;
        }

        throw createSupportError(
          'We could not load help and support content.',
          SUPPORT_RETRIEVAL_ERROR_CODE,
          {
            cause: error,
            attempt: attempt + 1,
            retryable: true,
          },
        );
      }

      attempt += 1;
    }
  }

  throw createSupportError(
    'We could not load help and support content.',
    SUPPORT_RETRIEVAL_ERROR_CODE,
    {
      retryable: true,
    },
  );
}

/**
 * Retries support content retrieval at least once.
 *
 * @param {object} options Retrieval options.
 * @returns {Promise<object>} Support content.
 */
export function retrySupportRetrieval(options = {}) {
  return retrieveSupport({
    ...normalizeOptions(options),
    maxRetries: Math.max(
      1,
      Number(normalizeOptions(options).maxRetries ?? 0) || 0,
    ),
  });
}

export const getSupport = getSupportContent;
export const fetchSupport = retrieveSupport;
export const getSupportChannels = listSupportChannels;
export const getFaqs = listFrequentlyAskedQuestions;
export const searchFaqs = queryFrequentlyAskedQuestions;
export const validateSecureMessageForm = validateSecureMessage;
export const sendSecureMessage = submitSecureMessage;
export const submitMessage = submitSecureMessage;

export const SUPPORT_SERVICE_ERROR_CODES = Object.freeze({
  RETRIEVAL_FAILED: SUPPORT_RETRIEVAL_ERROR_CODE,
  VALIDATION_FAILED: SECURE_MESSAGE_VALIDATION_ERROR_CODE,
  SUBMISSION_FAILED: SECURE_MESSAGE_SUBMISSION_ERROR_CODE,
});

const supportService = Object.freeze({
  getSupportContent,
  getSupport,
  retrieveSupport,
  fetchSupport,
  retrySupportRetrieval,
  listSupportChannels,
  getSupportChannels,
  listFrequentlyAskedQuestions,
  getFaqs,
  queryFrequentlyAskedQuestions,
  searchFaqs,
  validateSecureMessage,
  validateSecureMessageForm,
  submitSecureMessage,
  sendSecureMessage,
  submitMessage,
  SUPPORT_SERVICE_ERROR_CODES,
});

export default supportService;