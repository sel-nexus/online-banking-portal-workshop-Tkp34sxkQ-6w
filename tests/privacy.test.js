import {
  formatAccountIdentifier,
  formatUserIdentifier,
} from '../src/utils/formatters';
import {
  redactForAnalytics,
  redactForPersistence,
} from '../src/utils/redaction';
import {
  CHAT_PRIVACY_WARNING,
  CHAT_FIXTURE,
} from '../src/fixtures/chat';
import { MIGUEL_CHECKING_ACCOUNT } from '../src/fixtures/accounts';
import { MIGUEL_ROSA_PROFILE } from '../src/fixtures/profiles';
import { SAVINGS_TRANSACTIONS } from '../src/fixtures/transactions';
import { SIMULATION_MESSAGES } from '../src/config/messages';
import {
  clearResetMarker,
  get,
  getKey,
  reset,
  set,
} from '../src/store/DemoStore';
import { trackEvent } from '../src/services/AnalyticsService';

describe('Privacy contracts', () => {
  beforeEach(() => {
    reset();
    clearResetMarker();
  });

  afterEach(() => {
    reset();
    clearResetMarker();
  });

  it('does not persist passwords or unmasked identity and account identifiers', () => {
    const safeState = redactForPersistence({
      password: 'demo-password',
      accountNumber: '1234567890123456',
      email: 'miguel.rosa@example.test',
      userId: 'user-miguel-rosa',
      profileId: 'profile-miguel-rosa',
      status: 'authenticated',
      preference: 'compact',
    });

    expect(set('privacy-state', safeState)).toBe(true);

    const storedValue = get('privacy-state', null);
    const rawValue = globalThis['localStorage'].getItem(getKey('privacy-state'));

    expect(storedValue).toEqual({
      status: 'authenticated',
      preference: 'compact',
    });
    expect(rawValue).not.toContain('demo-password');
    expect(rawValue).not.toContain('1234567890123456');
    expect(rawValue).not.toContain('miguel.rosa@example.test');
    expect(rawValue).not.toContain('user-miguel-rosa');
    expect(rawValue).not.toContain('profile-miguel-rosa');
  });

  it('removes sensitive fields from analytics payloads while retaining safe metrics', () => {
    const event = trackEvent(
      'account_viewed',
      {
        accountId: 'account-miguel-checking',
        amount: 84250.75,
        email: 'miguel.rosa@example.test',
        password: 'demo-password',
        profileId: 'profile-miguel-rosa',
        userId: 'user-miguel-rosa',
      },
      {
        persist: false,
      },
    );

    expect(event.properties).toEqual({
      amount: 84250.75,
    });

    const serializedEvent = JSON.stringify(event);

    expect(serializedEvent).not.toContain('demo-password');
    expect(serializedEvent).not.toContain('miguel.rosa@example.test');
    expect(serializedEvent).not.toContain('account-miguel-checking');
    expect(serializedEvent).not.toContain('profile-miguel-rosa');
    expect(serializedEvent).not.toContain('user-miguel-rosa');
  });

  it('masks account and user identifiers for display', () => {
    const displayedAccountIdentifier = formatAccountIdentifier(
      MIGUEL_CHECKING_ACCOUNT,
    );
    const displayedUserIdentifier = formatUserIdentifier(
      MIGUEL_ROSA_PROFILE,
    );

    expect(displayedAccountIdentifier).toBe('•••• 4821');
    expect(displayedUserIdentifier).toBe('m••••••••••@example.test');
    expect(displayedAccountIdentifier).not.toContain(
      'account-miguel-checking',
    );
    expect(displayedUserIdentifier).not.toContain(
      'miguel.rosa@example.test',
    );
    expect(displayedUserIdentifier).not.toContain('user-miguel-rosa');
  });

  it('marks fixture data and messages as synthetic demonstration content', () => {
    expect(MIGUEL_CHECKING_ACCOUNT.institution).toContain('Demo');
    expect(SAVINGS_TRANSACTIONS.every((transaction) =>
      transaction.reference.startsWith('SYN-'),
    )).toBe(true);
    expect(SIMULATION_MESSAGES.notice).toContain('simulation');
    expect(SIMULATION_MESSAGES.noRealTransactions).toContain('simulated');
    expect(CHAT_FIXTURE.status).toBe('active');
  });

  it('exposes a chat warning against sharing sensitive banking information', () => {
    const warningCopy = [
      CHAT_PRIVACY_WARNING.title,
      CHAT_PRIVACY_WARNING.message,
      CHAT_FIXTURE.disclosure,
    ]
      .join(' ')
      .toLowerCase();

    expect(warningCopy).toContain('password');
    expect(warningCopy).toContain('pin');
    expect(warningCopy).toContain('one-time password');
    expect(warningCopy).toContain('card number');
  });
});