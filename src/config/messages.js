export const APP_MESSAGES = Object.freeze({
  appName: 'Online Banking Portal',
  welcome: 'Welcome to Online Banking',
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  loading: 'Loading...',
  saving: 'Saving...',
  processing: 'Processing...',
  required: 'Required',
  optional: 'Optional',
  close: 'Close',
  cancel: 'Cancel',
  confirm: 'Confirm',
  continue: 'Continue',
  back: 'Back',
  done: 'Done',
  submit: 'Submit',
  retry: 'Try again',
  refresh: 'Refresh',
  viewAll: 'View all',
  learnMore: 'Learn more',
  showMore: 'Show more',
  showLess: 'Show less',
});

export const NAVIGATION_LABELS = Object.freeze({
  dashboard: 'Dashboard',
  accounts: 'Accounts',
  transfers: 'Transfers',
  payments: 'Payments',
  profile: 'Profile',
  notifications: 'Notifications',
  helpAndSupport: 'Help & Support',
  logout: 'Log out',
  menu: 'Menu',
  mainNavigation: 'Main navigation',
  accountNavigation: 'Account navigation',
});

export const SIMULATION_MESSAGES = Object.freeze({
  bannerTitle: 'Demo mode',
  bannerText: 'You are viewing sample banking data in a secure demonstration environment.',
  notice:
    'This portal is a simulation. Transactions and account changes are not real and no funds will be moved.',
  noRealTransactions:
    'This is a simulated transaction. It will not be sent to a bank or affect a real account.',
  noRealFunds:
    'Displayed balances and funds are for demonstration purposes only.',
  sampleData: 'Sample data',
  demoAccount: 'Demo account',
  demoUser: 'Demo user',
  simulationOnly: 'Simulation only',
  notFinancialAdvice: 'This demonstration does not provide financial advice.',
  sensitiveDataWarning:
    'Do not enter real passwords, card numbers, or other sensitive personal information in this demo.',
});

export const AUTH_MESSAGES = Object.freeze({
  signIn: 'Sign in',
  signInTitle: 'Sign in to your account',
  signInDescription: 'Enter your credentials to access your online banking portal.',
  email: 'Email address',
  username: 'Username',
  password: 'Password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot password?',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  signingIn: 'Signing in...',
  signInSuccess: 'You have signed in successfully.',
  invalidCredentials: 'The email or password you entered is incorrect.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  signedOut: 'You have been signed out.',
  signOutConfirmation: 'Are you sure you want to log out?',
  secureSignIn: 'Your connection is secure.',
});

export const VALIDATION_MESSAGES = Object.freeze({
  required: 'This field is required.',
  emailRequired: 'Enter your email address.',
  emailInvalid: 'Enter a valid email address.',
  usernameRequired: 'Enter your username.',
  passwordRequired: 'Enter your password.',
  passwordTooShort: 'Password must be at least 8 characters.',
  passwordsDoNotMatch: 'Passwords do not match.',
  nameRequired: 'Enter your full name.',
  phoneRequired: 'Enter your mobile number.',
  phoneInvalid: 'Enter a valid mobile number.',
  accountRequired: 'Select an account.',
  amountRequired: 'Enter an amount.',
  amountInvalid: 'Enter a valid amount.',
  amountMustBePositive: 'Amount must be greater than zero.',
  amountExceedsBalance: 'Amount cannot exceed the available balance.',
  amountExceedsLimit: 'Amount exceeds the permitted limit.',
  dateRequired: 'Select a date.',
  dateInvalid: 'Enter a valid date.',
  dateInPast: 'Date cannot be in the past.',
  messageRequired: 'Enter a message.',
  messageTooLong: 'Message is too long.',
  searchRequired: 'Enter a search term.',
});

export const EMPTY_STATE_MESSAGES = Object.freeze({
  accountsTitle: 'No accounts found',
  accountsDescription: 'There are no accounts available to display.',
  transactionsTitle: 'No transactions yet',
  transactionsDescription: 'Transactions for this account will appear here.',
  paymentsTitle: 'No payments found',
  paymentsDescription: 'You do not have any scheduled or recent payments.',
  transfersTitle: 'No transfers found',
  transfersDescription: 'You do not have any recent transfers.',
  notificationsTitle: 'You are all caught up',
  notificationsDescription: 'There are no new notifications.',
  searchTitle: 'No results found',
  searchDescription: 'Try a different search term or remove some filters.',
  activityTitle: 'No recent activity',
  activityDescription: 'Your recent account activity will appear here.',
});

export const ERROR_MESSAGES = Object.freeze({
  generic: 'Something went wrong. Please try again.',
  loading: 'We could not load this information.',
  loadingAccounts: 'We could not load your accounts.',
  loadingTransactions: 'We could not load your transactions.',
  loadingProfile: 'We could not load your profile.',
  requestFailed: 'We could not complete your request.',
  network: 'We could not connect to the service. Check your connection and try again.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'The requested information could not be found.',
  accountNotFound: 'The account could not be found.',
  transactionNotFound: 'The transaction could not be found.',
  transferFailed: 'The transfer could not be completed.',
  paymentFailed: 'The payment could not be completed.',
  updateFailed: 'Your changes could not be saved.',
  timeout: 'The request took too long. Please try again.',
  unavailable: 'This service is temporarily unavailable.',
  invalidRequest: 'Please check your information and try again.',
});

export const SUPPORT_MESSAGES = Object.freeze({
  title: 'Help & Support',
  subtitle: 'Find answers or get help with your account.',
  contactUs: 'Contact us',
  callUs: 'Call us',
  emailUs: 'Email us',
  visitHelpCenter: 'Visit Help Center',
  frequentlyAskedQuestions: 'Frequently asked questions',
  needHelp: 'Need help?',
  supportHours: 'Support is available Monday to Friday, 8:00 AM to 5:00 PM.',
  secureSupportNotice:
    'Never share your password, PIN, or one-time password with anyone, including support representatives.',
  unavailable: 'Support is temporarily unavailable. Please try again later.',
});

export const CHAT_MESSAGES = Object.freeze({
  title: 'Chat support',
  open: 'Open chat support',
  close: 'Close chat support',
  minimize: 'Minimize chat',
  newConversation: 'Start a new conversation',
  inputLabel: 'Type your message',
  inputPlaceholder: 'How can we help?',
  send: 'Send message',
  sending: 'Sending...',
  typing: 'Support is typing...',
  greeting: 'Hello! How can we help you today?',
  hours:
    'Chat support is available Monday to Friday, 8:00 AM to 5:00 PM.',
  unavailable: 'Chat support is currently unavailable.',
  connectionError: 'We could not connect to chat support. Please try again.',
  disclosure:
    'For your security, never share your password, PIN, or one-time password in chat.',
  ended: 'This conversation has ended.',
});

export const FILIPINO_LABELS = Object.freeze({
  help: 'Tulong',
  support: 'Suporta',
  account: 'Account',
  accounts: 'Mga account',
  balance: 'Balanse',
  transfer: 'Paglipat',
  payment: 'Bayad',
  payments: 'Mga bayad',
  transaction: 'Transaksyon',
  transactions: 'Mga transaksyon',
  profile: 'Profile',
  settings: 'Mga setting',
  search: 'Maghanap',
  submit: 'Isumite',
  cancel: 'Kanselahin',
  save: 'I-save',
  continue: 'Magpatuloy',
  close: 'Isara',
  back: 'Bumalik',
  logout: 'Mag-log out',
  thankYou: 'Salamat',
  demoMode: 'Demo mode',
});

export const MESSAGES = Object.freeze({
  app: APP_MESSAGES,
  navigation: NAVIGATION_LABELS,
  simulation: SIMULATION_MESSAGES,
  auth: AUTH_MESSAGES,
  validation: VALIDATION_MESSAGES,
  empty: EMPTY_STATE_MESSAGES,
  errors: ERROR_MESSAGES,
  support: SUPPORT_MESSAGES,
  chat: CHAT_MESSAGES,
  filipino: FILIPINO_LABELS,
});

export const UI_MESSAGES = APP_MESSAGES;
export const LABELS = NAVIGATION_LABELS;
export const VALIDATION = VALIDATION_MESSAGES;
export const EMPTY_MESSAGES = EMPTY_STATE_MESSAGES;
export const ERROR_TEXT = ERROR_MESSAGES;
export const SUPPORT = SUPPORT_MESSAGES;
export const CHAT = CHAT_MESSAGES;
export const SIMULATION_BOUNDARY_MESSAGES = SIMULATION_MESSAGES;