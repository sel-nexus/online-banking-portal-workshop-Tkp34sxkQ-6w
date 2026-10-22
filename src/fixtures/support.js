/**
 * Exact Support & Help data from PRD Section 4 (Help and chat):
 * - Help and Support asks “How can we help today?” and offers FAQ, Contact, and Chat.
 * - Call us: (+63 2) 8000 0000, sample only
 * - Secure message: Topic and message. Submit confirms receipt and opens no case
 * - Email enquiry: help@bpi-bank.demo, not a working mailbox
 * - Find a location: Ayala Branch, Makati; Quezon Avenue ATM; BGC Branch. A static list
 * - Lost or stolen card: (+63 2) 8000 0001, demonstration only
 * - Hours: Monday to Friday 08:00–17:00, Saturday 08:00–12:00, Sunday closed
 * - FAQ topics: Login assistance, Account and transactions, Cards and security, Products and offers
 * - Chat invitation: “Chat with us — Start a secure demonstration chat.”
 */
const SUPPORT_CHANNELS = Object.freeze([
  Object.freeze({
    id: 'support-channel-phone',
    type: 'phone',
    title: 'Call us',
    description: '(+63 2) 8000 0000, sample only',
    phone: '(+63 2) 8000 0000',
    hours: 'Monday to Friday 08:00–17:00, Saturday 08:00–12:00, Sunday closed',
    availability: 'available',
    secure: true,
  }),
  Object.freeze({
    id: 'support-channel-secure-message',
    type: 'secure-message',
    title: 'Secure message',
    description: 'Topic and message. Submit confirms receipt and opens no case.',
    url: '/contact',
    availability: 'available',
    secure: true,
  }),
  Object.freeze({
    id: 'support-channel-email',
    type: 'email',
    title: 'Email enquiry',
    description: 'help@bpi-bank.demo, not a working mailbox',
    email: 'help@bpi-bank.demo',
    responseTime: 'Sample only — not a working mailbox',
    availability: 'available',
    secure: true,
  }),
  Object.freeze({
    id: 'support-channel-chat',
    type: 'chat',
    title: 'Chat with us',
    description: 'Chat with us — Start a secure demonstration chat.',
    hours: 'Monday to Friday 08:00–17:00, Saturday 08:00–12:00',
    availability: 'available',
    secure: true,
  }),
]);

const BRANCH_ATM_LOCATIONS = Object.freeze([
  Object.freeze({
    id: 'location-ayala-makati',
    name: 'Ayala Branch, Makati',
    type: 'branch-and-atm',
    address: 'Ayala Avenue, Makati City, Metro Manila',
    city: 'Makati City',
    province: 'Metro Manila',
    branchHours: 'Monday to Friday 08:00–17:00, Saturday 08:00–12:00',
    atmHours: '24 hours',
    services: Object.freeze([
      'Branch banking (static sample)',
      'ATM services',
    ]),
    status: 'open',
  }),
  Object.freeze({
    id: 'location-quezon-avenue-atm',
    name: 'Quezon Avenue ATM',
    type: 'atm',
    address: 'Quezon Avenue, Quezon City, Metro Manila',
    city: 'Quezon City',
    province: 'Metro Manila',
    atmHours: '24 hours',
    services: Object.freeze([
      'Cash withdrawal (static sample)',
      'Balance inquiry',
    ]),
    status: 'open',
  }),
  Object.freeze({
    id: 'location-bgc-branch',
    name: 'BGC Branch',
    type: 'branch-and-atm',
    address: 'Bonifacio Global City, Taguig, Metro Manila',
    city: 'Taguig City',
    province: 'Metro Manila',
    branchHours: 'Monday to Friday 08:00–17:00, Saturday 08:00–12:00',
    atmHours: '24 hours',
    services: Object.freeze([
      'Branch banking (static sample)',
      'ATM services',
    ]),
    status: 'open',
  }),
]);

const SUPPORT_HOURS = Object.freeze({
  id: 'support-hours-standard',
  title: 'Hours',
  timezone: 'Asia/Manila',
  timezoneLabel: 'Philippine Standard Time',
  weekdays: 'Monday to Friday',
  weekdayHours: '08:00–17:00',
  saturdayHours: '08:00–12:00',
  sundayHours: 'Closed',
  holidayHours: 'Sunday closed',
  description: 'Monday to Friday 08:00–17:00, Saturday 08:00–12:00, Sunday closed',
  status: 'available',
});

const LOST_CARD_CONTACT = Object.freeze({
  id: 'lost-card-contact',
  title: 'Lost or stolen card',
  description: '(+63 2) 8000 0001, demonstration only',
  phone: '(+63 2) 8000 0001',
  internationalPhone: '(+63 2) 8000 0001',
  availability: 'Demonstration only',
  action: 'Demonstration only',
  securityNotice:
    'Never share your password, PIN, or government identification numbers.',
});

const FAQS = Object.freeze([
  Object.freeze({
    id: 'faq-login-assistance',
    title: 'Login assistance',
    question: 'Login assistance',
    answer:
      'Use the workshop user IDs (miguel / demo-only or rosa / demo-only). Forgot User ID and Forgot Password are simulated and no recovery instructions are sent.',
    category: 'Login assistance',
    status: 'published',
  }),
  Object.freeze({
    id: 'faq-account-transactions',
    title: 'Account and transactions',
    question: 'Account and transactions',
    answer:
      'Review deposit, card, and loan balances on the landing page or Accounts. Open an account summary to search, filter by date or type, expand synthetic transaction notes, and download a local statement.',
    category: 'Account and transactions',
    status: 'published',
  }),
  Object.freeze({
    id: 'faq-cards-security',
    title: 'Cards and security',
    question: 'Cards and security',
    answer:
      'For lost or stolen card inquiries in this demonstration, call (+63 2) 8000 0001 (demonstration only). Never enter real card numbers, passwords, or government ID numbers.',
    category: 'Cards and security',
    status: 'published',
  }),
  Object.freeze({
    id: 'faq-products-offers',
    title: 'Products and offers',
    question: 'Products and offers',
    answer:
      'Explore the six illustrative banking products and personalized or all offers. Selecting Express Interest or Apply records interest in this demonstration only and submits no real application.',
    category: 'Products and offers',
    status: 'published',
  }),
]);

const SECURE_MESSAGE_FORM = Object.freeze({
  id: 'secure-message-form',
  title: 'Secure message',
  description: 'Topic and message. Submit confirms receipt and opens no case.',
  fields: Object.freeze([
    Object.freeze({
      name: 'subject',
      label: 'Subject',
      type: 'text',
      required: true,
      maxLength: 100,
      placeholder: 'What can we help with?',
    }),
    Object.freeze({
      name: 'category',
      label: 'Topic',
      type: 'select',
      required: true,
      options: Object.freeze([
        'Login assistance',
        'Account and transactions',
        'Cards and security',
        'Products and offers',
        'Account access',
        'Transfers',
        'Payments',
        'Cards',
        'Other',
      ]),
    }),
    Object.freeze({
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      placeholder: 'Enter your demonstration enquiry.',
    }),
  ]),
  responseTime: 'Simulated receipt only — opens no case',
  submissionNotice:
    'Do not enter real card numbers, passwords, or government identification numbers.',
  secure: true,
  status: 'available',
});

const SUPPORT = Object.freeze({
  id: 'support-overview',
  title: 'Help & Support',
  heading: 'How can we help today?',
  subject: 'Help & Support',
  description: 'How can we help today? Choose FAQ, Contact, or Chat.',
  chatInvitation: 'Chat with us — Start a secure demonstration chat.',
  channels: SUPPORT_CHANNELS,
  locations: BRANCH_ATM_LOCATIONS,
  branches: BRANCH_ATM_LOCATIONS.filter(({ type }) =>
    ['branch', 'branch-and-atm'].includes(type),
  ),
  atms: BRANCH_ATM_LOCATIONS.filter(({ type }) =>
    ['atm', 'branch-and-atm'].includes(type),
  ),
  hours: SUPPORT_HOURS,
  lostCard: LOST_CARD_CONTACT,
  lostCardContact: LOST_CARD_CONTACT,
  faqs: FAQS,
  secureMessage: SECURE_MESSAGE_FORM,
  secureMessageForm: SECURE_MESSAGE_FORM,
  status: 'available',
});

export const SUPPORT_FIXTURES = Object.freeze([
  SUPPORT,
  ...SUPPORT_CHANNELS,
  ...BRANCH_ATM_LOCATIONS,
  SUPPORT_HOURS,
  LOST_CARD_CONTACT,
  ...FAQS,
  SECURE_MESSAGE_FORM,
]);

export const supportFixtures = SUPPORT_FIXTURES;
export const support = SUPPORT;
export const SUPPORT_DATA = SUPPORT;
export const supportChannels = SUPPORT_CHANNELS;
export const branchesAndAtms = BRANCH_ATM_LOCATIONS;
export const branchAtmLocations = BRANCH_ATM_LOCATIONS;
export const supportHours = SUPPORT_HOURS;
export const lostCardContact = LOST_CARD_CONTACT;
export const faqs = FAQS;
export const frequentlyAskedQuestions = FAQS;
export const secureMessageForm = SECURE_MESSAGE_FORM;

export {
  SUPPORT,
  SUPPORT_CHANNELS,
  BRANCH_ATM_LOCATIONS,
  SUPPORT_HOURS,
  LOST_CARD_CONTACT,
  FAQS,
  SECURE_MESSAGE_FORM,
};

export default SUPPORT;
