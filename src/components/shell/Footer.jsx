import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../config/constants';
import { SIMULATION_MESSAGES } from '../../config/messages';

const SUPPORT_LINKS = Object.freeze([
  Object.freeze({
    to: '/support',
    label: 'Help & Support',
  }),
  Object.freeze({
    to: '/contact',
    label: 'Contact us',
  }),
]);

/**
 * Renders the application footer with workshop-only disclosure, support
 * navigation, and a clear boundary around simulated functionality.
 *
 * @param {object} props Component properties.
 * @param {string} props.appName Application name displayed in the footer.
 * @param {object[]} props.supportLinks Support navigation links.
 * @param {string} props.className Additional footer classes.
 * @returns {JSX.Element} Application footer.
 */
function Footer({
  appName = APP_NAME,
  className = '',
  supportLinks = SUPPORT_LINKS,
}) {
  return (
    <footer
      aria-label="Application footer"
      className={`border-t border-border bg-surface ${className}`.trim()}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-foreground">{appName}</p>
            <p className="mt-2 text-sm text-foreground-muted">
              Bank of the Philippine Islands (BPI) is regulated by the Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph).
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              Deposits are insured by the Philippine Deposit Insurance Corporation (PDIC) up to PHP 500,000 per depositor.
            </p>
          </div>

          <nav aria-label="Support navigation">
            <p className="text-sm font-semibold text-foreground">Support</p>
            <ul className="mt-2 space-y-2">
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    className="text-sm text-primary hover:text-primary-700 hover:underline"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-foreground-subtle">
          <p>
            © 2026 Bank of the Philippine Islands. All rights reserved.
          </p>
          <p>
            BPI Technical Workshop Environment • Synthetic demonstration data
          </p>
        </div>
      </div>
    </footer>
  );
}

Footer.displayName = 'Footer';

const childrenPropType = () => null;

Footer.propTypes = {
  appName: () => null,
  className: () => null,
  supportLinks: childrenPropType,
};

export { SUPPORT_LINKS };

export default Footer;