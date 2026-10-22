import { CHAT_FIXTURE } from '../fixtures/chat';
import { NOTIFICATIONS } from '../fixtures/notifications';
import { assertFixture } from '../fixtures/fixtureSchemas';
import { PROFILES } from '../fixtures/profiles';
import { ACCOUNTS } from '../fixtures/accounts';
import { OFFERS } from '../fixtures/offers';

const DEFAULT_PROFILE = PROFILES[0];
const DEFAULT_ACCOUNT = ACCOUNTS.find(
  (account) => account.profileId === DEFAULT_PROFILE?.id,
);
const DEFAULT_OFFER = OFFERS.find((offer) => offer.status === 'active');

const INITIAL_SESSION_STATUS = 'anonymous';
const INITIAL_SLICE_STATUS = 'idle';

function deepFreeze(value, seen = new WeakSet()) {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    seen.has(value)
  ) {
    return value;
  }

  seen.add(value);

  Object.getOwnPropertyNames(value).forEach((propertyName) => {
    deepFreeze(value[propertyName], seen);
  });

  return Object.freeze(value);
}

function createSessionState() {
  return {
    status: INITIAL_SESSION_STATUS,
    isAuthenticated: false,
    isLoading: false,
    userId: null,
    profileId: null,
    expiresAt: null,
    lastActivityAt: null,
    error: null,
  };
}

function createProfileState() {
  return {
    status: INITIAL_SLICE_STATUS,
    data: null,
    error: null,
    lastUpdatedAt: null,
  };
}

function createFacilitatorState() {
  return {
    status: INITIAL_SLICE_STATUS,
    isOpen: false,
    isMinimized: false,
    activePanel: null,
    activeTopic: null,
    error: null,
  };
}

function createSelectedAccountState() {
  return {
    id: null,
    account: null,
    status: INITIAL_SLICE_STATUS,
    error: null,
  };
}

function createSelectedOfferState() {
  return {
    id: null,
    offer: null,
    status: INITIAL_SLICE_STATUS,
    error: null,
  };
}

function createTransactionQueryState() {
  return {
    accountId: null,
    search: '',
    type: 'all',
    status: 'all',
    category: 'all',
    startDate: null,
    endDate: null,
    sortBy: 'date',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10,
    statusState: INITIAL_SLICE_STATUS,
    error: null,
  };
}

function createChatState() {
  const messages = CHAT_FIXTURE.messages.map((message) => ({ ...message }));

  return {
    status: 'ready',
    isOpen: false,
    isMinimized: false,
    conversationId: CHAT_FIXTURE.conversationId || CHAT_FIXTURE.id,
    messages,
    topicChips: [...(CHAT_FIXTURE.topicChips || CHAT_FIXTURE.topics || [])],
    activeTopic: null,
    draft: '',
    isTyping: false,
    escalation: {
      status: 'idle',
      requested: false,
      error: null,
    },
    error: null,
  };
}

function createNotificationsState() {
  const notifications = NOTIFICATIONS.map((notification) => ({
    ...notification,
  }));

  return {
    status: INITIAL_SLICE_STATUS,
    items: notifications,
    unreadCount: notifications.filter(
      (notification) => notification.read !== true && notification.isRead !== true,
    ).length,
    error: null,
    lastUpdatedAt: null,
  };
}

function createAnalyticsState() {
  return {
    status: INITIAL_SLICE_STATUS,
    events: [],
    lastEvent: null,
    lastTrackedAt: null,
    error: null,
  };
}

/**
 * Creates a fresh validated initial state for the banking portal.
 *
 * @returns {object} Immutable application state.
 */
export function createInitialState() {
  const state = {
    session: createSessionState(),
    profile: createProfileState(),
    facilitator: createFacilitatorState(),
    selectedAccount: createSelectedAccountState(),
    selectedOffer: createSelectedOfferState(),
    transactionQuery: createTransactionQueryState(),
    chat: createChatState(),
    notifications: createNotificationsState(),
    analytics: createAnalyticsState(),
  };

  return deepFreeze(state);
}

/**
 * Validates the fixture-backed values used by the initial state.
 *
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateInitialStateFixtures() {
  const errors = [];

  try {
    assertFixture('profile', DEFAULT_PROFILE);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    assertFixture('account', DEFAULT_ACCOUNT);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    assertFixture('offer', DEFAULT_OFFER);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    assertFixture('chat', CHAT_FIXTURE);
  } catch (error) {
    errors.push(error.message);
  }

  NOTIFICATIONS.forEach((notification) => {
    try {
      assertFixture('notification', notification);
    } catch (error) {
      errors.push(error.message);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an application state shape.
 *
 * @param {*} state Application state to validate.
 * @returns {{valid: boolean, errors: string[]}} Validation result.
 */
export function validateInitialState(state) {
  const errors = [];

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {
      valid: false,
      errors: ['Initial state must be an object.'],
    };
  }

  [
    'session',
    'profile',
    'facilitator',
    'selectedAccount',
    'selectedOffer',
    'transactionQuery',
    'chat',
    'notifications',
    'analytics',
  ].forEach((sliceName) => {
    if (!state[sliceName] || typeof state[sliceName] !== 'object') {
      errors.push(`Initial state slice "${sliceName}" is required.`);
    }
  });

  if (state.session && state.session.isAuthenticated !== false) {
    errors.push('Initial session must not be authenticated.');
  }

  if (state.profile && state.profile.data !== null) {
    try {
      assertFixture('profile', state.profile.data);
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (state.chat && !Array.isArray(state.chat.messages)) {
    errors.push('Initial chat messages must be an array.');
  }

  if (
    state.notifications &&
    (!Array.isArray(state.notifications.items) ||
      typeof state.notifications.unreadCount !== 'number')
  ) {
    errors.push('Initial notifications must contain items and unreadCount.');
  }

  if (state.analytics && !Array.isArray(state.analytics.events)) {
    errors.push('Initial analytics events must be an array.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates and validates a fresh application state.
 *
 * @returns {object} Immutable validated application state.
 */
export function createValidatedInitialState() {
  const state = createInitialState();
  const result = validateInitialState(state);

  if (!result.valid) {
    throw new TypeError(
      `Invalid initial state: ${result.errors.join(' ')}`,
    );
  }

  return state;
}

export const INITIAL_STATE = createValidatedInitialState();
export const initialState = INITIAL_STATE;
export const DEFAULT_INITIAL_STATE = INITIAL_STATE;

export {
  INITIAL_SESSION_STATUS,
  INITIAL_SLICE_STATUS,
  DEFAULT_PROFILE,
  DEFAULT_ACCOUNT,
  DEFAULT_OFFER,
};

export default INITIAL_STATE;