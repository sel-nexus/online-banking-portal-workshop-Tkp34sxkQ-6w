import React from 'react';
import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { APP_NAME, DEMO_LABELS } from '../../config/constants';
import { NAVIGATION_LABELS } from '../../config/messages';
import { useAccess } from '../../contexts/AccessContext';
import { useCustomerProfile } from '../../contexts/CustomerProfileContext';
import { useDemoDispatch, useDemoState } from '../../store/DemoStoreContext';
import LocalSearch from './LocalSearch';
import NotificationPopover from './NotificationPopover';
import ProfileMenu from './ProfileMenu';

const SUPPORT_ROUTE = '/support';

const NAVIGATION_ITEMS = Object.freeze([
  Object.freeze({
    to: '/home',
    label: 'Home / Overview',
    end: true,
  }),
  Object.freeze({
    to: ROUTES.ACCOUNTS,
    label: 'Accounts',
  }),
  Object.freeze({
    to: '/products',
    label: 'Products',
  }),
  Object.freeze({
    to: '/offers',
    label: 'Promotions and Offers',
  }),
  Object.freeze({
    to: '/support',
    label: 'Help and Support',
  }),
  Object.freeze({
    to: '/contact',
    label: 'Contact Us',
  }),
]);

/**
 * Renders the desktop header per PRD Section 3:
 * BPI BANK, Home / Overview, Accounts, Products, Promotions and Offers,
 * Help and Support, Contact Us, search by account, product, or offer name,
 * notifications, profile (name, masked user ID, logout, facilitator tools),
 * and Chat With Us.
 */
function Header({
  appName = APP_NAME,
  className = '',
  navigationItems = NAVIGATION_ITEMS,
  onChatOpen,
  onLogout,
}) {
  const access = useAccess();
  const { profile: customerProfile } = useCustomerProfile();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const navigate = useNavigate();

  const profile = access.profile || customerProfile;
  const failureSimulation = Boolean(state?.facilitator?.failureSimulation);

  const handleSearchResultSelect = (item, result) => {
    if (!result) {
      return;
    }

    const id = encodeURIComponent(String(result.id));

    if (result.type === 'account') {
      navigate(`/accounts/${id}`);
    } else if (result.type === 'product') {
      navigate(`/products/${id}`);
    } else if (result.type === 'offer') {
      navigate(`/offers/${id}`);
    }
  };

  const handleNotificationSelect = (notification) => {
    if (notification?.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleChatClick = () => {
    dispatch({ type: 'chat/open' });
    onChatOpen?.();
  };

  return (
    <header
      className={`border-b border-border bg-surface shadow-xs ${className}`.trim()}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-2.5">
          <Link
            aria-label={`${appName} home`}
            className="group flex shrink-0 items-center gap-2.5 no-underline"
            to="/home"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-tight text-white shadow-xs transition-transform group-hover:scale-105"
            >
              BPI
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-tight text-primary leading-tight">
                BPI BANK
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle leading-none">
                Online Banking
              </span>
            </div>
          </Link>

          <nav
            aria-label={NAVIGATION_LABELS.mainNavigation}
            className="flex flex-wrap items-center gap-1"
          >
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold no-underline transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-foreground hover:bg-surface-muted hover:text-primary'
                  }`
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-accent-mint"
              />
              Official • 256-bit SSL
            </span>

            <div className="w-52 sm:w-60">
              <LocalSearch
                label="Search by account, product, or offer name"
                onSelect={handleSearchResultSelect}
                placeholder="Search accounts, products, offers"
              />
            </div>

            <NotificationPopover
              onNotificationSelect={handleNotificationSelect}
            />

            <button
              aria-label="Chat With Us"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-xs transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleChatClick}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Chat With Us</span>
            </button>

            <ProfileMenu
              failureSimulation={failureSimulation}
              onLogout={onLogout}
              profile={profile}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

Header.displayName = 'Header';

Header.propTypes = {
  appName: () => null,
  className: () => null,
  navigationItems: () => null,
  notificationCount: () => null,
  onChatOpen: () => null,
  onLogout: () => null,
};

export { NAVIGATION_ITEMS, SUPPORT_ROUTE };

export default Header;
