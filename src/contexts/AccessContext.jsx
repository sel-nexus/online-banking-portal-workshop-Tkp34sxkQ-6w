import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import MockAuthService from '../services/MockAuthService';
import {
  createSessionManager,
} from '../services/SessionManager';
import {
  useDemoDispatch,
  useDemoState,
} from '../store/DemoStoreContext';

const AuthenticatedSessionContext = createContext(null);

AuthenticatedSessionContext.displayName = 'AuthenticatedSessionContext';

function getProfileFromState(state) {
  return state?.profile?.data || null;
}

function getSessionFromState(state) {
  return state?.session || {};
}

/**
 * Provides authenticated session access and protected-route state.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Authenticated session context provider.
 */
function AuthenticatedSessionProvider({ children }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const [managerVersion, setManagerVersion] = useState(0);

  const sessionManager = useMemo(
    () =>
      createSessionManager({
        dispatch,
        invalidateOnBackNavigation: false,
        onChange: () => {
          setManagerVersion((version) => version + 1);
        },
        onWarning: () => {
          setManagerVersion((version) => version + 1);
        },
        onExpire: () => {
          setManagerVersion((version) => version + 1);
        },
      }),
    [dispatch],
  );

  useEffect(
    () => () => {
      sessionManager.stop();
    },
    [sessionManager],
  );

  const session = getSessionFromState(state);
  const profile = getProfileFromState(state);
  const managerState = sessionManager.getState();
  const isAuthenticated = session.isAuthenticated === true;
  const isExpired =
    session.status === 'expired' ||
    (session.status === 'anonymous' && managerState.expired === true);
  const idleWarning =
    session.idleWarning === true || managerState.warningShown;
  const protectedRouteStatus = isAuthenticated
    ? 'authenticated'
    : isExpired
      ? 'expired'
      : 'unauthenticated';

  const login = useCallback(
    async (credentials, password) => {
      dispatch({ type: 'session/loginRequest' });

      try {
        const authenticatedSession = await MockAuthService.signIn(
          credentials,
          password,
        );

        dispatch({
          type: 'profile/loadSuccess',
          payload: {
            profile: authenticatedSession.profile,
            profileId: authenticatedSession.profileId,
          },
        });

        dispatch({
          type: 'session/loginSuccess',
          payload: authenticatedSession,
        });

        try {
          sessionManager.start(authenticatedSession);
        } catch {
          // Session state is already authenticated; idle timers are best effort.
        }

        return authenticatedSession;
      } catch (error) {
        dispatch({
          type: 'session/loginFailure',
          payload: {
            error: error?.message || 'Unable to sign in.',
            code: error?.code || 'INVALID_CREDENTIALS',
            failedAttempts: error?.failedAttempts,
            remainingAttempts: error?.remainingAttempts,
            isLocked: error?.isLocked === true,
          },
        });

        throw error;
      }
    },
    [dispatch, sessionManager],
  );

  const logout = useCallback(() => {
    const result = sessionManager.logout();

    dispatch({ type: 'profile/clearProfile' });
    dispatch({ type: 'account/clearSelection' });
    dispatch({ type: 'offer/clearSelection' });

    return result;
  }, [dispatch, sessionManager]);

  const continueSession = useCallback(() => {
    try {
      const continuedSession = sessionManager.continueSession();

      dispatch({
        type: 'session/continueSession',
        payload: {
          ...continuedSession.session,
          expiresAt: continuedSession.expiryAt,
          lastActivityAt: new Date().toISOString(),
        },
      });

      return continuedSession;
    } catch (error) {
      dispatch({
        type: 'session/sessionExpired',
        payload: {
          error: error?.message || 'Your session has expired.',
        },
      });

      throw error;
    }
  }, [dispatch, sessionManager]);

  const refreshSessionActivity = useCallback(
    (event = {}) => sessionManager.handleActivity(event),
    [sessionManager],
  );

  const value = useMemo(
    () => ({
      session,
      profile,
      user: profile,
      isAuthenticated,
      isLoggedIn: isAuthenticated,
      isExpired,
      idleWarning,
      isIdleWarning: idleWarning,
      protectedRouteStatus,
      canAccessProtectedRoutes: isAuthenticated,
      canAccessProtectedRoute: isAuthenticated,
      requiresAuthentication: !isAuthenticated,
      sessionStatus: session.status || protectedRouteStatus,
      expiresAt: session.expiresAt || managerState.expiryAt || null,
      warningAt: managerState.warningAt || session.idleWarningAt || null,
      expiryAt: managerState.expiryAt || session.expiresAt || null,
      remainingWarningTime: managerState.remainingWarningTime,
      remainingExpiryTime: managerState.remainingExpiryTime,
      login,
      signIn: login,
      logout,
      signOut: logout,
      continueSession,
      refreshSessionActivity,
      sessionManager,
      managerVersion,
    }),
    [
      continueSession,
      idleWarning,
      isAuthenticated,
      isExpired,
      login,
      logout,
      managerState.expiryAt,
      managerState.remainingExpiryTime,
      managerState.remainingWarningTime,
      managerState.warningAt,
      managerVersion,
      profile,
      protectedRouteStatus,
      refreshSessionActivity,
      session,
      sessionManager,
    ],
  );

  return (
    <AuthenticatedSessionContext.Provider value={value}>
      {children}
    </AuthenticatedSessionContext.Provider>
  );
}

AuthenticatedSessionProvider.displayName = 'AuthenticatedSessionProvider';

function useAccess() {
  const context = useContext(AuthenticatedSessionContext);

  if (!context) {
    throw new Error(
      'useAccess must be used within an AuthenticatedSessionProvider.',
    );
  }

  return context;
}

const AccessProvider = AuthenticatedSessionProvider;
const AccessContext = AuthenticatedSessionContext;

export {
  AccessContext,
  AccessProvider,
  AuthenticatedSessionContext,
  AuthenticatedSessionProvider,
  useAccess,
};

export default AuthenticatedSessionProvider;