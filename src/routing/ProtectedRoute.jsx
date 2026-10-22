import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { useAccess } from '../contexts/AccessContext';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks whether an authenticated session contains the minimum required
 * identity information for protected application access.
 *
 * @param {object} session Session state.
 * @param {object} access Access context value.
 * @returns {boolean} Whether the session is valid for protected access.
 */
export function isSessionValid(session, access = {}) {
  if (!isRecord(session) || access.isAuthenticated !== true) {
    return false;
  }

  if (
    session.isAuthenticated !== true ||
    session.status === 'anonymous' ||
    session.status === 'expired' ||
    session.expired === true ||
    access.isExpired === true ||
    access.protectedRouteStatus !== 'authenticated'
  ) {
    return false;
  }

  const profile = access.profile || access.user;
  const hasIdentity = Boolean(
    session.userId ||
      session.profileId ||
      profile?.id ||
      profile?.profileId ||
      profile?.userId,
  );

  return hasIdentity;
}

/**
 * Guards a protected route and redirects invalid sessions to sign in.
 *
 * @param {object} props Component properties.
 * @param {React.ReactNode} props.children Protected route content.
 * @returns {JSX.Element} Protected content or a replacement redirect.
 */
function ProtectedRoute({ children }) {
  const access = useAccess();
  const location = useLocation();

  if (!isSessionValid(access.session, access)) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}

ProtectedRoute.displayName = 'ProtectedRoute';

const childrenPropType = () => null;

ProtectedRoute.propTypes = {
  children: childrenPropType,
};

export default ProtectedRoute;