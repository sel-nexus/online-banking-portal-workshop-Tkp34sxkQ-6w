import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  createTransactionRows,
  normalizeTransactionQuery,
  queryTransactions,
} from './TransactionService';
import TransactionTable from '../components/transactions/TransactionTable';

describe('TransactionService', () => {
  describe('default transaction query', () => {
    it('returns the exact Peso Savings transaction rows within the default thirty-day fixture window', () => {
      const result = queryTransactions({
        accountId: 'account-miguel-savings',
        profileId: 'profile-miguel-rosa',
      });

      expect(result).toEqual(
        expect.objectContaining({
          status: 'ready',
          error: null,
          total: 5,
          page: 1,
          pageSize: 10,
        }),
      );
      expect(result.items.map((transaction) => transaction.id)).toEqual([
        'transaction-savings-001',
        'transaction-savings-002',
        'transaction-savings-003',
        'transaction-savings-004',
        'transaction-savings-005',
      ]);
      expect(result.items.every((transaction) => transaction.accountId === 'account-miguel-savings')).toBe(true);
    });

    it('uses the expected default query values when no filters are supplied', () => {
      expect(normalizeTransactionQuery()).toEqual(
        expect.objectContaining({
          accountId: null,
          search: '',
          type: 'all',
          status: 'all',
          category: 'all',
          startDate: null,
          endDate: null,
          sortBy: 'date',
          sortDirection: 'desc',
          page: 1,
          pageSize: 10,
        }),
      );
    });
  });

  describe('search, filter, sort, and reset behavior', () => {
    it('filters rows by search text and transaction type', () => {
      const searchResult = queryTransactions({
        accountId: 'account-miguel-savings',
        profileId: 'profile-miguel-rosa',
        search: 'transfer',
      });
      const depositResult = queryTransactions({
        accountId: 'account-miguel-savings',
        profileId: 'profile-miguel-rosa',
        type: 'credit',
      });

      expect(searchResult.items.map((transaction) => transaction.id)).toEqual([
        'transaction-savings-003',
      ]);
      expect(depositResult.items.map((transaction) => transaction.id)).toEqual([
        'transaction-savings-001',
      ]);
    });

    it('sorts matching rows by amount in ascending order', () => {
      const result = queryTransactions({
        accountId: 'account-miguel-savings',
        sortBy: 'amount',
        sortDirection: 'asc',
      });

      expect(result.items.map((transaction) => transaction.amount)).toEqual([
        185,
        1200,
        2126.4,
        5000,
        48500,
      ]);
      expect(result.query).toEqual(
        expect.objectContaining({
          sortBy: 'amount',
          sortDirection: 'asc',
        }),
      );
    });

    it('resets custom filters to the default query contract', () => {
      const filteredQuery = normalizeTransactionQuery({
        accountId: 'account-miguel-savings',
        search: 'savings',
        type: 'deposit',
        category: 'savings',
        startDate: '2026-10-01',
        endDate: '2026-10-22',
        sortBy: 'amount',
        sortDirection: 'asc',
        page: 2,
        pageSize: 5,
      });
      const resetQuery = normalizeTransactionQuery();

      expect(filteredQuery).toEqual(
        expect.objectContaining({
          accountId: 'account-miguel-savings',
          search: 'savings',
          type: 'deposit',
          page: 2,
          pageSize: 5,
        }),
      );
      expect(resetQuery).toEqual(
        expect.objectContaining({
          accountId: null,
          search: '',
          type: 'all',
          category: 'all',
          startDate: null,
          endDate: null,
          sortBy: 'date',
          sortDirection: 'desc',
          page: 1,
          pageSize: 10,
        }),
      );
    });
  });

  describe('custom dates and row view models', () => {
    it('returns only transactions inside the inclusive custom date range', () => {
      const result = queryTransactions({
        accountId: 'account-miguel-savings',
        startDate: '2026-10-09',
        endDate: '2026-10-12',
      });

      expect(result.items.map((transaction) => transaction.id)).toEqual([
        'transaction-savings-002',
        'transaction-savings-003',
        'transaction-savings-004',
      ]);
      expect(result.items.every((transaction) => transaction.displayDate)).toBe(true);
    });

    it('creates exact directional rows without mutating source transaction data', () => {
      const source = {
        id: 'transaction-test-in',
        accountId: 'account-miguel-savings',
        type: 'deposit',
        description: 'Test deposit',
        amount: 1250,
        currency: 'PHP',
        date: '2026-10-22',
        status: 'posted',
      };

      const [row] = createTransactionRows([source]);

      expect(row).toEqual(
        expect.objectContaining({
          id: 'transaction-test-in',
          transactionId: 'transaction-test-in',
          amount: 1250,
          direction: 'in',
          isCredit: true,
          displayAmount: 'PHP 1,250.00',
          displayDate: 'Oct 22, 2026',
        }),
      );
      expect(source).not.toHaveProperty('displayAmount');
      expect(source).not.toHaveProperty('direction');
    });
  });

  describe('transaction table states', () => {
    it('shows pending transaction summary context', () => {
      render(
        React.createElement(TransactionTable, {
          transactions: [
            {
              id: 'pending-transaction',
              accountId: 'account-miguel-savings',
              type: 'transfer',
              description: 'Pending transfer',
              amount: 1000,
              currency: 'PHP',
              date: '2026-10-22',
              status: 'pending',
            },
          ],
        }),
      );

      expect(screen.getByText('Pending transactions')).toBeInTheDocument();
      expect(screen.getByText('Some transactions are still being processed.')).toBeInTheDocument();
      expect(screen.getByText('Pending transfer')).toBeInTheDocument();
    });

    it('shows declined transaction context', () => {
      render(
        React.createElement(TransactionTable, {
          transactions: [
            {
              id: 'declined-transaction',
              accountId: 'account-miguel-credit',
              type: 'purchase',
              description: 'Declined card purchase',
              amount: 2450,
              currency: 'PHP',
              date: '2026-10-22',
              status: 'declined',
            },
          ],
        }),
      );

      expect(screen.getByText('Declined transactions')).toBeInTheDocument();
      expect(screen.getByText('Declined transactions are shown for your records and did not complete.')).toBeInTheDocument();
      expect(screen.getByText('Declined card purchase')).toBeInTheDocument();
    });

    it('shows an empty state when no transaction rows are available', () => {
      render(React.createElement(TransactionTable, { transactions: [] }));

      expect(screen.getByRole('heading', { name: 'No transactions yet' })).toBeInTheDocument();
      expect(screen.getByText('Transactions for this account will appear here.')).toBeInTheDocument();
    });

    it('shows an unavailable state and retry action when retrieval is unavailable', () => {
      const onRetry = vi.fn();

      render(
        React.createElement(TransactionTable, {
          onRetry,
          unavailable: true,
          transactions: [],
        }),
      );

      expect(screen.getByRole('heading', { name: 'Transactions are temporarily unavailable' })).toBeInTheDocument();
      expect(screen.getByText('This service is temporarily unavailable.')).toBeInTheDocument();

      screen.getByRole('button', { name: 'Try again' }).click();

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
