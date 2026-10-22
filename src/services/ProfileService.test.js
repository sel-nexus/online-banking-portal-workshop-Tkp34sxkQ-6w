import {
  deriveRelationshipTotals,
  getActiveProfile,
  getHomeModel,
  getProfileAccounts,
  getProfileOffers,
  getProfileNotifications,
  getProfileTransactions,
  getVisibleAccounts,
  selectVisibleAccount,
  switchProfile,
} from './ProfileService';
import { getAccount } from './AccountService';
import {
  MIGUEL_CHECKING_ACCOUNT,
  MIGUEL_CREDIT_ACCOUNT,
  MIGUEL_LOAN_ACCOUNT,
  MIGUEL_SAVINGS_ACCOUNT,
  ROSA_CHECKING_ACCOUNT,
  ROSA_LOAN_ACCOUNT,
} from '../fixtures/accounts';
import {
  MIGUEL_ROSA_PROFILE,
  ROSA_PROFILE,
} from '../fixtures/profiles';

describe('ProfileService', () => {
  describe('profile and account visibility', () => {
    it('returns the requested active profile and only its visible accounts', () => {
      expect(getActiveProfile('profile-miguel-rosa')).toEqual(
        expect.objectContaining({
          id: MIGUEL_ROSA_PROFILE.id,
          fullName: 'Miguel Rosa',
        }),
      );

      const miguelAccounts = getVisibleAccounts(MIGUEL_ROSA_PROFILE);
      const rosaAccounts = getVisibleAccounts(ROSA_PROFILE);

      expect(miguelAccounts).toHaveLength(4);
      expect(rosaAccounts).toHaveLength(2);
      expect(miguelAccounts).toEqual(
        expect.arrayContaining([
          MIGUEL_CHECKING_ACCOUNT,
          MIGUEL_SAVINGS_ACCOUNT,
          MIGUEL_CREDIT_ACCOUNT,
          MIGUEL_LOAN_ACCOUNT,
        ]),
      );
      expect(rosaAccounts).toEqual(
        expect.arrayContaining([
          ROSA_CHECKING_ACCOUNT,
          ROSA_LOAN_ACCOUNT,
        ]),
      );
      expect(
        miguelAccounts.some((account) => account.profileId === ROSA_PROFILE.id),
      ).toBe(false);
      expect(
        rosaAccounts.some(
          (account) => account.profileId === MIGUEL_ROSA_PROFILE.id,
        ),
      ).toBe(false);
    });

    it('returns no accounts for an unknown profile identifier', () => {
      expect(getActiveProfile('profile-does-not-exist')).toBeNull();
      expect(getProfileAccounts('profile-does-not-exist')).toEqual([]);
      expect(getVisibleAccounts('profile-does-not-exist')).toEqual([]);
    });
  });

  describe('relationship totals', () => {
    it('calculates Miguel relationship deposit available balance of PHP 142,860.25', () => {
      const totals = deriveRelationshipTotals(
        getVisibleAccounts(MIGUEL_ROSA_PROFILE),
      );

      expect(totals).toEqual(
        expect.objectContaining({
          currency: 'PHP',
          accountCount: 4,
          assetAccountCount: 2,
          liabilityAccountCount: 2,
          totalAssets: 142860.25,
          availableBalance: 142860.25,
          availableCredit: 41550,
        }),
      );
    });

    it('calculates Rosa relationship deposit available balance of PHP 54,300.00', () => {
      const totals = deriveRelationshipTotals(
        getVisibleAccounts(ROSA_PROFILE),
      );

      expect(totals).toEqual(
        expect.objectContaining({
          currency: 'PHP',
          accountCount: 2,
          assetAccountCount: 1,
          liabilityAccountCount: 1,
          totalAssets: 54300,
          totalLiabilities: 1250000,
          availableBalance: 54300,
          availableCredit: 0,
        }),
      );
    });
  });

  describe('home models', () => {
    it('builds Miguel home data with profile-owned accounts, transactions, offers, and notifications', () => {
      const state = {
        profile: {
          data: MIGUEL_ROSA_PROFILE,
        },
        selectedAccount: {
          id: MIGUEL_SAVINGS_ACCOUNT.id,
          account: MIGUEL_SAVINGS_ACCOUNT,
        },
      };
      const model = getHomeModel(state);

      expect(model.profile).toEqual(
        expect.objectContaining({
          id: MIGUEL_ROSA_PROFILE.id,
        }),
      );
      expect(model.accounts).toHaveLength(4);
      expect(model.selectedAccount).toEqual(MIGUEL_SAVINGS_ACCOUNT);
      expect(model.transactions).toHaveLength(7);
      expect(model.recentTransactions).toHaveLength(5);
      expect(model.notifications).toHaveLength(2);
      expect(model.unreadNotificationCount).toBe(2);
      expect(model.offers.length).toBeGreaterThanOrEqual(6);
      expect(model.relationshipTotals.totalAssets).toBe(142860.25);
    });

    it('builds Rosa home data without exposing Miguel-owned accounts', () => {
      const model = getHomeModel({
        profile: {
          data: ROSA_PROFILE,
        },
      });

      expect(model.profile).toEqual(
        expect.objectContaining({
          id: ROSA_PROFILE.id,
        }),
      );
      expect(model.accounts).toHaveLength(2);
      expect(model.accounts).toEqual(
        expect.arrayContaining([
          ROSA_CHECKING_ACCOUNT,
          ROSA_LOAN_ACCOUNT,
        ]),
      );
      expect(
        model.accounts.some(
          (account) => account.profileId === MIGUEL_ROSA_PROFILE.id,
        ),
      ).toBe(false);
      expect(model.relationshipTotals.totalLiabilities).toBe(1250000);
    });
  });

  describe('profile switching', () => {
    it('switches from Miguel to Rosa and returns Rosa-owned selections and totals', () => {
      const result = switchProfile(ROSA_PROFILE.id, {});

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          profile: ROSA_PROFILE,
          profileId: ROSA_PROFILE.id,
          userId: ROSA_PROFILE.userId,
          accounts: expect.any(Array),
          selectedAccount: ROSA_CHECKING_ACCOUNT,
        }),
      );
      expect(result.accounts).toHaveLength(2);
      expect(result.relationshipTotals.totalAssets).toBe(54300);
      expect(result.relationshipTotals.totalLiabilities).toBe(1250000);
    });

    it('rejects an unknown profile switch without returning account data', () => {
      const result = switchProfile('profile-does-not-exist', {});

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          profile: null,
          accounts: [],
          selectedAccount: null,
        }),
      );
      expect(result.error).toBeTruthy();
    });
  });

  describe('cross-profile account protection', () => {
    it('does not select Rosa accounts for Miguel through profile-scoped selection', () => {
      const selectedAccount = selectVisibleAccount(
        ROSA_CHECKING_ACCOUNT.id,
        MIGUEL_ROSA_PROFILE,
      );

      expect(selectedAccount).toEqual(MIGUEL_CHECKING_ACCOUNT);
      expect(selectedAccount.profileId).toBe(MIGUEL_ROSA_PROFILE.id);
      expect(
        getProfileAccounts(MIGUEL_ROSA_PROFILE).some(
          (account) => account.id === ROSA_CHECKING_ACCOUNT.id,
        ),
      ).toBe(false);
    });

    it('rejects a foreign account when resolving it through the account service', () => {
      expect(
        getAccount(
          ROSA_CHECKING_ACCOUNT.id,
          MIGUEL_ROSA_PROFILE,
          {},
        ),
      ).toBeNull();
    });
  });

  describe('profile-scoped collections', () => {
    it('returns only transactions, offers, and notifications visible to Miguel', () => {
      const transactions = getProfileTransactions(MIGUEL_ROSA_PROFILE);
      const offers = getProfileOffers(MIGUEL_ROSA_PROFILE);
      const notifications = getProfileNotifications(MIGUEL_ROSA_PROFILE);

      expect(transactions).toHaveLength(7);
      expect(
        transactions.every((transaction) =>
          [
            MIGUEL_CHECKING_ACCOUNT.id,
            MIGUEL_SAVINGS_ACCOUNT.id,
            MIGUEL_CREDIT_ACCOUNT.id,
          ].includes(transaction.accountId),
        ),
      ).toBe(true);
      expect(offers.length).toBeGreaterThanOrEqual(6);
      expect(notifications).toHaveLength(2);
    });

    it('excludes personalized Miguel offers from Rosa while retaining Rosa and common offers', () => {
      const rosaOffers = getProfileOffers(ROSA_PROFILE);

      expect(rosaOffers.length).toBeGreaterThanOrEqual(3);
      expect(
        rosaOffers.some((offer) => offer.segment === 'miguel-rosa'),
      ).toBe(false);
      expect(
        rosaOffers.some((offer) => offer.personalized === false),
      ).toBe(true);
    });
  });
});
