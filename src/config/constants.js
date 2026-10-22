export const APP_NAME = import.meta.env.VITE_APP_NAME || 'BPI BANK';

export const REFERENCE_DATE = import.meta.env.VITE_REFERENCE_DATE || null;

export const STORAGE_NAMESPACE = 'online-banking-portal';
export const STORAGE_VERSION = 'v1';

export const ROUTES = Object.freeze({
  LOGIN: '/login',
  HOME: '/home',
  DASHBOARD: '/home',
  ACCOUNTS: '/accounts',
  PRODUCTS: '/products',
  OFFERS: '/offers',
  SUPPORT: '/support',
  CONTACT: '/contact',
  TRANSFERS: '/transfers',
  PAYMENTS: '/payments',
  PROFILE: '/profile',
});

export const ROUTE_NAMES = Object.freeze({
  LOGIN: 'login',
  HOME: 'home',
  DASHBOARD: 'dashboard',
  ACCOUNTS: 'accounts',
  PRODUCTS: 'products',
  OFFERS: 'offers',
  SUPPORT: 'support',
  CONTACT: 'contact',
  TRANSFERS: 'transfers',
  PAYMENTS: 'payments',
  PROFILE: 'profile',
});

export const DEMO_LABELS = Object.freeze({
  DEMO: 'Demo',
  DEMO_MODE: 'Demo mode',
  SAMPLE_DATA: 'Sample data',
  DEMO_ACCOUNT: 'Demo account',
  DEMO_USER: 'Demo user',
});

export const TIMEOUT_DURATIONS = Object.freeze({
  API_REQUEST: 30000,
  SESSION: 2 * 60 * 1000,
  TOAST: 5000,
  DEBOUNCE: 300,
});

export const TIMEOUTS = TIMEOUT_DURATIONS;

export const BPI_TOKENS = Object.freeze({
  RED: '#E83D45',
  RED_DARK: '#C92E36',
  RED_LIGHT: '#F9E1E3',
  DARK_NEUTRAL: '#183746',
  MUTED_TEXT: '#647982',
  ACCENT_MINT: '#00A69C',
  WARNING_BG: '#FFF4D4',
  WARNING_TEXT: '#8A5A00',
  NEUTRAL_BG: '#F6F8F9',
  CHAT_USER_BUBBLE: '#F9E1E3',
  BORDER: '#DDE4E7',
  BORDER_ACCENT: '#C0504D',
});

export const BPI_COLORS = BPI_TOKENS;