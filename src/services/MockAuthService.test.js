import {
  evaluateCredentials,
  getLockoutStatus,
  requestRecovery,
  resetLockout,
  signIn,
} from './MockAuthService';

describe('MockAuthService', () => {
  beforeEach(() => {
    resetLockout('miguel.rosa.demo');
    resetLockout('unknown-user');
    resetLockout('');
  });

  describe('valid credentials', () => {
    it('authenticates a valid demonstration user and returns session details', async () => {
      const session = await signIn('miguel.rosa.demo', 'demo-password');

      expect(session).toEqual(
        expect.objectContaining({
          success: true,
          isAuthenticated: true,
          profileId: 'profile-miguel-rosa',
          userId: 'user-miguel-rosa',
          rememberMe: false,
        }),
      );
      expect(session.profile).toEqual(
        expect.objectContaining({
          id: 'profile-miguel-rosa',
          fullName: 'Miguel Rosa',
        }),
      );
    });
  });

  describe('validation and generic failures', () => {
    it('returns the blank validation contract without exposing a profile', () => {
      expect(evaluateCredentials('', '')).toEqual({
        valid: false,
        profile: null,
        reason: 'invalid',
      });
    });

    it('rejects unknown credentials with a generic invalid-credentials error', async () => {
      await expect(
        signIn('unknown-user@example.test', 'wrong-password'),
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        isLocked: false,
      });

      expect(
        evaluateCredentials('unknown-user@example.test', 'wrong-password'),
      ).toEqual(
        expect.objectContaining({
          valid: false,
          profile: null,
          reason: 'invalid',
        }),
      );
    });

    it('returns generic recovery guidance without revealing account existence', async () => {
      const response = await requestRecovery('unknown-user@example.test');

      expect(response).toEqual(
        expect.objectContaining({
          success: true,
          identifierProvided: true,
          accountRecognized: false,
        }),
      );
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe('lockout behavior', () => {
    it('locks the account after three wrong passwords and rejects later attempts', async () => {
      await expect(
        signIn('miguel.rosa.demo', 'wrong-password-1'),
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: 2,
      });

      await expect(
        signIn('miguel.rosa.demo', 'wrong-password-2'),
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: 1,
      });

      await expect(
        signIn('miguel.rosa.demo', 'wrong-password-3'),
      ).rejects.toMatchObject({
        code: 'ACCOUNT_LOCKED',
        isLocked: true,
      });

      expect(getLockoutStatus('miguel.rosa.demo')).toEqual({
        failedAttempts: 3,
        remainingAttempts: 0,
        isLocked: true,
      });

      await expect(
        signIn('miguel.rosa.demo', 'demo-password'),
      ).rejects.toMatchObject({
        code: 'ACCOUNT_LOCKED',
        isLocked: true,
      });
    });

    it('resets failed-attempt and lockout state so valid credentials work again', async () => {
      await expect(
        signIn('miguel.rosa.demo', 'wrong-password-1'),
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });

      await expect(
        signIn('miguel.rosa.demo', 'wrong-password-2'),
      ).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });

      expect(resetLockout('miguel.rosa.demo')).toBe(true);
      expect(getLockoutStatus('miguel.rosa.demo')).toEqual({
        failedAttempts: 0,
        remainingAttempts: 3,
        isLocked: false,
      });

      const session = await signIn('miguel.rosa.demo', 'demo-password');

      expect(session).toEqual(
        expect.objectContaining({
          success: true,
          isAuthenticated: true,
          profileId: 'profile-miguel-rosa',
        }),
      );
    });

    it('reports no reset when the account has no prior lockout state', () => {
      expect(resetLockout('never-seen-user@example.test')).toBe(false);
    });
  });
});