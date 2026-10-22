import {
  confirmOfferAction,
  getOffer,
  listOffers,
  queryOffers,
} from './OfferService';

describe('OfferService', () => {
  describe('offer personalization', () => {
    it('returns only personalized current offers for the requested profile', () => {
      const offers = listOffers({
        personalizedOnly: true,
        profileId: 'profile-miguel-rosa',
      });

      expect(offers).toHaveLength(6);
      expect(offers.every((offer) => offer.personalized === true)).toBe(true);
      expect(offers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'offer-miguel-cashback-2026',
            isPersonalized: true,
          }),
          expect.objectContaining({
            id: 'offer-high-yield-savings-2026',
            isPersonalized: true,
          }),
        ]),
      );
    });

    it('does not expose Miguel-specific personalized offers to Rosa', () => {
      const offers = listOffers({
        personalizedOnly: true,
        profileId: 'profile-rosa-santos',
      });

      expect(offers).toHaveLength(1);
      expect(offers[0].id).toBe('offer-transfer-fee-waiver-2026');
    });
  });

  describe('category filtering', () => {
    it('returns current offers matching the requested category', () => {
      const result = queryOffers({
        category: 'Savings',
        profileId: 'profile-miguel-rosa',
      });

      expect(result).toEqual(
        expect.objectContaining({
          status: 'ready',
          total: 5,
          totalPages: 1,
        }),
      );
      expect(result.items).toHaveLength(5);
      expect(
        result.items.every((offer) => offer.category === 'Savings'),
      ).toBe(true);
    });

    it('returns no offers when the category does not match any offer', () => {
      const result = queryOffers({
        category: 'nonexistent-category',
        profileId: 'profile-miguel-rosa',
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('reference-date validity', () => {
    it('excludes expired offers from the default current-offer listing', () => {
      const offers = listOffers({
        profileId: 'profile-miguel-rosa',
      });

      expect(offers.some((offer) => offer.id === 'offer-new-year-cashback-2026')).toBe(
        false,
      );
      expect(offers.every((offer) => offer.isExpired === false)).toBe(true);
    });

    it('includes expired historical offers only when explicitly requested', () => {
      const offers = listOffers({
        includeExpired: true,
      });
      const expiredOffer = offers.find(
        (offer) => offer.id === 'offer-new-year-cashback-2026',
      );

      expect(expiredOffer).toEqual(
        expect.objectContaining({
          id: 'offer-new-year-cashback-2026',
          isExpired: true,
          status: 'expired',
        }),
      );
    });
  });

  describe('offer detail lookup', () => {
    it('returns the requested active offer detail for the owning profile', () => {
      const offer = getOffer('offer-miguel-cashback-2026', {
        profileId: 'profile-miguel-rosa',
      });

      expect(offer).toEqual(
        expect.objectContaining({
          id: 'offer-miguel-cashback-2026',
          offerId: 'offer-miguel-cashback-2026',
          title: 'Cashback Week',
          category: 'Cards',
          status: 'active',
          isPersonalized: true,
          isExpired: false,
        }),
      );
    });

    it('returns null for an unknown or unavailable offer identifier', () => {
      expect(
        getOffer('offer-does-not-exist', {
          profileId: 'profile-miguel-rosa',
        }),
      ).toBeNull();

      expect(
        getOffer('offer-miguel-cashback-2026', {
          profileId: 'profile-rosa-santos',
        }),
      ).toBeNull();
    });
  });

  describe('simulated offer confirmation', () => {
    it('confirms interest locally without redeeming the offer or changing an account', () => {
      const offer = getOffer('offer-miguel-cashback-2026', {
        profileId: 'profile-miguel-rosa',
      });
      const result = confirmOfferAction(
        offer,
        'offer_interest_confirmed',
        { profileId: 'profile-miguel-rosa' },
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          status: 'confirmed',
          simulated: true,
          offerId: 'offer-miguel-cashback-2026',
          action: 'offer_interest_confirmed',
          offer,
        }),
      );
      expect(result.message).toContain('simulated');
      expect(result).not.toHaveProperty('applicationId');
      expect(result).not.toHaveProperty('redeemed');
      expect(result).not.toHaveProperty('accountChanged');
    });

    it('rejects confirmation for an unknown offer', () => {
      expect(() =>
        confirmOfferAction(
          'offer-does-not-exist',
          'offer_interest_confirmed',
        ),
      ).toThrow(
        expect.objectContaining({
          code: 'OFFER_NOT_FOUND',
        }),
      );
    });
  });
});
