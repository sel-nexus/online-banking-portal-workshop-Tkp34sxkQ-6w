import { AUTH_MESSAGES, VALIDATION_MESSAGES } from '../config/messages';
import { PROFILES } from '../fixtures/profiles';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const MAX_FAILED_ATTEMPTS = 3;
const DEFAULT_DEMO_PASSWORDS = Object.freeze([
  'demo-only',
  'demo-password',
  'DemoPassword123!',
  'DemoPassword123',
  'demo1234',
]);

const REGISTERED_USERS_KEY = 'online-banking-portal:v1:registered-customers';

const recoveryMessage =
  'If this were production, recovery instructions would be sent. Nothing was sent.';

const lockoutMessage =
  'Your account has been locked after three unsuccessful sign-in attempts. Use Reset to clear the simulated lock.';

const attemptsMessage = (remainingAttempts) =>
  `The User ID or password you entered is incorrect. You have ${remainingAttempts} attempt${
    remainingAttempts === 1 ? '' : 's'
  } remaining.`;

const accountStates = new Map();

export function getRegisteredUsers() {
  const users = safeGetItem(REGISTERED_USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function registerCustomer({
  userId,
  password,
  accountNumber = '•••• 4821',
  accountType = 'Deposit account',
  dateOfBirth,
}) {
  const normalizedUserId = normalizeIdentifier(userId);
  if (!normalizedUserId) {
    throw new Error('User ID is required.');
  }

  const existingUsers = getRegisteredUsers();
  const baseProfile = PROFILES[0] || {};
  const registeredProfile = {
    ...baseProfile,
    id: `profile-${normalizedUserId}`,
    userId: normalizedUserId,
    firstName: String(userId).trim(),
    fullName: String(userId).trim(),
    greeting: `Magandang umaga, ${String(userId).trim()}`,
    role: 'BPI Online Customer',
    accountNumber,
    accountType,
    dateOfBirth,
    registeredPassword: password,
    registeredAt: new Date().toISOString(),
  };

  const existingIndex = existingUsers.findIndex(
    (u) => normalizeIdentifier(u.userId) === normalizedUserId,
  );

  let updatedUsers;
  if (existingIndex >= 0) {
    updatedUsers = [...existingUsers];
    updatedUsers[existingIndex] = registeredProfile;
  } else {
    updatedUsers = [...existingUsers, registeredProfile];
  }

  safeSetItem(REGISTERED_USERS_KEY, updatedUsers);
  return registeredProfile;
}

function normalizeIdentifier(identifier) {
  return String(identifier ?? '')
    .trim()
    .toLowerCase();
}

function getProfileIdentifier(profile) {
  return normalizeIdentifier(
    profile?.credentials?.username ||
      profile?.demoCredentialMetadata?.username ||
      profile?.email ||
      profile?.id ||
      profile?.userId,
  );
}

function findProfile(identifier) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  const standardProfile = PROFILES.find((profile) => {
    const identifiers = [
      profile.id,
      profile.userId,
      profile.email,
      profile.firstName,
      profile.credentials?.username,
      profile.credentials?.legacyUsername,
      profile.demoCredentialMetadata?.username,
      profile.demoCredentialMetadata?.legacyUsername,
    ];

    return identifiers.some(
      (candidate) => normalizeIdentifier(candidate) === normalizedIdentifier,
    );
  });

  if (standardProfile) {
    return standardProfile;
  }

  const registered = getRegisteredUsers().find(
    (u) =>
      normalizeIdentifier(u.userId) === normalizedIdentifier ||
      normalizeIdentifier(u.id) === normalizedIdentifier,
  );

  return registered || null;
}

function getStateKey(identifier, profile) {
  return (
    getProfileIdentifier(profile) ||
    normalizeIdentifier(identifier) ||
    'unknown-user'
  );
}

function getAccountState(identifier, profile) {
  const key = getStateKey(identifier, profile);

  if (!accountStates.has(key)) {
    accountStates.set(key, {
      failedAttempts: 0,
      isLocked: false,
      lockedAt: null,
    });
  }

  return accountStates.get(key);
}

function normalizeCredentials(credentials, password) {
  if (credentials && typeof credentials === 'object') {
    return {
      identifier:
        credentials.identifier ||
        credentials.username ||
        credentials.email ||
        credentials.userId,
      password: credentials.password,
      rememberMe: credentials.rememberMe === true,
    };
  }

  return {
    identifier: credentials,
    password,
    rememberMe: false,
  };
}

function isAcceptedDemoPassword(password, profile = null) {
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }

  if (profile?.registeredPassword && profile.registeredPassword === password) {
    return true;
  }

  return DEFAULT_DEMO_PASSWORDS.includes(password);
}

function createAuthError(message, code, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function getFailureMessage(state) {
  const remainingAttempts = MAX_FAILED_ATTEMPTS - state.failedAttempts;

  return remainingAttempts > 0
    ? attemptsMessage(remainingAttempts)
    : lockoutMessage;
}

/**
 * Evaluates demonstration credentials without persisting a password.
 *
 * @param {string|object} credentials Username, email, or credential object.
 * @param {string} password Demonstration password.
 * @returns {{valid: boolean, profile: object|null, reason: string}} Evaluation result.
 */
export function evaluateCredentials(credentials, password) {
  const normalizedCredentials = normalizeCredentials(credentials, password);
  const profile = findProfile(normalizedCredentials.identifier);
  const state = getAccountState(normalizedCredentials.identifier, profile);

  if (state.isLocked) {
    return {
      valid: false,
      profile: null,
      reason: 'locked',
    };
  }

  const valid =
    Boolean(profile) &&
    isAcceptedDemoPassword(normalizedCredentials.password, profile);

  return {
    valid,
    profile: valid ? profile : null,
    reason: valid ? 'valid' : 'invalid',
  };
}

/**
 * Signs in to the local demonstration account.
 *
 * @param {string|object} credentials Username, email, or credential object.
 * @param {string} password Demonstration password.
 * @returns {Promise<object>} Simulated authenticated session.
 */
export async function signIn(credentials, password) {
  const normalizedCredentials = normalizeCredentials(credentials, password);
  const profile = findProfile(normalizedCredentials.identifier);
  const state = getAccountState(normalizedCredentials.identifier, profile);

  if (state.isLocked) {
    throw createAuthError(lockoutMessage, 'ACCOUNT_LOCKED', {
      failedAttempts: state.failedAttempts,
      isLocked: true,
      recoveryMessage,
    });
  }

  const evaluation = evaluateCredentials(
    normalizedCredentials,
    normalizedCredentials.password,
  );

  if (!evaluation.valid) {
    state.failedAttempts += 1;

    if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      state.isLocked = true;
      state.lockedAt = new Date().toISOString();

      throw createAuthError(lockoutMessage, 'ACCOUNT_LOCKED', {
        failedAttempts: state.failedAttempts,
        isLocked: true,
        recoveryMessage,
      });
    }

    throw createAuthError(
      getFailureMessage(state) || AUTH_MESSAGES.invalidCredentials,
      'INVALID_CREDENTIALS',
      {
        failedAttempts: state.failedAttempts,
        remainingAttempts: MAX_FAILED_ATTEMPTS - state.failedAttempts,
        isLocked: false,
      },
    );
  }

  state.failedAttempts = 0;
  state.isLocked = false;
  state.lockedAt = null;

  return {
    success: true,
    isAuthenticated: true,
    userId: profile.userId || profile.id,
    profileId: profile.id,
    profile,
    rememberMe: normalizedCredentials.rememberMe,
    expiresAt: null,
    lastActivityAt: new Date().toISOString(),
  };
}

/**
 * Returns a privacy-safe recovery message for a sign-in failure.
 *
 * @returns {string} Recovery guidance.
 */
export function getRecoveryMessage() {
  return recoveryMessage;
}

/**
 * Requests simulated account recovery without revealing account existence.
 *
 * @param {string} identifier Username or email address.
 * @returns {Promise<object>} Generic recovery response.
 */
export async function requestRecovery(identifier) {
  const profile = findProfile(identifier);

  return {
    success: true,
    message: recoveryMessage,
    identifierProvided: Boolean(String(identifier ?? '').trim()),
    accountRecognized: Boolean(profile),
  };
}

/**
 * Clears the local lockout state for a demonstration account.
 *
 * @param {string} identifier Username, email, or profile identifier.
 * @returns {boolean} Whether a lockout state was cleared.
 */
export function resetLockout(identifier) {
  if (!identifier) {
    accountStates.clear();
    return true;
  }

  const profile = findProfile(identifier);
  const key = getStateKey(identifier, profile);
  const state = accountStates.get(key);

  if (!state) {
    return false;
  }

  state.failedAttempts = 0;
  state.isLocked = false;
  state.lockedAt = null;
  return true;
}

export function resetAllLockouts() {
  accountStates.clear();
  return true;
}

/**
 * Returns the current local lockout status for a demonstration account.
 *
 * @param {string} identifier Username, email, or profile identifier.
 * @returns {{failedAttempts: number, remainingAttempts: number, isLocked: boolean}} Lockout status.
 */
export function getLockoutStatus(identifier) {
  const profile = findProfile(identifier);
  const state = getAccountState(identifier, profile);

  return {
    failedAttempts: state.failedAttempts,
    remainingAttempts: Math.max(
      0,
      MAX_FAILED_ATTEMPTS - state.failedAttempts,
    ),
    isLocked: state.isLocked,
  };
}

export const mockAuth = Object.freeze({
  signIn,
  evaluateCredentials,
  requestRecovery,
  getRecoveryMessage,
  resetLockout,
  resetAllLockouts,
  getLockoutStatus,
  registerCustomer,
  getRegisteredUsers,
  MAX_FAILED_ATTEMPTS,
  INVALID_CREDENTIALS_MESSAGE: AUTH_MESSAGES.invalidCredentials,
  REQUIRED_MESSAGE: VALIDATION_MESSAGES.required,
});

export const MockAuthService = mockAuth;

export default mockAuth;