import {
  clearResetMarker,
  get,
  getKey,
  getResetMarker,
  registerMigration,
  remove,
  reset,
  set,
  subscribe,
} from './DemoStore';
import { redactForPersistence } from '../utils/redaction';

const storage = globalThis['localStorage'];

describe('DemoStore', () => {
  beforeEach(() => {
    reset();
    clearResetMarker();
  });

  afterEach(() => {
    reset();
    clearResetMarker();
  });

  describe('persistence and migration', () => {
    it('stores and retrieves versioned demo values', () => {
      const value = {
        status: 'ready',
        items: ['account-1'],
      };

      expect(set('demo-state', value)).toBe(true);
      expect(get('demo-state', null)).toEqual(value);
      expect(storage.getItem(getKey('demo-state'))).toContain('"version":"v1"');
    });

    it('migrates values from a registered storage version', () => {
      const removeMigration = registerMigration(
        'legacy',
        'v1',
        (value) => ({
          ...value,
          migrated: true,
        }),
      );

      storage.setItem(
        getKey('migrated-state'),
        JSON.stringify({
          version: 'legacy',
          value: {
            status: 'ready',
            migrated: false,
          },
        }),
      );

      expect(get('migrated-state', null)).toEqual({
        status: 'ready',
        migrated: true,
      });

      removeMigration();
    });

    it('returns the supplied fallback for malformed or incompatible state', () => {
      const fallback = {
        status: 'fallback',
      };

      storage.setItem(getKey('malformed-state'), '{not valid json');
      expect(get('malformed-state', fallback)).toEqual(fallback);

      storage.setItem(
        getKey('unknown-version-state'),
        JSON.stringify({
          version: 'unknown',
          value: {
            status: 'unexpected',
          },
        }),
      );

      expect(get('unknown-version-state', fallback)).toEqual(fallback);
    });
  });

  describe('privacy-safe persistence', () => {
    it('does not persist passwords when state is redacted before storage', () => {
      const state = redactForPersistence({
        session: {
          status: 'authenticated',
          password: 'demo-password',
        },
        profile: {
          id: 'profile-demo',
        },
      });

      expect(set('demo-state', state)).toBe(true);
      expect(get('demo-state', null)).toEqual({
        session: {
          status: 'authenticated',
        },
        profile: {
          id: 'profile-demo',
        },
      });
      expect(storage.getItem(getKey('demo-state'))).not.toContain(
        'demo-password',
      );
    });
  });

  describe('subscriptions and reset', () => {
    it('notifies subscribers when values are set and removed', () => {
      const changes = [];
      const unsubscribe = subscribe((change) => {
        changes.push(change);
      });

      set('subscription-state', { ready: true });
      remove('subscription-state');

      unsubscribe();

      expect(changes).toEqual([
        expect.objectContaining({
          type: 'set',
          key: 'subscription-state',
          source: 'local',
          value: { ready: true },
        }),
        expect.objectContaining({
          type: 'remove',
          key: 'subscription-state',
          source: 'local',
        }),
      ]);
    });

    it('clears persisted values, writes a reset marker, and emits a reset event', () => {
      const changes = [];
      const unsubscribe = subscribe((change) => {
        changes.push(change);
      });

      set('first-state', { value: 1 });
      set('second-state', { value: 2 });

      expect(reset()).toBe(true);
      expect(get('first-state', null)).toBeNull();
      expect(get('second-state', null)).toBeNull();
      expect(getResetMarker()).toEqual(
        expect.objectContaining({
          marker: 'demo-store-reset',
        }),
      );
      expect(changes).toContainEqual(
        expect.objectContaining({
          type: 'reset',
          key: null,
          source: 'local',
        }),
      );

      unsubscribe();
    });

    it('returns safe fallbacks when storage is unavailable for an empty key', () => {
      const fallback = {
        status: 'idle',
      };

      expect(get('', fallback)).toBe(fallback);
      expect(set('', { status: 'ready' })).toBe(false);
      expect(remove('')).toBe(false);
    });
  });
});