import {
  CHAT_ESCALATION_COPY,
  CHAT_FIXTURE,
  CHAT_GENERAL_REPLIES,
  CHAT_PROFILE_REPLIES,
  CHAT_PRIVACY_WARNING,
  CHAT_TOPIC_CHIPS,
} from '../fixtures/chat';
import { getActiveProfile, getProfileOffers } from './ProfileService';
import { simulateLoading } from '../utils/asyncUtils';

const CHAT_ACTIONS = Object.freeze({
  OPEN: 'chat/open',
  CLOSE: 'chat/close',
  MINIMIZE: 'chat/minimize',
  RESTORE: 'chat/restore',
  RESET: 'chat/reset',
  CLEAR: 'chat/clear',
  SET_DRAFT: 'chat/setDraft',
  SET_TOPIC: 'chat/setTopic',
  SEND_MESSAGE: 'chat/sendMessage',
  SET_TYPING: 'chat/setTyping',
  REPLY: 'chat/reply',
  FAILURE: 'chat/failure',
  REQUEST_ESCALATION: 'chat/requestEscalation',
  COMPLETE_ESCALATION: 'chat/completeEscalation',
  FAIL_ESCALATION: 'chat/failEscalation',
});

const CHAT_SERVICE_ERROR_CODES = Object.freeze({
  INVALID_MESSAGE: 'CHAT_INVALID_MESSAGE',
  ESCALATION_FAILED: 'CHAT_ESCALATION_FAILED',
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIdentifier(value) {
  return normalizeText(value).toLowerCase();
}

function createChatError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function dispatchAction(dispatch, action) {
  if (typeof dispatch === 'function') {
    dispatch(action);
  }

  return action;
}

function getActionPayload(options = {}) {
  return isRecord(options) ? options : {};
}

function getProfileReply(profileOrId, state, key) {
  const profile = getActiveProfile(profileOrId, state);
  const profileId = normalizeText(profile?.id);
  const profileReply = profileId ? CHAT_PROFILE_REPLIES[profileId] : null;

  return profileReply?.[key] || CHAT_GENERAL_REPLIES[key] || '';
}

function normalizeTopic(topic) {
  const rawTopic = isRecord(topic)
    ? topic.value || topic.id || topic.label || topic.prompt
    : topic;
  const value = normalizeIdentifier(rawTopic);

  if (!value) {
    return null;
  }

  const topicChip = CHAT_TOPIC_CHIPS.find(
    (chip) =>
      normalizeIdentifier(chip.id) === value ||
      normalizeIdentifier(chip.value) === value ||
      normalizeIdentifier(chip.label) === value,
  );

  return topicChip?.value || value;
}

function inferTopic(message) {
  const content = normalizeIdentifier(message);

  if (content.includes('balance') || content.includes('amount') || content.includes('transaction')) {
    return 'balance';
  }

  if (content.includes('card') || content.includes('stolen') || content.includes('lost')) {
    return 'cards';
  }

  if (content.includes('offer') || content.includes('promotion') || content.includes('eligibility') || content.includes('bonus')) {
    return 'offers';
  }

  if (content.includes('product') || content.includes('ipon') || content.includes('loan')) {
    return 'products';
  }

  if (content.includes('login') || content.includes('sign in') || content.includes('user id') || content.includes('forgot')) {
    return 'login';
  }

  if (content.includes('transfer')) {
    return 'transfers';
  }

  if (content.includes('payment') || content.includes('bill')) {
    return 'payments';
  }

  if (
    content.includes('security') ||
    content.includes('password') ||
    content.includes('pin') ||
    content.includes('otp')
  ) {
    return 'security';
  }

  if (
    content.includes('support') ||
    content.includes('representative') ||
    content.includes('agent')
  ) {
    return 'support';
  }

  if (content.includes('account')) {
    return 'account';
  }

  return 'unknown';
}

function createMessagePayload(message, sender, options = {}) {
  const content = normalizeText(
    isRecord(message)
      ? message.content ?? message.text ?? message.message
      : message,
  );

  if (!content) {
    return null;
  }

  const timestamp = options.timestamp || new Date().toISOString();
  const idPrefix = sender === 'user' ? 'chat-user-message' : 'chat-assistant-message';
  const id = options.id || `${idPrefix}-${Date.now()}`;

  return {
    ...(!isRecord(message) ? {} : message),
    id,
    messageId: options.messageId || message?.messageId || id,
    sender,
    senderId:
      options.senderId ||
      message?.senderId ||
      (sender === 'user' ? 'demo-user' : 'chat-assistant'),
    role: sender,
    content,
    text: content,
    type: options.type || message?.type || 'text',
    status: options.status || message?.status || 'sent',
    createdAt: options.createdAt || message?.createdAt || timestamp,
    sentAt: options.sentAt || message?.sentAt || timestamp,
  };
}

function createReplyPayload(reply, options = {}) {
  return createMessagePayload(reply, 'assistant', options);
}

function resolveScriptedReply(message, options = {}) {
  const content = normalizeText(
    isRecord(message)
      ? message.content ?? message.text ?? message.message
      : message,
  );
  const topic =
    normalizeTopic(isRecord(message) ? message.value || message.id : options.topic) ||
    inferTopic(content);

  if (['balance', 'account', 'cards', 'offers'].includes(topic)) {
    return {
      topic,
      content: getProfileReply(options.profileId, options.state, topic),
    };
  }

  return {
    topic,
    content: CHAT_GENERAL_REPLIES[topic] || CHAT_GENERAL_REPLIES.unknown,
  };
}

/**
 * Creates a chat command action.
 *
 * @param {string} type Chat action type.
 * @param {object} payload Action payload.
 * @returns {object} Reducer action.
 */
export function createChatAction(type, payload = {}) {
  return {
    type,
    payload: isRecord(payload) ? payload : {},
  };
}

/**
 * Opens chat support.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function openChat(dispatch) {
  return dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.OPEN));
}

/**
 * Closes chat support.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function closeChat(dispatch) {
  return dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.CLOSE));
}

/**
 * Minimizes chat support.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function minimizeChat(dispatch) {
  return dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.MINIMIZE));
}

/**
 * Restores minimized chat support.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function restoreChat(dispatch) {
  return dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.RESTORE));
}

/**
 * Resets the chat conversation without changing the rest of application state.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function resetChat(dispatch) {
  return dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.CLEAR));
}

/**
 * Sets the active chat topic.
 *
 * @param {string|object} topic Topic value or topic chip.
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function setChatTopic(topic, dispatch) {
  const value = normalizeTopic(isRecord(topic) ? topic.value || topic.id : topic);

  return dispatchAction(
    dispatch,
    createChatAction(CHAT_ACTIONS.SET_TOPIC, {
      topic: value,
      activeTopic: value,
    }),
  );
}

/**
 * Sets the current chat draft.
 *
 * @param {string} draft Draft message.
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched action.
 */
export function setChatDraft(draft, dispatch) {
  return dispatchAction(
    dispatch,
    createChatAction(CHAT_ACTIONS.SET_DRAFT, {
      draft: normalizeText(draft),
    }),
  );
}

/**
 * Sends a user message and returns the scripted assistant reply.
 *
 * @param {string|object} message Message or message payload.
 * @param {object} options Chat command options.
 * @returns {{message: object, reply: object, topic: string}} Message and reply data.
 */
export function sendChatMessage(message, options = {}) {
  const normalizedOptions = getActionPayload(options);
  const content = normalizeText(
    isRecord(message)
      ? message.content ?? message.text ?? message.message
      : message,
  );

  if (!content) {
    throw createChatError(
      'Enter a message before sending.',
      CHAT_SERVICE_ERROR_CODES.INVALID_MESSAGE,
    );
  }

  const topic = normalizeTopic(normalizedOptions.topic) || inferTopic(content);
  const userMessage = createMessagePayload(message, 'user', normalizedOptions);
  const scriptedReply = resolveScriptedReply(content, {
    ...normalizedOptions,
    topic,
  });
  const reply = createReplyPayload(scriptedReply.content, {
    ...normalizedOptions,
    type: 'text',
  });

  dispatchAction(
    normalizedOptions.dispatch,
    createChatAction(CHAT_ACTIONS.SEND_MESSAGE, userMessage),
  );
  dispatchAction(
    normalizedOptions.dispatch,
    createChatAction(CHAT_ACTIONS.REPLY, {
      ...reply,
      topic,
    }),
  );

  return {
    message: userMessage,
    reply: {
      ...reply,
      topic,
    },
    topic,
  };
}

/**
 * Returns the configured topic chips.
 *
 * @returns {object[]} Immutable-safe topic chip copies.
 */
export function getChatTopicChips() {
  return CHAT_TOPIC_CHIPS.map((chip) => ({ ...chip }));
}

/**
 * Returns a scripted reply for a message or topic.
 *
 * @param {string|object} message Message or topic value.
 * @param {object} options Reply options.
 * @returns {{topic: string, content: string}} Scripted reply.
 */
export function getChatReply(message, options = {}) {
  const normalizedOptions = getActionPayload(options);
  const value = normalizeText(
    isRecord(message)
      ? message.content ?? message.text ?? message.message
      : message,
  );

  return resolveScriptedReply(value, {
    ...normalizedOptions,
    topic: normalizedOptions.topic || (value ? undefined : message),
  });
}

/**
 * Returns personalized offers that can be linked from chat support.
 *
 * @param {object|string|number} profileOrId Profile or profile identifier.
 * @param {object} state Optional application state.
 * @returns {object[]} Privacy-safe offer links.
 */
export function getChatOfferLinks(profileOrId, state) {
  return getProfileOffers(profileOrId, state)
    .filter((offer) => offer?.status !== 'expired' && offer?.status !== 'inactive')
    .map((offer) => ({
      id: offer.id || offer.offerId,
      offerId: offer.offerId || offer.id,
      title: offer.title || offer.name || 'Offer',
      description: offer.description || '',
      url: offer.url || offer.actionUrl || null,
      type: offer.type || null,
      category: offer.category || null,
      status: offer.status || 'active',
      simulated: true,
    }));
}

/**
 * Returns the default chat fixture with safe copies of mutable collections.
 *
 * @returns {object} Chat fixture view.
 */
export function getChatFixture() {
  return {
    ...CHAT_FIXTURE,
    messages: Array.isArray(CHAT_FIXTURE.messages)
      ? CHAT_FIXTURE.messages.map((message) => ({ ...message }))
      : [],
    topicChips: getChatTopicChips(),
    privacyWarning: { ...CHAT_PRIVACY_WARNING },
    escalation: { ...CHAT_ESCALATION_COPY },
  };
}

/**
 * Requests simulated escalation to a support representative.
 *
 * @param {object} options Escalation options.
 * @returns {Promise<object>} Simulated escalation confirmation.
 */
export async function requestRepresentativeEscalation(options = {}) {
  const normalizedOptions = getActionPayload(options);
  const dispatch = normalizedOptions.dispatch;

  dispatchAction(dispatch, createChatAction(CHAT_ACTIONS.REQUEST_ESCALATION));

  try {
    const result = await simulateLoading(
      () => ({
        success: true,
        status: 'confirmed',
        simulated: true,
        requested: true,
        referenceId: `demo-escalation-${Date.now()}`,
        requestedAt: new Date().toISOString(),
        message: CHAT_ESCALATION_COPY.confirmation,
        disclosure: CHAT_PRIVACY_WARNING.message,
        escalation: { ...CHAT_ESCALATION_COPY },
      }),
      normalizedOptions,
    );

    dispatchAction(
      dispatch,
      createChatAction(CHAT_ACTIONS.COMPLETE_ESCALATION, result),
    );

    return result;
  } catch (error) {
    const escalationError =
      error?.code === CHAT_SERVICE_ERROR_CODES.ESCALATION_FAILED
        ? error
        : createChatError(
            CHAT_ESCALATION_COPY.unavailable,
            CHAT_SERVICE_ERROR_CODES.ESCALATION_FAILED,
            { cause: error, retryable: true },
          );

    dispatchAction(
      dispatch,
      createChatAction(CHAT_ACTIONS.FAIL_ESCALATION, {
        error: escalationError.message,
        message: escalationError.message,
      }),
    );

    throw escalationError;
  }
}

/**
 * Cancels a pending simulated representative escalation.
 *
 * @param {Function} dispatch Optional reducer dispatcher.
 * @returns {object} Dispatched failure action.
 */
export function cancelRepresentativeEscalation(dispatch) {
  return dispatchAction(
    dispatch,
    createChatAction(CHAT_ACTIONS.FAIL_ESCALATION, {
      error: CHAT_ESCALATION_COPY.cancelLabel,
      message: CHAT_ESCALATION_COPY.cancelLabel,
    }),
  );
}

export const openChatSupport = openChat;
export const closeChatSupport = closeChat;
export const minimizeChatSupport = minimizeChat;
export const restoreChatSupport = restoreChat;
export const clearChat = resetChat;
export const resetConversation = resetChat;
export const setTopic = setChatTopic;
export const getTopicChips = getChatTopicChips;
export const sendMessage = sendChatMessage;
export const getScriptedReply = getChatReply;
export const getOfferLinks = getChatOfferLinks;
export const requestSupportEscalation = requestRepresentativeEscalation;
export const escalateToRepresentative = requestRepresentativeEscalation;
export const cancelEscalation = cancelRepresentativeEscalation;

const chatService = Object.freeze({
  CHAT_ACTIONS,
  CHAT_SERVICE_ERROR_CODES,
  createChatAction,
  openChat,
  openChatSupport,
  closeChat,
  closeChatSupport,
  minimizeChat,
  minimizeChatSupport,
  restoreChat,
  restoreChatSupport,
  resetChat,
  resetConversation,
  clearChat,
  setChatTopic,
  setTopic,
  setChatDraft,
  sendChatMessage,
  sendMessage,
  getChatReply,
  getScriptedReply,
  getChatTopicChips,
  getTopicChips,
  getChatOfferLinks,
  getOfferLinks,
  getChatFixture,
  requestRepresentativeEscalation,
  requestSupportEscalation,
  escalateToRepresentative,
  cancelRepresentativeEscalation,
  cancelEscalation,
  CHAT_FIXTURE,
  CHAT_TOPIC_CHIPS,
  CHAT_PRIVACY_WARNING,
  CHAT_ESCALATION_COPY,
});

export {
  CHAT_ACTIONS,
  CHAT_SERVICE_ERROR_CODES,
  CHAT_FIXTURE,
  CHAT_TOPIC_CHIPS,
  CHAT_PRIVACY_WARNING,
  CHAT_ESCALATION_COPY,
};

export default chatService;