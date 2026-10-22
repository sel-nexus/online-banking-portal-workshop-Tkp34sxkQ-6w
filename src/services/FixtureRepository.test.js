import {
  findAccountById,
  findProfileById,
  getSupportContent,
  listAccountsByProfile,
  listProducts,
  listOffers,
  listTransactionsByAccount,
} from './FixtureRepository';
import {
  isValidFixture,
  validateFixture,
} from '../fixtures/fixtureSchemas';

describe('FixtureRepository', () => {
  describe('fixture validation', () => {
    it('returns validated fixture collections with the expected records', () => {
      const profiles = [
        findProfileById('profile-miguel-rosa'),
        findProfileById('profile-rosa-santos'),
      ];
      const accounts = [
        findAccountById('account-miguel-checking'),
        findAccountById('account-rosa-checking'),
      ];

      expect(profiles.every(Boolean)).toBe(true);
      expect(accounts.every(Boolean)).toBe(true);
      expect(profiles.every((profile) => isValidFixture('profile', profile))).toBe(true);
      expect(accounts.every((account) => isValidFixture('account', account))).toBe(true);
      expect(validateFixture('unknown-fixture', {}).valid).toBe(false);
    });

    it('rejects missing or malformed fixture values', () => {
      const result = validateFixture('account', {
        id: 'account-invalid',
        name: 'Incomplete account',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'fixture.type is required.',
          'fixture.balance is required.',
        ]),
      );
      expect(isValidFixture('account', null)).toBe(false);
    });
  });

  describe('profile and account ownership', () => {
    it('returns only accounts owned by the exact requested profile', () => {
      const miguelAccounts = listAccountsByProfile('profile-miguel-rosa');
      const rosaAccounts = listAccountsByProfile('profile-rosa-santos');

      expect(miguelAccounts).toHaveLength(4);
      expect(rosaAccounts).toHaveLength(2);
      expect(miguelAccounts.every((account) => account.profileId === 'profile-miguel-rosa')).toBe(true);
      expect(rosaAccounts.every((account) => account.profileId === 'profile-rosa-santos')).toBe(true);
      expect(miguelAccounts.some((account) => account.profileId === 'profile-rosa-santos')).toBe(false);
      expect(rosaAccounts.some((account) => account.profileId === 'profile-miguel-rosa')).toBe(false);
    });

    it('returns no accounts for unknown, missing, or partial profile identifiers', () => {
      expect(listAccountsByProfile('profile-miguel')).toEqual([]);
      expect(listAccountsByProfile('unknown-profile')).toEqual([]);
      expect(listAccountsByProfile()).toEqual([]);
      expect(listAccountsByProfile(null)).toEqual([]);
    });

    it('returns exact account and profile matches without exposing partial selectors', () => {
      expect(findProfileById('profile-miguel-rosa')?.id).toBe('profile-miguel-rosa');
      expect(findProfileById('profile-miguel')).toBeUndefined();
      expect(findAccountById('account-miguel-checking')?.id).toBe(
        'account-miguel-checking',
      );
      expect(findAccountById('account-miguel')).toBeUndefined();
      expect(findAccountById('missing-account')).toBeUndefined();
    });
  });

  describe('catalogue and transaction selectors', () => {
    it('returns the complete product and offer fixture catalogues', () => {
      const products = listProducts();
      const offers = listOffers();

      expect(products).toHaveLength(6);
      expect(offers).toHaveLength(10);
      expect(new Set(products.map((product) => product.id)).size).toBe(6);
      expect(new Set(offers.map((offer) => offer.id)).size).toBe(10);
      expect(products.every((product) => isValidFixture('product', product))).toBe(true);
      expect(offers.every((offer) => isValidFixture('offer', offer))).toBe(true);
    });

    it('returns only transactions for the exact requested account', () => {
      const savingsTransactions = listTransactionsByAccount(
        'account-miguel-savings',
      );
      const creditTransactions = listTransactionsByAccount(
        'account-miguel-credit',
      );

      expect(savingsTransactions).toHaveLength(5);
      expect(creditTransactions).toHaveLength(1);
      expect(
        savingsTransactions.every(
          (transaction) => transaction.accountId === 'account-miguel-savings',
        ),
      ).toBe(true);
      expect(
        creditTransactions.every(
          (transaction) => transaction.accountId === 'account-miguel-credit',
        ),
      ).toBe(true);
      expect(listTransactionsByAccount('account-miguel')).toEqual([]);
      expect(listTransactionsByAccount('missing-account')).toEqual([]);
      expect(listTransactionsByAccount()).toEqual([]);
    });

    it('returns safe immutable selector results', () => {
      const accounts = listAccountsByProfile('profile-miguel-rosa');
      const products = listProducts();
      const offers = listOffers();

      expect(Object.isFrozen(accounts)).toBe(true);
      expect(Object.isFrozen(products)).toBe(true);
      expect(Object.isFrozen(offers)).toBe(true);
      expect(getSupportContent()).toEqual(
        expect.objectContaining({
          id: 'support-overview',
          channels: expect.any(Array),
          faqs: expect.any(Array),
        }),
      );
    });
  });
});
