/**
 * Exact 6 Products from PRD Section 4 (Landing and products):
 * 1. Ipon Goal Saver | Savings and deposits | Build savings automatically | Set a goal and move money on payday. Illustrative only | Existing peso savings customers
 * 2. Rewards Card | Credit cards | Earn on everyday purchases | Points on eligible spend. Placeholder rate | Subject to demonstration eligibility
 * 3. Personal Loan | Personal loans | Borrow for a planned expense | Preferential demonstration rate, indicative only | Eligibility applies
 * 4. Home Loan | Home loans | Finance a home in Metro Manila | A fee-waiver campaign may apply | Eligibility applies
 * 5. Family Shield | Insurance or protection | A simple protection conversation starter | Cover is illustrative only | Demonstration segment only
 * 6. Peso Term Deposit | Savings and deposits | Lock a peso amount for a fixed term | Promotional rate placeholder | Existing customers
 */
const IPON_GOAL_SAVER_PRODUCT = Object.freeze({
  id: 'product-high-yield-savings',
  productId: 'product-high-yield-savings',
  slug: 'ipon-goal-saver',
  name: 'Ipon Goal Saver',
  type: 'savings',
  category: 'Savings and deposits',
  description: 'Build savings automatically',
  benefit: 'Set a goal and move money on payday. Illustrative only',
  primaryBenefit: 'Set a goal and move money on payday. Illustrative only',
  eligibilitySummary: 'Existing peso savings customers',
  currency: 'PHP',
  interestRate: 3.25,
  rateLabel: 'Set a goal and move money on payday. Illustrative only (3.25% p.a. illustrative)',
  annualFee: 0,
  minimumBalance: 1000,
  minimumAmount: 1000,
  maximumAmount: 5000000,
  status: 'active',
  recommendedFor: Object.freeze(['profile-miguel-rosa', 'profile-rosa-santos']),
  imageUrl: '',
  features: Object.freeze([
    'Build savings automatically toward a target goal',
    'Set a goal and move money on payday (Illustrative only)',
    'Illustrative rate of 3.25% per annum',
  ]),
  benefits: Object.freeze([
    'Set a goal and move money on payday. Illustrative only',
  ]),
  rates: Object.freeze({
    interestRate: 3.25,
    interestRateUnit: 'percent per year',
  }),
  eligibility: Object.freeze({
    summary: 'Existing peso savings customers',
    requirements: Object.freeze(['Existing peso savings customers']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'Set a goal and move money on payday. Illustrative only. No credit decision, payout, or live rate applies.',
  }),
});

const REWARDS_CARD_PRODUCT = Object.freeze({
  id: 'product-platinum-credit-card',
  productId: 'product-platinum-credit-card',
  slug: 'rewards-card',
  name: 'Rewards Card',
  type: 'credit-card',
  category: 'Credit cards',
  description: 'Earn on everyday purchases',
  benefit: 'Points on eligible spend. Placeholder rate',
  primaryBenefit: 'Points on eligible spend. Placeholder rate',
  eligibilitySummary: 'Subject to demonstration eligibility',
  currency: 'PHP',
  interestRate: 24.0,
  rateLabel: 'Points on eligible spend. Placeholder rate',
  annualFee: 1500,
  minimumBalance: 0,
  minimumAmount: 20000,
  maximumAmount: 250000,
  status: 'active',
  recommendedFor: Object.freeze(['profile-miguel-rosa', 'profile-rosa-santos']),
  imageUrl: '',
  features: Object.freeze([
    'Earn on everyday purchases',
    'Points on eligible spend. Placeholder rate',
    'Eligible for Cashback Week and 5% Dining Cashback promotions in this demo',
  ]),
  benefits: Object.freeze([
    'Points on eligible spend. Placeholder rate',
  ]),
  rates: Object.freeze({
    interestRate: 24.0,
    interestRateUnit: 'percent per year (placeholder rate)',
  }),
  eligibility: Object.freeze({
    summary: 'Subject to demonstration eligibility',
    requirements: Object.freeze(['Subject to demonstration eligibility']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'Points on eligible spend and placeholder rate are illustrative only. No credit decision or application is submitted.',
  }),
});

const PERSONAL_LOAN_PRODUCT = Object.freeze({
  id: 'product-personal-loan',
  productId: 'product-personal-loan',
  slug: 'personal-loan',
  name: 'Personal Loan',
  type: 'personal-loan',
  category: 'Personal loans',
  description: 'Borrow for a planned expense',
  benefit: 'Preferential demonstration rate, indicative only',
  primaryBenefit: 'Preferential demonstration rate, indicative only',
  eligibilitySummary: 'Eligibility applies',
  currency: 'PHP',
  interestRate: 10.5,
  rateLabel: 'Preferential demonstration rate, indicative only',
  annualFee: 0,
  minimumBalance: 0,
  minimumAmount: 50000,
  maximumAmount: 1000000,
  status: 'active',
  imageUrl: '',
  features: Object.freeze([
    'Borrow for a planned expense',
    'Preferential demonstration rate, indicative only',
    'Flexible illustrative repayment schedule',
  ]),
  benefits: Object.freeze([
    'Preferential demonstration rate, indicative only',
  ]),
  rates: Object.freeze({
    interestRate: 10.5,
    interestRateUnit: 'percent per year (indicative only)',
  }),
  eligibility: Object.freeze({
    summary: 'Eligibility applies',
    requirements: Object.freeze(['Eligibility applies']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'Preferential demonstration rate is indicative only. No credit decision, payout, or live rate applies.',
  }),
});

const HOME_LOAN_PRODUCT = Object.freeze({
  id: 'product-home-loan',
  productId: 'product-home-loan',
  slug: 'home-loan',
  name: 'Home Loan',
  type: 'home-loan',
  category: 'Home loans',
  description: 'Finance a home in Metro Manila',
  benefit: 'A fee-waiver campaign may apply',
  primaryBenefit: 'A fee-waiver campaign may apply',
  eligibilitySummary: 'Eligibility applies',
  currency: 'PHP',
  interestRate: 6.25,
  rateLabel: 'A fee-waiver campaign may apply (6.25% p.a. illustrative)',
  annualFee: 0,
  minimumBalance: 0,
  minimumAmount: 1000000,
  maximumAmount: 15000000,
  status: 'active',
  imageUrl: '',
  features: Object.freeze([
    'Finance a home in Metro Manila',
    'A fee-waiver campaign may apply',
    'Illustrative repayment terms for residential property',
  ]),
  benefits: Object.freeze([
    'A fee-waiver campaign may apply',
  ]),
  rates: Object.freeze({
    interestRate: 6.25,
    interestRateUnit: 'percent per year',
  }),
  eligibility: Object.freeze({
    summary: 'Eligibility applies',
    requirements: Object.freeze(['Eligibility applies']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'A fee-waiver campaign may apply. Terms and rates are illustrative only.',
  }),
});

const FAMILY_SHIELD_PRODUCT = Object.freeze({
  id: 'product-everyday-checking',
  productId: 'product-everyday-checking',
  slug: 'family-shield',
  name: 'Family Shield',
  type: 'insurance',
  category: 'Insurance or protection',
  description: 'A simple protection conversation starter',
  benefit: 'Cover is illustrative only',
  primaryBenefit: 'Cover is illustrative only',
  eligibilitySummary: 'Demonstration segment only',
  currency: 'PHP',
  interestRate: 0,
  rateLabel: 'Cover is illustrative only',
  annualFee: 0,
  minimumBalance: 0,
  minimumAmount: 500,
  maximumAmount: 1000000,
  status: 'active',
  imageUrl: '',
  features: Object.freeze([
    'A simple protection conversation starter',
    'Cover is illustrative only',
    'Designed for the demonstration segment only',
  ]),
  benefits: Object.freeze([
    'Cover is illustrative only',
  ]),
  rates: Object.freeze({
    interestRate: 0,
    interestRateUnit: 'Cover is illustrative only',
  }),
  eligibility: Object.freeze({
    summary: 'Demonstration segment only',
    requirements: Object.freeze(['Demonstration segment only']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'Cover is illustrative only for this workshop simulation. No policy or application is issued.',
  }),
});

const PESO_TERM_DEPOSIT_PRODUCT = Object.freeze({
  id: 'product-time-deposit',
  productId: 'product-time-deposit',
  slug: 'peso-term-deposit',
  name: 'Peso Term Deposit',
  type: 'time-deposit',
  category: 'Savings and deposits',
  description: 'Lock a peso amount for a fixed term',
  benefit: 'Promotional rate placeholder',
  primaryBenefit: 'Promotional rate placeholder',
  eligibilitySummary: 'Existing customers',
  currency: 'PHP',
  interestRate: 4.25,
  rateLabel: 'Promotional rate placeholder (4.25% p.a. illustrative)',
  annualFee: 0,
  minimumBalance: 25000,
  minimumAmount: 25000,
  maximumAmount: 10000000,
  status: 'active',
  imageUrl: '',
  features: Object.freeze([
    'Lock a peso amount for a fixed term',
    'Promotional rate placeholder',
    'Available to existing customers in this demonstration',
  ]),
  benefits: Object.freeze([
    'Promotional rate placeholder',
  ]),
  rates: Object.freeze({
    interestRate: 4.25,
    interestRateUnit: 'percent per year (promotional rate placeholder)',
  }),
  eligibility: Object.freeze({
    summary: 'Existing customers',
    requirements: Object.freeze(['Existing customers']),
  }),
  terms: Object.freeze({
    illustrativeNote:
      'Promotional rate placeholder is illustrative only: no credit decision, payout, or live rate.',
  }),
});

const EVERYDAY_CHECKING_PRODUCT = FAMILY_SHIELD_PRODUCT;
const HIGH_YIELD_SAVINGS_PRODUCT = IPON_GOAL_SAVER_PRODUCT;
const PLATINUM_CREDIT_CARD_PRODUCT = REWARDS_CARD_PRODUCT;
const TIME_DEPOSIT_PRODUCT = PESO_TERM_DEPOSIT_PRODUCT;

export const PRODUCTS = Object.freeze([
  IPON_GOAL_SAVER_PRODUCT,
  REWARDS_CARD_PRODUCT,
  PERSONAL_LOAN_PRODUCT,
  HOME_LOAN_PRODUCT,
  FAMILY_SHIELD_PRODUCT,
  PESO_TERM_DEPOSIT_PRODUCT,
]);

export const products = PRODUCTS;

export {
  IPON_GOAL_SAVER_PRODUCT,
  REWARDS_CARD_PRODUCT,
  PERSONAL_LOAN_PRODUCT,
  HOME_LOAN_PRODUCT,
  FAMILY_SHIELD_PRODUCT,
  PESO_TERM_DEPOSIT_PRODUCT,
  EVERYDAY_CHECKING_PRODUCT,
  HIGH_YIELD_SAVINGS_PRODUCT,
  PLATINUM_CREDIT_CARD_PRODUCT,
  TIME_DEPOSIT_PRODUCT,
};

export default PRODUCTS;
