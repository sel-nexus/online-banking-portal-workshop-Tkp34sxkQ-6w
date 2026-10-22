const MIGUEL_SAVINGS_ACCOUNT_ID = 'account-miguel-savings';
const MIGUEL_CHECKING_ACCOUNT_ID = 'account-miguel-checking';
const MIGUEL_CREDIT_ACCOUNT_ID = 'account-miguel-credit';
const ROSA_CHECKING_ACCOUNT_ID = 'account-rosa-checking';

/**
 * Exact Peso Savings (•••• 9034) transaction fixtures from PRD Section 4:
 * - 13 Oct | Salary credit | Income | Posted | + PHP 48,500.00
 * - 12 Oct | Manila Supermarket | Groceries | Posted | − PHP 2,126.40
 * - 10 Oct | Savings goal transfer | Savings | Posted | − PHP 5,000.00
 * - 09 Oct | Makati Coffee Shop | Dining | Pending | − PHP 185.00
 * - 01 Oct | Metro Manila Transit | Transport | Posted, recurring | − PHP 1,200.00
 */
const SAVINGS_TRANSACTION_ONE = Object.freeze({
  id: 'transaction-savings-001',
  transactionId: 'transaction-savings-001',
  accountId: MIGUEL_SAVINGS_ACCOUNT_ID,
  type: 'credit',
  direction: 'in',
  category: 'Income',
  description: 'Salary credit',
  merchant: 'Employer Payroll Credit',
  amount: 48500.0,
  currency: 'PHP',
  date: '2026-10-13',
  postedAt: '2026-10-13',
  displayDate: '13 Oct',
  status: 'posted',
  statusLabel: 'Posted',
  reference: 'REF-9034-20261013-001',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: true,
});

const SAVINGS_TRANSACTION_TWO = Object.freeze({
  id: 'transaction-savings-002',
  transactionId: 'transaction-savings-002',
  accountId: MIGUEL_SAVINGS_ACCOUNT_ID,
  type: 'debit',
  direction: 'out',
  category: 'Groceries',
  description: 'Manila Supermarket',
  merchant: 'Manila Supermarket',
  amount: 2126.4,
  currency: 'PHP',
  date: '2026-10-12',
  postedAt: '2026-10-12',
  displayDate: '12 Oct',
  status: 'posted',
  statusLabel: 'Posted',
  reference: 'REF-9034-20261012-002',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: false,
});

const SAVINGS_TRANSACTION_THREE = Object.freeze({
  id: 'transaction-savings-003',
  transactionId: 'transaction-savings-003',
  accountId: MIGUEL_SAVINGS_ACCOUNT_ID,
  type: 'debit',
  direction: 'out',
  category: 'Savings',
  description: 'Savings goal transfer',
  merchant: 'Ipon Goal Saver',
  amount: 5000.0,
  currency: 'PHP',
  date: '2026-10-10',
  postedAt: '2026-10-10',
  displayDate: '10 Oct',
  status: 'posted',
  statusLabel: 'Posted',
  reference: 'REF-9034-20261010-003',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: false,
});

const SAVINGS_TRANSACTION_FOUR = Object.freeze({
  id: 'transaction-savings-004',
  transactionId: 'transaction-savings-004',
  accountId: MIGUEL_SAVINGS_ACCOUNT_ID,
  type: 'debit',
  direction: 'out',
  category: 'Dining',
  description: 'Makati Coffee Shop',
  merchant: 'Makati Coffee Shop',
  amount: 185.0,
  currency: 'PHP',
  date: '2026-10-09',
  postedAt: '2026-10-09',
  displayDate: '09 Oct',
  status: 'pending',
  statusLabel: 'Pending',
  reference: 'REF-9034-20261009-004',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: false,
});

const SAVINGS_TRANSACTION_FIVE = Object.freeze({
  id: 'transaction-savings-005',
  transactionId: 'transaction-savings-005',
  accountId: MIGUEL_SAVINGS_ACCOUNT_ID,
  type: 'debit',
  direction: 'out',
  category: 'Transport',
  description: 'Metro Manila Transit',
  merchant: 'Metro Manila Transit',
  amount: 1200.0,
  currency: 'PHP',
  date: '2026-10-01',
  postedAt: '2026-10-01',
  displayDate: '01 Oct',
  status: 'posted',
  statusLabel: 'Posted, recurring',
  recurring: true,
  reference: 'REF-9034-20261001-005',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: false,
});

export const SAVINGS_TRANSACTIONS = Object.freeze([
  SAVINGS_TRANSACTION_ONE,
  SAVINGS_TRANSACTION_TWO,
  SAVINGS_TRANSACTION_THREE,
  SAVINGS_TRANSACTION_FOUR,
  SAVINGS_TRANSACTION_FIVE,
]);

export const MIGUEL_SAVINGS_TRANSACTIONS = SAVINGS_TRANSACTIONS;

/**
 * Credit card (•••• 1188) declined row from PRD Section 4:
 * 08 Oct, Unknown merchant, Declined, PHP 0.00
 */
export const DECLINED_CREDIT_CARD_TRANSACTION = Object.freeze({
  id: 'transaction-credit-declined-001',
  transactionId: 'transaction-credit-declined-001',
  accountId: MIGUEL_CREDIT_ACCOUNT_ID,
  type: 'debit',
  direction: 'out',
  category: 'Card',
  description: 'Unknown merchant',
  merchant: 'Unknown merchant',
  amount: 0.0,
  currency: 'PHP',
  date: '2026-10-08',
  postedAt: '2026-10-08',
  displayDate: '08 Oct',
  status: 'declined',
  statusLabel: 'Declined',
  reference: 'REF-1188-20261008-001',
  syntheticNote: 'Synthetic declined authorization for workshop demonstration only.',
  isCredit: false,
});

const PAYROLL_TRANSACTION_ONE = Object.freeze({
  id: 'transaction-payroll-001',
  transactionId: 'transaction-payroll-001',
  accountId: MIGUEL_CHECKING_ACCOUNT_ID,
  type: 'credit',
  direction: 'in',
  category: 'Income',
  description: 'Payroll credit',
  merchant: 'Metro Manila Employer',
  amount: 26240.15,
  currency: 'PHP',
  date: '2026-10-13',
  postedAt: '2026-10-13',
  displayDate: '13 Oct',
  status: 'posted',
  statusLabel: 'Posted',
  reference: 'REF-4821-20261013-001',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: true,
});

const ROSA_SALARY_TRANSACTION_ONE = Object.freeze({
  id: 'transaction-rosa-salary-001',
  transactionId: 'transaction-rosa-salary-001',
  accountId: ROSA_CHECKING_ACCOUNT_ID,
  type: 'credit',
  direction: 'in',
  category: 'Income',
  description: 'Salary credit',
  merchant: 'Quezon City Employer',
  amount: 54300.0,
  currency: 'PHP',
  date: '2026-10-01',
  postedAt: '2026-10-01',
  displayDate: '01 Oct',
  status: 'posted',
  statusLabel: 'Posted',
  reference: 'REF-2204-20261001-001',
  syntheticNote: 'Synthetic transaction record for workshop demonstration only.',
  isCredit: true,
});

export const DECLINED_CREDIT_CARD_TRANSACTIONS = Object.freeze([
  DECLINED_CREDIT_CARD_TRANSACTION,
]);

export const TRANSACTIONS = Object.freeze([
  ...SAVINGS_TRANSACTIONS,
  DECLINED_CREDIT_CARD_TRANSACTION,
  PAYROLL_TRANSACTION_ONE,
  ROSA_SALARY_TRANSACTION_ONE,
]);

export const transactions = TRANSACTIONS;

export const savingsTransactions = SAVINGS_TRANSACTIONS;

export const declinedCreditCardTransaction = DECLINED_CREDIT_CARD_TRANSACTION;

export default TRANSACTIONS;
