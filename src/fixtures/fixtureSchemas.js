const ID_SCHEMA = Object.freeze({
  type: 'stringOrNumber',
  required: true,
});

const OPTIONAL_ID_SCHEMA = Object.freeze({
  type: 'stringOrNumber',
  required: false,
});

const TEXT_SCHEMA = Object.freeze({
  type: 'string',
  required: true,
});

const OPTIONAL_TEXT_SCHEMA = Object.freeze({
  type: 'string',
  required: false,
});

const MONEY_SCHEMA = Object.freeze({
  type: 'numberOrString',
  required: true,
});

const OPTIONAL_MONEY_SCHEMA = Object.freeze({
  type: 'numberOrString',
  required: false,
});

const DATE_SCHEMA = Object.freeze({
  type: 'string',
  required: true,
});

const OPTIONAL_DATE_SCHEMA = Object.freeze({
  type: 'string',
  required: false,
});

const BOOLEAN_SCHEMA = Object.freeze({
  type: 'boolean',
  required: true,
});

const OPTIONAL_BOOLEAN_SCHEMA = Object.freeze({
  type: 'boolean',
  required: false,
});

const ARRAY_SCHEMA = (items = { type: 'unknown' }) =>
  Object.freeze({
    type: 'array',
    required: true,
    items,
  });

const OPTIONAL_ARRAY_SCHEMA = (items = { type: 'unknown' }) =>
  Object.freeze({
    type: 'array',
    required: false,
    items,
  });

const objectSchema = (fields, options = {}) =>
  Object.freeze({
    type: 'object',
    required: options.required !== false,
    allowUnknown: options.allowUnknown !== false,
    fields: Object.freeze(fields),
  });

const PROFILE_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  userId: OPTIONAL_ID_SCHEMA,
  firstName: TEXT_SCHEMA,
  lastName: TEXT_SCHEMA,
  fullName: OPTIONAL_TEXT_SCHEMA,
  email: TEXT_SCHEMA,
  phone: OPTIONAL_TEXT_SCHEMA,
  mobileNumber: OPTIONAL_TEXT_SCHEMA,
  address: OPTIONAL_TEXT_SCHEMA,
  dateOfBirth: OPTIONAL_DATE_SCHEMA,
  avatarUrl: OPTIONAL_TEXT_SCHEMA,
  role: OPTIONAL_TEXT_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  preferredLanguage: OPTIONAL_TEXT_SCHEMA,
  notificationPreferences: {
    type: 'object',
    required: false,
    allowUnknown: true,
    fields: {
      email: OPTIONAL_BOOLEAN_SCHEMA,
      sms: OPTIONAL_BOOLEAN_SCHEMA,
      push: OPTIONAL_BOOLEAN_SCHEMA,
    },
  },
});

const ACCOUNT_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  accountId: OPTIONAL_ID_SCHEMA,
  number: OPTIONAL_TEXT_SCHEMA,
  accountNumber: OPTIONAL_TEXT_SCHEMA,
  maskedAccountNumber: OPTIONAL_TEXT_SCHEMA,
  name: TEXT_SCHEMA,
  type: TEXT_SCHEMA,
  currency: OPTIONAL_TEXT_SCHEMA,
  balance: MONEY_SCHEMA,
  availableBalance: OPTIONAL_MONEY_SCHEMA,
  currentBalance: OPTIONAL_MONEY_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  institution: OPTIONAL_TEXT_SCHEMA,
  interestRate: OPTIONAL_MONEY_SCHEMA,
  openedAt: OPTIONAL_DATE_SCHEMA,
  lastUpdated: OPTIONAL_DATE_SCHEMA,
  transactions: OPTIONAL_ARRAY_SCHEMA(),
});

const TRANSACTION_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  transactionId: OPTIONAL_ID_SCHEMA,
  accountId: OPTIONAL_ID_SCHEMA,
  type: TEXT_SCHEMA,
  category: OPTIONAL_TEXT_SCHEMA,
  description: TEXT_SCHEMA,
  merchant: OPTIONAL_TEXT_SCHEMA,
  payee: OPTIONAL_TEXT_SCHEMA,
  amount: MONEY_SCHEMA,
  currency: OPTIONAL_TEXT_SCHEMA,
  date: DATE_SCHEMA,
  postedAt: OPTIONAL_DATE_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  reference: OPTIONAL_TEXT_SCHEMA,
  balanceAfter: OPTIONAL_MONEY_SCHEMA,
  isCredit: OPTIONAL_BOOLEAN_SCHEMA,
});

const PRODUCT_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  productId: OPTIONAL_ID_SCHEMA,
  name: TEXT_SCHEMA,
  type: TEXT_SCHEMA,
  description: OPTIONAL_TEXT_SCHEMA,
  category: OPTIONAL_TEXT_SCHEMA,
  currency: OPTIONAL_TEXT_SCHEMA,
  interestRate: OPTIONAL_MONEY_SCHEMA,
  annualFee: OPTIONAL_MONEY_SCHEMA,
  minimumBalance: OPTIONAL_MONEY_SCHEMA,
  minimumAmount: OPTIONAL_MONEY_SCHEMA,
  maximumAmount: OPTIONAL_MONEY_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  imageUrl: OPTIONAL_TEXT_SCHEMA,
  features: OPTIONAL_ARRAY_SCHEMA({ type: 'string' }),
});

const OFFER_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  offerId: OPTIONAL_ID_SCHEMA,
  title: TEXT_SCHEMA,
  name: OPTIONAL_TEXT_SCHEMA,
  description: TEXT_SCHEMA,
  details: OPTIONAL_TEXT_SCHEMA,
  type: OPTIONAL_TEXT_SCHEMA,
  category: OPTIONAL_TEXT_SCHEMA,
  imageUrl: OPTIONAL_TEXT_SCHEMA,
  url: OPTIONAL_TEXT_SCHEMA,
  code: OPTIONAL_TEXT_SCHEMA,
  discount: OPTIONAL_MONEY_SCHEMA,
  amount: OPTIONAL_MONEY_SCHEMA,
  startDate: OPTIONAL_DATE_SCHEMA,
  endDate: OPTIONAL_DATE_SCHEMA,
  expiresAt: OPTIONAL_DATE_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  terms: OPTIONAL_TEXT_SCHEMA,
});

const SUPPORT_SCHEMA = objectSchema({
  id: OPTIONAL_ID_SCHEMA,
  title: OPTIONAL_TEXT_SCHEMA,
  subject: OPTIONAL_TEXT_SCHEMA,
  question: OPTIONAL_TEXT_SCHEMA,
  answer: OPTIONAL_TEXT_SCHEMA,
  description: OPTIONAL_TEXT_SCHEMA,
  content: OPTIONAL_TEXT_SCHEMA,
  category: OPTIONAL_TEXT_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  priority: OPTIONAL_TEXT_SCHEMA,
  email: OPTIONAL_TEXT_SCHEMA,
  phone: OPTIONAL_TEXT_SCHEMA,
  hours: { type: 'unknown', required: false },
  url: OPTIONAL_TEXT_SCHEMA,
  updatedAt: OPTIONAL_DATE_SCHEMA,
  faqs: OPTIONAL_ARRAY_SCHEMA(),
  articles: OPTIONAL_ARRAY_SCHEMA(),
});

const NOTIFICATION_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  notificationId: OPTIONAL_ID_SCHEMA,
  title: TEXT_SCHEMA,
  message: TEXT_SCHEMA,
  body: OPTIONAL_TEXT_SCHEMA,
  type: OPTIONAL_TEXT_SCHEMA,
  category: OPTIONAL_TEXT_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  priority: OPTIONAL_TEXT_SCHEMA,
  read: OPTIONAL_BOOLEAN_SCHEMA,
  isRead: OPTIONAL_BOOLEAN_SCHEMA,
  actionUrl: OPTIONAL_TEXT_SCHEMA,
  createdAt: DATE_SCHEMA,
  readAt: OPTIONAL_DATE_SCHEMA,
});

const CHAT_MESSAGE_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  messageId: OPTIONAL_ID_SCHEMA,
  sender: TEXT_SCHEMA,
  senderId: OPTIONAL_ID_SCHEMA,
  role: OPTIONAL_TEXT_SCHEMA,
  content: TEXT_SCHEMA,
  text: OPTIONAL_TEXT_SCHEMA,
  type: OPTIONAL_TEXT_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  createdAt: DATE_SCHEMA,
  sentAt: OPTIONAL_DATE_SCHEMA,
});

const CHAT_SCHEMA = objectSchema({
  id: ID_SCHEMA,
  conversationId: OPTIONAL_ID_SCHEMA,
  title: OPTIONAL_TEXT_SCHEMA,
  status: OPTIONAL_TEXT_SCHEMA,
  startedAt: OPTIONAL_DATE_SCHEMA,
  endedAt: OPTIONAL_DATE_SCHEMA,
  lastMessageAt: OPTIONAL_DATE_SCHEMA,
  messages: ARRAY_SCHEMA(CHAT_MESSAGE_SCHEMA),
});

export const FIXTURE_SCHEMAS = Object.freeze({
  profile: PROFILE_SCHEMA,
  profiles: ARRAY_SCHEMA(PROFILE_SCHEMA),
  account: ACCOUNT_SCHEMA,
  accounts: ARRAY_SCHEMA(ACCOUNT_SCHEMA),
  transaction: TRANSACTION_SCHEMA,
  transactions: ARRAY_SCHEMA(TRANSACTION_SCHEMA),
  product: PRODUCT_SCHEMA,
  products: ARRAY_SCHEMA(PRODUCT_SCHEMA),
  offer: OFFER_SCHEMA,
  offers: ARRAY_SCHEMA(OFFER_SCHEMA),
  support: SUPPORT_SCHEMA,
  supports: ARRAY_SCHEMA(SUPPORT_SCHEMA),
  notification: NOTIFICATION_SCHEMA,
  notifications: ARRAY_SCHEMA(NOTIFICATION_SCHEMA),
  chatMessage: CHAT_MESSAGE_SCHEMA,
  chatMessages: ARRAY_SCHEMA(CHAT_MESSAGE_SCHEMA),
  chat: CHAT_SCHEMA,
  chats: ARRAY_SCHEMA(CHAT_SCHEMA),
});

export const fixtureSchemas = FIXTURE_SCHEMAS;

export const PROFILE = PROFILE_SCHEMA;
export const ACCOUNT = ACCOUNT_SCHEMA;
export const TRANSACTION = TRANSACTION_SCHEMA;
export const PRODUCT = PRODUCT_SCHEMA;
export const OFFER = OFFER_SCHEMA;
export const SUPPORT = SUPPORT_SCHEMA;
export const NOTIFICATION = NOTIFICATION_SCHEMA;
export const CHAT = CHAT_SCHEMA;
export const CHAT_MESSAGE = CHAT_MESSAGE_SCHEMA;

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function isValidType(value, schema) {
  if (schema.type === 'unknown') {
    return true;
  }

  if (schema.type === 'string') {
    return typeof value === 'string';
  }

  if (schema.type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  if (schema.type === 'boolean') {
    return typeof value === 'boolean';
  }

  if (schema.type === 'stringOrNumber') {
    return (
      (typeof value === 'string' && value.trim().length > 0) ||
      (typeof value === 'number' && Number.isFinite(value))
    );
  }

  if (schema.type === 'numberOrString') {
    return (
      (typeof value === 'number' && Number.isFinite(value)) ||
      (typeof value === 'string' && value.trim().length > 0)
    );
  }

  if (schema.type === 'array') {
    return Array.isArray(value);
  }

  if (schema.type === 'object') {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  return false;
}

function collectErrors(value, schema, path, errors) {
  if (isMissing(value)) {
    if (schema.required) {
      errors.push(`${path} is required.`);
    }
    return;
  }

  if (!isValidType(value, schema)) {
    errors.push(`${path} must be a ${schema.type}.`);
    return;
  }

  if (schema.type === 'array' && schema.items) {
    value.forEach((item, index) => {
      collectErrors(item, schema.items, `${path}[${index}]`, errors);
    });
  }

  if (schema.type === 'object' && schema.fields) {
    Object.entries(schema.fields).forEach(([fieldName, fieldSchema]) => {
      collectErrors(value[fieldName], fieldSchema, `${path}.${fieldName}`, errors);
    });
  }
}

/**
 * Validates a value against a fixture schema.
 *
 * @param {object} schema Runtime fixture schema.
 * @param {*} value Fixture value to validate.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateSchema(schema, value) {
  const errors = [];
  collectErrors(value, schema, 'fixture', errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a named fixture against its registered schema.
 *
 * @param {string} fixtureType Registered fixture type.
 * @param {*} value Fixture value to validate.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateFixture(fixtureType, value) {
  const schema = FIXTURE_SCHEMAS[fixtureType];

  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown fixture schema: ${fixtureType}.`],
    };
  }

  return validateSchema(schema, value);
}

/**
 * Checks whether a value conforms to a named fixture schema.
 *
 * @param {string} fixtureType Registered fixture type.
 * @param {*} value Fixture value to check.
 * @returns {boolean} Whether the fixture is valid.
 */
export function isValidFixture(fixtureType, value) {
  return validateFixture(fixtureType, value).valid;
}

/**
 * Throws when a fixture does not conform to its registered schema.
 *
 * @param {string} fixtureType Registered fixture type.
 * @param {*} value Fixture value to validate.
 * @returns {*} The original fixture value.
 */
export function assertFixture(fixtureType, value) {
  const result = validateFixture(fixtureType, value);

  if (!result.valid) {
    throw new TypeError(
      `Invalid ${fixtureType} fixture: ${result.errors.join(' ')}`,
    );
  }

  return value;
}

export const validateProfile = (value) => validateSchema(PROFILE_SCHEMA, value);
export const validateAccount = (value) => validateSchema(ACCOUNT_SCHEMA, value);
export const validateTransaction = (value) =>
  validateSchema(TRANSACTION_SCHEMA, value);
export const validateProduct = (value) => validateSchema(PRODUCT_SCHEMA, value);
export const validateOffer = (value) => validateSchema(OFFER_SCHEMA, value);
export const validateSupport = (value) => validateSchema(SUPPORT_SCHEMA, value);
export const validateNotification = (value) =>
  validateSchema(NOTIFICATION_SCHEMA, value);
export const validateChat = (value) => validateSchema(CHAT_SCHEMA, value);
export const validateChatMessage = (value) =>
  validateSchema(CHAT_MESSAGE_SCHEMA, value);

export default FIXTURE_SCHEMAS;