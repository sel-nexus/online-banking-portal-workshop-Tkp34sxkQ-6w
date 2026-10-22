import { CHAT_GENERAL_REPLIES, CHAT_PRIVACY_WARNING } from '../fixtures/chat';
import { findAccountById, findProfileById } from './..//services/FixtureRepository';
import { createInitialState, INITIAL_STATE } from './initialState';
import { sessionReducer } from './sessionReducer';

const DEMO_ACTIONS = Object.freeze({
  RESET: 'demo/reset',
  HYDRATE: 'demo/hydrate',
  LOAD_PROFILE_SUCCESS: 'profile/loadSuccess',
  LOAD_PROFILE_FAILURE: 'profile/loadFailure',
  SELECT_ACCOUNT: 'account/select',
  CLEAR_SELECTED_ACCOUNT: 'account/clearSelection',
  SELECT_OFFER: 'offer/select',
  CLEAR_SELECTED_OFFER: 'offer/clearSelection',
  SET_TRANSACTION_QUERY: 'transactions/setQuery',
  UPDATE_TRANSACTION_QUERY: 'transactions/updateQuery',
  RESET_TRANSACTION_QUERY: 'transactions/resetQuery',
  OPEN_FACILITATOR: 'facilitator/open',
  CLOSE_FACILITATOR: 'facilitator/close',
  MINIMIZE_FACILITATOR: 'facilitator/minimize',
  RESTORE_FACILITATOR: 'facilitator/restore',
  SET_FACILITATOR_PANEL: 'facilitator/setPanel',
  SET_FACILITATOR_TOPIC: 'facilitator/setTopic',
  OPEN_CHAT: 'chat/open',
  CLOSE_CHAT: 'chat/close',
  MINIMIZE_CHAT: 'chat/minimize',
  RESTORE_CHAT: 'chat/restore',
  SET_CHAT_DRAFT: 'chat/setDraft',
  SEND_CHAT_MESSAGE: 'chat/sendMessage',
  SET_CHAT_TYPING: 'chat/setTyping',
  CHAT_REPLY: 'chat/reply',
  CHAT_FAILURE: 'chat/failure',
  REQUEST_SUPPORT_ESCALATION: 'chat/requestEscalation',
  COMPLETE_SUPPORT_ESCALATION: 'chat/completeEscalation',
  FAIL_SUPPORT_ESCALATION: 'chat/failEscalation',
  MARK_NOTIFICATION_READ: 'notifications/markRead',
  MARK_ALL_NOTIFICATIONS_READ: 'notifications/markAllRead',
  SET_NOTIFICATIONS: 'notifications/set',
  NOTIFICATIONS_FAILURE: 'notifications/failure',
  TRACK_ANALYTICS: 'analytics/track',
  CLEAR_ANALYTICS: 'analytics/clear',
});

function normalizeActionType(type) {
  return String(type || '')
    .trim()
    .replace(/^[^:]+:/, '')
    .replace(/[-/\s]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

function getPayload(action) {
  return action && action.payload && typeof action.payload === 'object'
    ? action.payload
    : {};
}

function getValue(payload, action, keys, fallback = undefined) {
  const names = Array.isArray(keys) ? keys : [keys];

  for (const key of names) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key];
    }

    if (action && Object.prototype.hasOwnProperty.call(action, key)) {
      return action[key];
    }
  }

  return fallback;
}

function getTimestamp(payload, action) {
  return (
    getValue(payload, action, ['timestamp', 'createdAt', 'at']) ||
    new Date().toISOString()
  );
}

function getIdentifier(payload, action, keys = ['id', 'accountId']) {
  return getValue(payload, action, keys);
}

function resolveAccount(account, accountId) {
  if (account && typeof account === 'object') {
    return account;
  }

  return findAccountById(accountId) || null;
}

function resolveProfile(profile, profileId) {
  if (profile && typeof profile === 'object') {
    return profile;
  }

  return findProfileById(profileId) || null;
}

function updateUnreadCount(items) {
  return items.filter(
    (notification) =>
      notification.read !== true && notification.isRead !== true,
  ).length;
}

function createMessage(payload, sender, timestamp, idPrefix) {
  const content = String(
    payload.content ?? payload.text ?? payload.message ?? '',
  ).trim();

  if (!content) {
    return null;
  }

  const id = payload.id || `${idPrefix}-${Date.now()}`;

  return {
    id,
    messageId: payload.messageId || id,
    sender,
    senderId: payload.senderId || (sender === 'user' ? 'demo-user' : 'chat-assistant'),
    role: sender,
    content,
    text: content,
    type: payload.type || 'text',
    status: payload.status || 'sent',
    createdAt: payload.createdAt || timestamp,
    sentAt: payload.sentAt || timestamp,
  };
}

function getReplyForMessage(content, state) {
  const normalizedContent = String(content || '').toLowerCase();
  const profileReply = state.profile?.data
    ? CHAT_GENERAL_REPLIES
    : CHAT_GENERAL_REPLIES;

  if (
    normalizedContent.includes('balance') ||
    normalizedContent.includes('amount')
  ) {
    return profileReply.balance || CHAT_GENERAL_REPLIES.balance;
  }

  if (normalizedContent.includes('transfer')) {
    return CHAT_GENERAL_REPLIES.transfers;
  }

  if (
    normalizedContent.includes('payment') ||
    normalizedContent.includes('bill')
  ) {
    return CHAT_GENERAL_REPLIES.payments;
  }

  if (
    normalizedContent.includes('security') ||
    normalizedContent.includes('password') ||
    normalizedContent.includes('pin')
  ) {
    return CHAT_GENERAL_REPLIES.security;
  }

  if (
    normalizedContent.includes('support') ||
    normalizedContent.includes('representative')
  ) {
    return CHAT_GENERAL_REPLIES.support;
  }

  return CHAT_GENERAL_REPLIES.unknown;
}

function reduceProfile(state, action, actionType, payload) {
  switch (actionType) {
    case 'LOAD_PROFILE_REQUEST':
    case 'PROFILE_LOAD_REQUEST':
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case 'LOAD_PROFILE_SUCCESS':
    case 'PROFILE_LOAD_SUCCESS':
    case 'SET_PROFILE': {
      const profileId = getValue(payload, action, ['profileId', 'id']);
      const profile = resolveProfile(
        getValue(payload, action, 'profile'),
        profileId,
      );

      return {
        ...state,
        status: profile ? 'ready' : 'error',
        data: profile,
        error: profile ? null : 'The profile could not be found.',
        lastUpdatedAt: profile ? getTimestamp(payload, action) : state.lastUpdatedAt,
      };
    }

    case 'LOAD_PROFILE_FAILURE':
    case 'PROFILE_LOAD_FAILURE':
      return {
        ...state,
        status: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'We could not load your profile.',
      };

    case 'PROFILE_CLEAR_PROFILE':
    case 'CLEAR_PROFILE':
      return {
        ...state,
        status: 'idle',
        data: null,
        error: null,
      };

    default:
      return state;
  }
}

function reduceFacilitator(state, action, actionType, payload) {
  switch (actionType) {
    case 'OPEN_FACILITATOR':
    case 'FACILITATOR_OPEN':
      return {
        ...state,
        isOpen: true,
        isMinimized: false,
        activePanel: getValue(payload, action, 'panel', state.activePanel),
        error: null,
      };

    case 'CLOSE_FACILITATOR':
    case 'FACILITATOR_CLOSE':
      return {
        ...state,
        isOpen: false,
        isMinimized: false,
      };

    case 'MINIMIZE_FACILITATOR':
    case 'FACILITATOR_MINIMIZE':
      return {
        ...state,
        isOpen: true,
        isMinimized: true,
      };

    case 'RESTORE_FACILITATOR':
    case 'FACILITATOR_RESTORE':
      return {
        ...state,
        isOpen: true,
        isMinimized: false,
      };

    case 'SET_FACILITATOR_PANEL':
    case 'FACILITATOR_SET_PANEL':
      return {
        ...state,
        activePanel: getValue(payload, action, ['panel', 'activePanel'], null),
        error: null,
      };

    case 'SET_FACILITATOR_TOPIC':
    case 'FACILITATOR_SET_TOPIC':
      return {
        ...state,
        activeTopic: getValue(payload, action, ['topic', 'activeTopic'], null),
        error: null,
      };

    case 'FACILITATOR_SET_FAILURE_SIMULATION':
    case 'SET_FAILURE_SIMULATION':
      return {
        ...state,
        failureSimulation: Boolean(
          getValue(payload, action, ['enabled', 'failureSimulation'], false),
        ),
        error: null,
      };

    case 'FACILITATOR_FAILURE':
      return {
        ...state,
        status: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'Something went wrong. Please try again.',
      };

    default:
      return state;
  }
}

function reduceSelectedAccount(state, action, actionType, payload) {
  switch (actionType) {
    case 'SELECT_ACCOUNT':
    case 'ACCOUNT_SELECT':
    case 'SET_SELECTED_ACCOUNT': {
      const id = getIdentifier(payload, action);
      const account = resolveAccount(getValue(payload, action, 'account'), id);

      return {
        ...state,
        id: id ?? account?.id ?? null,
        account,
        status: account ? 'ready' : 'error',
        error: account ? null : 'The account could not be found.',
      };
    }

    case 'CLEAR_SELECTED_ACCOUNT':
    case 'ACCOUNT_CLEAR_SELECTION':
    case 'CLEAR_ACCOUNT_SELECTION':
      return {
        ...state,
        id: null,
        account: null,
        status: 'idle',
        error: null,
      };

    default:
      return state;
  }
}

function reduceSelectedOffer(state, action, actionType, payload) {
  switch (actionType) {
    case 'SELECT_OFFER':
    case 'OFFER_SELECT':
    case 'SET_SELECTED_OFFER': {
      const offer = getValue(payload, action, 'offer');
      const id = getIdentifier(payload, action, ['id', 'offerId']);

      return {
        ...state,
        id: id ?? offer?.id ?? null,
        offer: offer || null,
        status: offer ? 'ready' : 'error',
        error: offer ? null : 'The requested offer could not be found.',
      };
    }

    case 'CLEAR_SELECTED_OFFER':
    case 'OFFER_CLEAR_SELECTION':
    case 'CLEAR_OFFER_SELECTION':
      return {
        ...state,
        id: null,
        offer: null,
        status: 'idle',
        error: null,
      };

    default:
      return state;
  }
}

function reduceTransactionQuery(state, action, actionType, payload) {
  switch (actionType) {
    case 'SET_TRANSACTION_QUERY':
    case 'TRANSACTIONS_SET_QUERY':
      return {
        ...state,
        ...payload,
        statusState: 'ready',
        error: null,
      };

    case 'UPDATE_TRANSACTION_QUERY':
    case 'TRANSACTIONS_UPDATE_QUERY':
      return {
        ...state,
        ...payload,
        page: payload.page ?? 1,
        statusState: 'ready',
        error: null,
      };

    case 'RESET_TRANSACTION_QUERY':
    case 'TRANSACTIONS_RESET_QUERY':
      return {
        ...INITIAL_STATE.transactionQuery,
      };

    case 'TRANSACTIONS_LOAD_REQUEST':
      return {
        ...state,
        statusState: 'loading',
        error: null,
      };

    case 'TRANSACTIONS_LOAD_FAILURE':
      return {
        ...state,
        statusState: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'We could not load your transactions.',
      };

    default:
      return state;
  }
}

function reduceChat(state, action, actionType, payload) {
  switch (actionType) {
    case 'OPEN_CHAT':
    case 'CHAT_OPEN':
      return {
        ...state,
        isOpen: true,
        isMinimized: false,
        status: 'ready',
        error: null,
      };

    case 'CLOSE_CHAT':
    case 'CHAT_CLOSE':
      return {
        ...state,
        isOpen: false,
        isMinimized: false,
      };

    case 'MINIMIZE_CHAT':
    case 'CHAT_MINIMIZE':
      return {
        ...state,
        isOpen: true,
        isMinimized: true,
      };

    case 'RESTORE_CHAT':
    case 'CHAT_RESTORE':
      return {
        ...state,
        isOpen: true,
        isMinimized: false,
      };

    case 'SET_CHAT_DRAFT':
    case 'CHAT_SET_DRAFT':
      return {
        ...state,
        draft: String(getValue(payload, action, ['draft', 'value'], '')),
        error: null,
      };

    case 'SET_CHAT_TYPING':
    case 'CHAT_SET_TYPING':
      return {
        ...state,
        isTyping: Boolean(getValue(payload, action, ['isTyping', 'typing'], false)),
      };

    case 'SEND_CHAT_MESSAGE':
    case 'CHAT_SEND_MESSAGE': {
      const message = createMessage(
        payload,
        'user',
        getTimestamp(payload, action),
        'chat-user-message',
      );

      return message
        ? {
            ...state,
            isOpen: true,
            isMinimized: false,
            messages: [...state.messages, message],
            draft: '',
            isTyping: true,
            status: 'ready',
            error: null,
          }
        : {
            ...state,
            error: 'Enter a message before sending.',
          };
    }

    case 'CHAT_REPLY':
    case 'RECEIVE_CHAT_MESSAGE': {
      const message = createMessage(
        payload,
        'assistant',
        getTimestamp(payload, action),
        'chat-assistant-message',
      );

      return message
        ? {
            ...state,
            messages: [...state.messages, message],
            isTyping: false,
            status: 'ready',
            error: null,
          }
        : state;
    }

    case 'CHAT_FAILURE':
      return {
        ...state,
        isTyping: false,
        status: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'We could not connect to chat support.',
      };

    case 'REQUEST_SUPPORT_ESCALATION':
      return {
        ...state,
        escalation: {
          ...state.escalation,
          status: 'loading',
          requested: true,
          error: null,
        },
      };

    case 'COMPLETE_SUPPORT_ESCALATION':
      return {
        ...state,
        escalation: {
          ...state.escalation,
          status: 'success',
          requested: true,
          error: null,
        },
      };

    case 'FAIL_SUPPORT_ESCALATION':
      return {
        ...state,
        escalation: {
          ...state.escalation,
          status: 'error',
          requested: false,
          error:
            getValue(payload, action, ['error', 'message']) ||
            'Live support is currently unavailable.',
        },
      };

    case 'CLEAR_CHAT':
    case 'CHAT_CLEAR':
    case 'CHAT_RESET':
    case 'RESET_CHAT':
      return {
        ...state,
        messages: [],
        draft: '',
        activeTopic: null,
        isTyping: false,
        error: null,
      };

    case 'SET_CHAT_TOPIC':
    case 'CHAT_SET_TOPIC':
      return {
        ...state,
        activeTopic: getValue(payload, action, ['topic', 'activeTopic'], null),
      };

    default:
      return state;
  }
}

function reduceNotifications(state, action, actionType, payload) {
  switch (actionType) {
    case 'SET_NOTIFICATIONS':
    case 'NOTIFICATIONS_SET': {
      const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.notifications)
          ? payload.notifications
          : [];

      return {
        ...state,
        status: 'ready',
        items,
        unreadCount: updateUnreadCount(items),
        error: null,
        lastUpdatedAt: getTimestamp(payload, action),
      };
    }

    case 'MARK_NOTIFICATION_READ':
    case 'NOTIFICATIONS_MARK_READ': {
      const id = getIdentifier(payload, action, [
        'id',
        'notificationId',
      ]);
      const items = state.items.map((notification) =>
        String(notification.id) === String(id) ||
        String(notification.notificationId) === String(id)
          ? {
              ...notification,
              read: true,
              isRead: true,
              status: 'read',
              readAt: getTimestamp(payload, action),
            }
          : notification,
      );

      return {
        ...state,
        items,
        unreadCount: updateUnreadCount(items),
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ':
    case 'NOTIFICATIONS_MARK_ALL_READ': {
      const readAt = getTimestamp(payload, action);
      const items = state.items.map((notification) => ({
        ...notification,
        read: true,
        isRead: true,
        status: 'read',
        readAt,
      }));

      return {
        ...state,
        items,
        unreadCount: 0,
      };
    }

    case 'NOTIFICATIONS_LOAD_REQUEST':
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case 'NOTIFICATIONS_FAILURE':
    case 'NOTIFICATIONS_LOAD_FAILURE':
      return {
        ...state,
        status: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'We could not load your notifications.',
      };

    default:
      return state;
  }
}

function reduceAnalytics(state, action, actionType, payload) {
  switch (actionType) {
    case 'TRACK_ANALYTICS':
    case 'ANALYTICS_TRACK':
    case 'TRACK_EVENT': {
      const event = getValue(payload, action, ['event', 'name', 'eventName']);
      const item = {
        ...payload,
        event: event || 'unknown',
        timestamp: getTimestamp(payload, action),
      };

      return {
        ...state,
        status: 'ready',
        events: [...state.events, item],
        lastEvent: item,
        lastTrackedAt: item.timestamp,
        error: null,
      };
    }

    case 'CLEAR_ANALYTICS':
    case 'ANALYTICS_CLEAR':
      return {
        ...state,
        events: [],
        lastEvent: null,
        lastTrackedAt: null,
        error: null,
      };

    case 'ANALYTICS_FAILURE':
      return {
        ...state,
        status: 'error',
        error:
          getValue(payload, action, ['error', 'message']) ||
          'Analytics could not be recorded.',
      };

    default:
      return state;
  }
}

/**
 * Reduces application state for the demonstration banking portal.
 *
 * @param {object} state Current application state.
 * @param {object} action Action describing the requested state transition.
 * @returns {object} Updated application state.
 */
export function demoReducer(state = INITIAL_STATE, action = {}) {
  const currentState = state || INITIAL_STATE;
  const actionType = normalizeActionType(action.type);
  const payload = getPayload(action);

  if (
    actionType === 'RESET' ||
    actionType === 'RESET_DEMO' ||
    actionType === 'DEMO_RESET' ||
    actionType === 'RESET_STORE'
  ) {
    return createInitialState();
  }

  if (actionType === 'HYDRATE' || actionType === 'DEMO_HYDRATE') {
    const hydratedState = getValue(payload, action, ['state', 'data']);

    if (!hydratedState || typeof hydratedState !== 'object') {
      return currentState;
    }

    if (
      currentState.session?.isAuthenticated === true &&
      hydratedState.session?.isAuthenticated !== true
    ) {
      return {
        ...hydratedState,
        session: currentState.session,
        profile: currentState.profile,
      };
    }

    return {
      ...currentState,
      ...hydratedState,
    };
  }

  return {
    ...currentState,
    session: sessionReducer(currentState.session, action),
    profile: reduceProfile(currentState.profile, action, actionType, payload),
    facilitator: reduceFacilitator(
      currentState.facilitator,
      action,
      actionType,
      payload,
    ),
    selectedAccount: reduceSelectedAccount(
      currentState.selectedAccount,
      action,
      actionType,
      payload,
    ),
    selectedOffer: reduceSelectedOffer(
      currentState.selectedOffer,
      action,
      actionType,
      payload,
    ),
    transactionQuery: reduceTransactionQuery(
      currentState.transactionQuery,
      action,
      actionType,
      payload,
    ),
    chat: reduceChat(currentState.chat, action, actionType, payload),
    notifications: reduceNotifications(
      currentState.notifications,
      action,
      actionType,
      payload,
    ),
    analytics: reduceAnalytics(
      currentState.analytics,
      action,
      actionType,
      payload,
    ),
  };
}

export { DEMO_ACTIONS };

export const rootReducer = demoReducer;

export default demoReducer;