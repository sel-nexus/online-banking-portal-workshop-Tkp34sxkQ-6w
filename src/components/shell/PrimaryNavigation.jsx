import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const PRIMARY_NAVIGATION_ITEMS = Object.freeze([
  Object.freeze({
    to: ROUTES.DASHBOARD,
    label: 'Home',
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
    label: 'Promotions & Offers',
  }),
  Object.freeze({
    to: '/support',
    label: 'Help & Support',
  }),
  Object.freeze({
    to: '/contact',
    label: 'Contact Us',
  }),
]);

const BASE_CLASSES = 'hidden lg:block';

const LINK_CLASSES =
  'rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors';

function getLinkClasses(isActive) {
  return `${LINK_CLASSES} ${
    isActive
      ? 'bg-primary-50 text-primary'
      : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
  }`;
}

/**
 * Renders the desktop-only primary navigation for the banking portal.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.navigationItems Navigation link definitions.
 * @param {string} props.className Additional navigation classes.
 * @returns {JSX.Element} Primary navigation links.
 */
function PrimaryNavigation({
  className = '',
  navigationItems = PRIMARY_NAVIGATION_ITEMS,
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className={`${BASE_CLASSES} ${className}`.trim()}
    >
      <div className="flex items-center gap-1">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) => getLinkClasses(isActive)}
            end={item.end}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

PrimaryNavigation.displayName = 'PrimaryNavigation';

PrimaryNavigation.propTypes = {
  className: () => null,
  navigationItems: () => null,
};

export {
  PRIMARY_NAVIGATION_ITEMS,
  PrimaryNavigation,
};

export default PrimaryNavigation;