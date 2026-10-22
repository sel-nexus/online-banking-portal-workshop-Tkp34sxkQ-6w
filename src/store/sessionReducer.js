const SESSION_ACTIONS = Object.freeze({
  LOGIN_REQUEST: 'session/loginRequest',
  LOGIN_SUCCESS: 'session/loginSuccess',
  LOGIN_FAILURE: 'session/loginFailure',
  LOGOUT: 'session/logout',
  SET_REMEMBERED_USER_ID: 'session/setRememberedUserId',
  CLEAR_REMEMBERED_USER_ID: 'session/clearRememberedUserId',
  LOCK: 'session/lock',
  UNLOCK: 'session/unlock',
  SWITCH_PROFILE: 'session/switchProfile',
  IDLE_WARNING: 'session/idleWarning',
  CLEAR_IDLE_WARNING: 'session/clearIdleWarning',
  SESSION_EXPIRED: 'session/sessionExpired',
  CONTINUE_SESSION: 'session/continueSession',
  RESET: 'session/reset',
});

const INITIAL_SESSION_STATE = Object.freeze({
  status: 'anonymous',
  isAuthenticated: false,
  isLoading: false,
  userId: null,
  profileId: null,
  expiresAt: null,
  lastActivityAt: null,
  error: null,
  rememberedUserId: null,
  failedAttempts: 0,
  lockoutUntil: null,
  isLocked: false,
  idleWarning: false,
  idleWarningAt: null,
});

function getPayload(action) {
  return action && action.payload && typeof action.payload === 'object'
    ? action.payload
    : {};
}

function getValue(payload, action, key, fallback = null) {
  if (Object.prototype.hasOwnProperty.call(payload, key)) {
    return payload[key];
  }

  if (action && Object.prototype.hasOwnProperty.call(action, key)) {
    return action[key];
  }

  return fallback;
}

function getTimestamp(payload, action) {
  return (
    getValue(payload, action, 'timestamp') ||
    getValue(payload, action, 'at') ||
    new Date().toISOString()
  );
}

function normalizeActionType(type) {
  return String(type || '')
    .trim()
    .replace(/^[^:/]+[:/]/, '')
    .replace(/[-/\s]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

function resetSessionState(rememberedUserId = null) {
  return {
    ...INITIAL_SESSION_STATE,
    rememberedUserId,
  };
}

function getSessionData(payload, action) {
  const session =
    payload.session && typeof payload.session === 'object'
      ? payload.session
      : action?.session && typeof action.session === 'object'
        ? action.session
        : payload;

  return {
    userId: getValue(session, action, 'userId'),
    profileId: getValue(session, action, 'profileId'),
    expiresAt: getValue(session, action, 'expiresAt'),
    lastActivityAt:
      getValue(session, action, 'lastActivityAt') || getTimestamp(payload, action),
  };
}

/**
 * Reduces session state for authentication and session lifecycle actions.
 *
 * @param {object} state Current session state.
 * @param {object} action Session action.
 * @returns {object} Updated session state.
 */
export function sessionReducer(state = INITIAL_SESSION_STATE, action = {}) {
  const currentState = state || INITIAL_SESSION_STATE;
  const payload = getPayload(action);
  const actionType = normalizeActionType(action.type);
  const data = getSessionData(payload, action);

  switch (actionType) {
    case 'LOGIN_REQUEST':
    case 'SIGN_IN_REQUEST':
    case 'AUTH_LOGIN_REQUEST':
      return {
        ...currentState,
        status: 'loading',
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
    case 'SIGN_IN_SUCCESS':
    case 'AUTH_LOGIN_SUCCESS': {
      const rememberMe = Boolean(
        getValue(payload, action, 'rememberMe', false),
      );
      const userId = data.userId || currentState.rememberedUserId;

      return {
        ...currentState,
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        userId,
        profileId: data.profileId,
        expiresAt: data.expiresAt,
        lastActivityAt: data.lastActivityAt,
        error: null,
        rememberedUserId: rememberMe ? userId : currentState.rememberedUserId,
        failedAttempts: 0,
        lockoutUntil: null,
        isLocked: false,
        idleWarning: false,
        idleWarningAt: null,
      };
    }

    case 'LOGIN_FAILURE':
    case 'SIGN_IN_FAILURE':
    case 'AUTH_LOGIN_FAILURE': {
      const failedAttempts =
        Number(getValue(payload, action, 'failedAttempts')) ||
        currentState.failedAttempts + 1;
      const lockoutUntil = getValue(payload, action, 'lockoutUntil');
      const isLocked =
        Boolean(getValue(payload, action, 'isLocked', false)) ||
        Boolean(lockoutUntil);

      return {
        ...currentState,
        status: isLocked ? 'locked' : 'anonymous',
        isAuthenticated: false,
        isLoading: false,
        error:
          getValue(payload, action, 'error') ||
          getValue(payload, action, 'message') ||
          'Unable to sign in.',
        failedAttempts,
        lockoutUntil,
        isLocked,
      };
    }

    case 'LOGOUT':
    case 'SIGN_OUT':
    case 'SESSION_LOGOUT':
      return resetSessionState(currentState.rememberedUserId);

    case 'SET_REMEMBERED_USER_ID':
    case 'REMEMBER_USER_ID':
    case 'SET_REMEMBERED_ID':
      return {
        ...currentState,
        rememberedUserId:
          getValue(payload, action, 'userId') ||
          getValue(payload, action, 'rememberedUserId'),
      };

    case 'CLEAR_REMEMBERED_USER_ID':
    case 'FORGET_USER_ID':
    case 'CLEAR_REMEMBERED_ID':
      return {
        ...currentState,
        rememberedUserId: null,
      };

    case 'LOCK':
    case 'LOCK_SESSION':
    case 'SESSION_LOCKED':
      return {
        ...currentState,
        status: 'locked',
        isAuthenticated: false,
        isLoading: false,
        isLocked: true,
        lockoutUntil: getValue(payload, action, 'lockoutUntil'),
        error: getValue(payload, action, 'error'),
      };

    case 'UNLOCK':
    case 'UNLOCK_SESSION':
    case 'SESSION_UNLOCKED':
      return {
        ...currentState,
        status: currentState.userId ? 'authenticated' : 'anonymous',
        isAuthenticated: Boolean(currentState.userId),
        isLocked: false,
        lockoutUntil: null,
        error: null,
      };

    case 'SWITCH_PROFILE':
    case 'PROFILE_SWITCH':
    case 'SWITCH_USER_PROFILE':
      return {
        ...currentState,
        profileId:
          getValue(payload, action, 'profileId') ||
          getValue(payload, action, 'id'),
        userId: getValue(payload, action, 'userId', currentState.userId),
        lastActivityAt: getTimestamp(payload, action),
        error: null,
      };

    case 'IDLE_WARNING':
    case 'SHOW_IDLE_WARNING':
    case 'SESSION_IDLE_WARNING':
      return {
        ...currentState,
        idleWarning: true,
        idleWarningAt:
          getValue(payload, action, 'idleWarningAt') ||
          getValue(payload, action, 'warningAt') ||
          getTimestamp(payload, action),
        error: null,
      };

    case 'CLEAR_IDLE_WARNING':
    case 'HIDE_IDLE_WARNING':
      return {
        ...currentState,
        idleWarning: false,
        idleWarningAt: null,
      };

    case 'SESSION_EXPIRED':
    case 'EXPIRE_SESSION':
    case 'SESSION_EXPIRY':
      return {
        ...currentState,
        status: 'expired',
        isAuthenticated: false,
        isLoading: false,
        expiresAt: null,
        idleWarning: false,
        idleWarningAt: null,
        error:
          getValue(payload, action, 'error') ||
          getValue(payload, action, 'message') ||
          'Your session has expired.',
      };

    case 'CONTINUE_SESSION':
    case 'EXTEND_SESSION':
    case 'SESSION_CONTINUED':
      return {
        ...currentState,
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
        expiresAt: getValue(payload, action, 'expiresAt', currentState.expiresAt),
        lastActivityAt: data.lastActivityAt,
        idleWarning: false,
        idleWarningAt: null,
        error: null,
      };

    case 'RESET':
    case 'RESET_SESSION':
    case 'SESSION_RESET':
      return resetSessionState(
        getValue(payload, action, 'rememberedUserId', null),
      );

    default:
      return currentState;
  }
}

export { INITIAL_SESSION_STATE, SESSION_ACTIONS };

export default sessionReducer;