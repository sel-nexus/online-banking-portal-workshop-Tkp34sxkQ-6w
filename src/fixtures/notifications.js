import { REFERENCE_DATE } from '../config/constants';

const DEFAULT_REFERENCE_DATE = '2026-10-22T00:00:00.000Z';

function getReferenceDate() {
  const candidate = REFERENCE_DATE
    ? new Date(REFERENCE_DATE)
    : new Date(DEFAULT_REFERENCE_DATE);

  return Number.isNaN(candidate.getTime())
    ? new Date(DEFAULT_REFERENCE_DATE)
    : candidate;
}

function relativeDate(daysFromReference) {
  const date = getReferenceDate();
  date.setUTCDate(date.getUTCDate() + daysFromReference);
  return date.toISOString();
}

/**
 * Exact synthetic notifications from PRD Section 3:
 * 1. “Payday Ipon Bonus is available”
 * 2. “Statement ready (simulated).”
 */
const PAYDAY_IPON_BONUS_NOTIFICATION = Object.freeze({
  id: 'notification-payday-ipon-bonus-001',
  notificationId: 'notification-payday-ipon-bonus-001',
  title: 'Payday Ipon Bonus is available',
  message: 'Payday Ipon Bonus is available. Activate by 31 Dec in this demonstration.',
  body: 'Payday Ipon Bonus is available. Activate by 31 Dec in this demonstration.',
  type: 'offer',
  category: 'promotions',
  status: 'unread',
  priority: 'normal',
  read: false,
  isRead: false,
  actionUrl: '/offers/offer-payday-ipon-bonus-2026',
  createdAt: relativeDate(-2),
  readAt: null,
});

const STATEMENT_READY_NOTIFICATION = Object.freeze({
  id: 'notification-statement-ready-001',
  notificationId: 'notification-statement-ready-001',
  title: 'Statement ready (simulated).',
  message: 'Statement ready (simulated). Review or download your latest simulated statement.',
  body: 'Statement ready (simulated). Review or download your latest simulated statement.',
  type: 'statement',
  category: 'account',
  status: 'unread',
  priority: 'normal',
  read: false,
  isRead: false,
  actionUrl: '/accounts/account-miguel-savings',
  statementPeriod: '30 Sep',
  createdAt: relativeDate(-1),
  readAt: null,
});

export const NOTIFICATIONS = Object.freeze([
  PAYDAY_IPON_BONUS_NOTIFICATION,
  STATEMENT_READY_NOTIFICATION,
]);

export const notifications = NOTIFICATIONS;
export const NOTIFICATION_FIXTURES = NOTIFICATIONS;
export const notificationFixtures = NOTIFICATIONS;

export {
  PAYDAY_IPON_BONUS_NOTIFICATION,
  STATEMENT_READY_NOTIFICATION,
};

export default NOTIFICATIONS;
