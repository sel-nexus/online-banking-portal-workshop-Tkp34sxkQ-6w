import {
  confirmProductAction,
  getProduct,
  listProducts,
  searchProducts,
} from './ProductService';

describe('ProductService', () => {
  describe('product catalogue', () => {
    it('returns all six active synthetic products with unique identifiers', () => {
      const products = listProducts();

      expect(products).toHaveLength(6);
      expect(new Set(products.map((product) => product.id)).size).toBe(6);
      expect(products.every((product) => product.status === 'active')).toBe(true);
      expect(products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'product-high-yield-savings',
            name: 'Ipon Goal Saver',
          }),
          expect.objectContaining({
            id: 'product-platinum-credit-card',
            name: 'Rewards Card',
          }),
          expect.objectContaining({
            id: 'product-personal-loan',
            name: 'Personal Loan',
          }),
          expect.objectContaining({
            id: 'product-home-loan',
            name: 'Home Loan',
          }),
          expect.objectContaining({
            id: 'product-everyday-checking',
            name: 'Family Shield',
          }),
          expect.objectContaining({
            id: 'product-time-deposit',
            name: 'Peso Term Deposit',
          }),
        ]),
      );
    });
  });

  describe('local product search', () => {
    it('returns products matching a local search term without a network request', () => {
      const results = searchProducts({
        search: 'savings',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'product-high-yield-savings',
          }),
        ]),
      );
      expect(
        results.every((product) =>
          [
            product.name,
            product.description,
            product.category,
            product.type,
            ...(product.features || []),
            ...(product.benefits || []),
          ]
            .join(' ')
            .toLowerCase()
            .includes('savings'),
        ),
      ).toBe(true);
    });

    it('returns an empty result when no product matches the search term', () => {
      expect(
        searchProducts({
          search: 'nonexistent synthetic product',
        }),
      ).toEqual([]);
    });
  });

  describe('product detail lookup', () => {
    it('returns a detailed product view by product identifier', () => {
      const product = getProduct('product-platinum-credit-card');

      expect(product).toEqual(
        expect.objectContaining({
          id: 'product-platinum-credit-card',
          productId: 'product-platinum-credit-card',
          name: 'Rewards Card',
          type: 'credit-card',
          category: 'Credit cards',
          status: 'active',
          currency: 'PHP',
          interestRate: 24,
        }),
      );
      expect(product.features).toEqual(expect.any(Array));
    });

    it('returns null for an unknown product identifier', () => {
      expect(getProduct('product-does-not-exist')).toBeNull();
    });
  });

  describe('simulated product interest action', () => {
    it('confirms interest locally without submitting an application or changing an account', () => {
      const product = getProduct('product-high-yield-savings');
      const result = confirmProductAction(
        product,
        'product_interest_confirmed',
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          status: 'confirmed',
          simulated: true,
          productId: 'product-high-yield-savings',
          action: 'product_interest_confirmed',
        }),
      );
      expect(result.message).toContain('simulated');
      expect(result).not.toHaveProperty('applicationId');
      expect(result).not.toHaveProperty('submitted');
    });

    it('rejects a simulated action for an unknown product', () => {
      expect(() =>
        confirmProductAction(
          'product-does-not-exist',
          'product_interest_confirmed',
        ),
      ).toThrow(
        expect.objectContaining({
          code: 'PRODUCT_NOT_FOUND',
        }),
      );
    });
  });
});
