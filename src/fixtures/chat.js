/**
 * Exact Chat Panel data from PRD Section 4 (Help and chat):
 * - Panel titled: BPI Bank Assistant, with Minimize and Close.
 * - Welcome: “Welcome. Choose a topic or enter a question. This is a simulated conversation.”
 * - Chips: Account balance, Card help, Offers (plus Product information, Login assistance).
 * - Sample transcript:
 *   - 10:24, Assistant: “I can help explain recent transactions or available products.”
 *   - 10:25, Customer: “Tell me about my savings offer.”
 *   - 10:25, Assistant: “A Peso Savings promotion is available in this demo. Would you like to view it?”
 * - Actions: View offer, and Speak with a representative (simulated).
 * - Composer: “Type a message…” and Send.
 * - Privacy notice: asks the customer not to enter real card numbers, passwords, or government identification numbers.
 * - View offer opens Peso Savings Bonus for Miguel and the home-loan fee waiver for Rosa.
 * - Speak with a representative: “Connecting you to a representative is simulated. No agent was contacted and no case was opened.”
 */
const PRIVACY_WARNING = Object.freeze({
  id: 'chat-privacy-warning',
  title: 'Privacy notice',
  message:
    'Please do not enter real card numbers, passwords, or government identification numbers in this demonstration chat.',
  content:
    'Please do not enter real card numbers, passwords, or government identification numbers in this demonstration chat.',
  severity: 'warning',
  type: 'privacy',
  status: 'active',
});

const ESCALATION_COPY = Object.freeze({
  title: 'Speak with a representative (simulated)',
  message:
    'Welcome. Choose a topic or enter a question. This is a simulated conversation.',
  description:
    'Speak with a representative is simulated in this workshop.',
  confirmation:
    'Connecting you to a representative is simulated. No agent was contacted and no case was opened.',
  unavailable:
    'Simulated representative escalation is temporarily unavailable.',
  actionLabel: 'Speak with a representative (simulated)',
  cancelLabel: 'Not now',
  status: 'available',
});

const TOPIC_CHIPS = Object.freeze([
  Object.freeze({
    id: 'topic-account-balance',
    label: 'Account balance',
    value: 'balance',
    prompt: 'Account balance and transactions',
  }),
  Object.freeze({
    id: 'topic-card-help',
    label: 'Card help',
    value: 'cards',
    prompt: 'Card-related help',
  }),
  Object.freeze({
    id: 'topic-offers',
    label: 'Offers',
    value: 'offers',
    prompt: 'Offers and eligibility',
  }),
  Object.freeze({
    id: 'topic-products',
    label: 'Product information',
    value: 'products',
    prompt: 'Product information',
  }),
  Object.freeze({
    id: 'topic-login',
    label: 'Login assistance',
    value: 'login',
    prompt: 'Login assistance',
  }),
]);

const PROFILE_SPECIFIC_REPLIES = Object.freeze({
  'profile-miguel-rosa': Object.freeze({
    profileId: 'profile-miguel-rosa',
    name: 'Miguel',
    greeting:
      'Welcome, Miguel. Choose a topic or enter a question. This is a simulated conversation.',
    balance:
      'Your simulated deposit available balance is PHP 142,860.25 (Payroll account PHP 26,240.15 and Peso savings PHP 116,620.10). Your latest posted transaction is Salary credit (+ PHP 48,500.00 on 13 Oct).',
    account:
      'Your simulated deposit available balance is PHP 142,860.25, and your latest posted description is Salary credit.',
    cards:
      'Credit card (•••• 1188) amount due is PHP 8,450.00 (Available credit PHP 41,550.00). For a lost or stolen card, call (+63 2) 8000 0001 (demonstration only).',
    offers:
      'A Peso Savings promotion (Peso Savings Bonus) is available in this demo. Eligibility and bonus terms are illustrative only.',
    primaryOfferId: 'offer-high-yield-savings-2026',
    primaryOfferTitle: 'Peso Savings Bonus',
  }),
  'profile-rosa-santos': Object.freeze({
    profileId: 'profile-rosa-santos',
    name: 'Rosa',
    greeting:
      'Welcome, Rosa. Choose a topic or enter a question. This is a simulated conversation.',
    balance:
      'Your simulated deposit available balance is PHP 54,300.00 in your Salary account (•••• 2204). Your latest posted description is Salary credit (+ PHP 54,300.00).',
    account:
      'Your simulated deposit available balance is PHP 54,300.00, and your latest posted description is Salary credit.',
    cards:
      'You have no card in this demonstration. For lost or stolen card assistance, the contact is (+63 2) 8000 0001 (demonstration only).',
    offers:
      'The Home-loan fee waiver promotion is available for your profile, with eligibility and repayments described as illustrative.',
    primaryOfferId: 'offer-transfer-fee-waiver-2026',
    primaryOfferTitle: 'Home-loan fee waiver',
  }),
});

const GENERAL_REPLIES = Object.freeze({
  balance:
    'Your simulated deposit available balance is PHP 142,860.25, and the latest posted description is Salary credit.',
  cards:
    'Miguel: amount due PHP 8,450.00. Rosa: no card in this demonstration. Lost or stolen card contact: (+63 2) 8000 0001 (demonstration only).',
  products:
    'Featured products in this demonstration include Ipon Goal Saver (build savings automatically on payday) and Rewards Card (earn points on everyday purchases).',
  offers:
    'A Peso Savings promotion is available for Miguel, and the Home-loan fee waiver is available for Rosa, with eligibility and repayments described as illustrative.',
  login:
    'Workshop user IDs (miguel / demo-only and rosa / demo-only) are used in this demonstration. No password reset is sent.',
  transfers:
    'Transfers are out of scope in this workshop simulation. You can review simulated transfer records in your Peso Savings transaction history.',
  payments:
    'Bill payments are simulated in this workshop environment and no payment is sent to a real biller.',
  security:
    'Workshop user IDs are used and no password reset is sent. Never enter real card numbers, passwords, or government identification numbers.',
  support:
    'Connecting you to a representative is simulated. No agent was contacted and no case was opened.',
  unknown:
    'Welcome. Choose a topic (Account balance, Card help, Offers, Product information, or Login assistance) or enter a question. This is a simulated conversation.',
});

const CHAT_TRANSCRIPT_MESSAGES = Object.freeze([
  Object.freeze({
    id: 'chat-message-welcome',
    messageId: 'chat-message-welcome',
    sender: 'assistant',
    senderId: 'chat-assistant',
    role: 'assistant',
    timestampLabel: '10:24',
    content: 'I can help explain recent transactions or available products.',
    text: 'I can help explain recent transactions or available products.',
    type: 'text',
    status: 'sent',
    createdAt: '2026-10-22T10:24:00+08:00',
    sentAt: '2026-10-22T10:24:00+08:00',
  }),
  Object.freeze({
    id: 'chat-message-customer-offer',
    messageId: 'chat-message-customer-offer',
    sender: 'user',
    senderId: 'demo-user',
    role: 'user',
    timestampLabel: '10:25',
    content: 'Tell me about my savings offer.',
    text: 'Tell me about my savings offer.',
    type: 'text',
    status: 'sent',
    createdAt: '2026-10-22T10:25:00+08:00',
    sentAt: '2026-10-22T10:25:00+08:00',
  }),
  Object.freeze({
    id: 'chat-message-assistant-offer',
    messageId: 'chat-message-assistant-offer',
    sender: 'assistant',
    senderId: 'chat-assistant',
    role: 'assistant',
    timestampLabel: '10:25',
    content: 'A Peso Savings promotion is available in this demo. Would you like to view it?',
    text: 'A Peso Savings promotion is available in this demo. Would you like to view it?',
    type: 'text',
    status: 'sent',
    createdAt: '2026-10-22T10:25:30+08:00',
    sentAt: '2026-10-22T10:25:30+08:00',
  }),
]);

const CHAT = Object.freeze({
  id: 'chat-demo-conversation',
  conversationId: 'chat-demo-conversation',
  title: 'BPI Bank Assistant',
  welcomeMessage: 'Welcome. Choose a topic or enter a question. This is a simulated conversation.',
  status: 'active',
  startedAt: '2026-10-22T10:24:00+08:00',
  lastMessageAt: '2026-10-22T10:25:30+08:00',
  messages: CHAT_TRANSCRIPT_MESSAGES,
  topicChips: TOPIC_CHIPS,
  topics: TOPIC_CHIPS,
  privacyWarning: PRIVACY_WARNING,
  escalation: ESCALATION_COPY,
  disclosure: PRIVACY_WARNING.message,
  profileReplies: PROFILE_SPECIFIC_REPLIES,
  scriptedReplies: GENERAL_REPLIES,
});

export const CHAT_TRANSCRIPT_MESSAGES_EXPORT = CHAT_TRANSCRIPT_MESSAGES;
export { CHAT_TRANSCRIPT_MESSAGES };
export const CHAT_MESSAGES = CHAT_TRANSCRIPT_MESSAGES;
export const chatMessages = CHAT_TRANSCRIPT_MESSAGES;
export const CHAT_TRANSCRIPT = CHAT_TRANSCRIPT_MESSAGES;
export const chatTranscript = CHAT_TRANSCRIPT_MESSAGES;

export const CHAT_TOPIC_CHIPS = TOPIC_CHIPS;
export const chatTopicChips = TOPIC_CHIPS;
export const TOPICS = TOPIC_CHIPS;
export const topics = TOPIC_CHIPS;

export const CHAT_PRIVACY_WARNING = PRIVACY_WARNING;
export const privacyWarning = PRIVACY_WARNING;

export const CHAT_ESCALATION_COPY = ESCALATION_COPY;
export const escalationCopy = ESCALATION_COPY;

export const CHAT_PROFILE_REPLIES = PROFILE_SPECIFIC_REPLIES;
export const profileSpecificReplies = PROFILE_SPECIFIC_REPLIES;

export const CHAT_GENERAL_REPLIES = GENERAL_REPLIES;
export const scriptedReplies = GENERAL_REPLIES;

export const CHAT_FIXTURE = CHAT;
export const chatFixture = CHAT;
export const CHAT_DATA = CHAT;
export const chat = CHAT;

export default CHAT;
