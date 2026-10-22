import React from 'react';

const childrenPropType = () => null;

const LIVE_REGION_DEFINITIONS = Object.freeze({
  polite: Object.freeze({
    'aria-live': 'polite',
    role: 'status',
  }),
  assertive: Object.freeze({
    'aria-live': 'assertive',
    role: 'alert',
  }),
});

const BASE_CLASSES = 'sr-only';

function normalizePoliteness(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase();

  return normalizedValue === 'assertive' ? 'assertive' : 'polite';
}

/**
 * Renders a visually hidden live region for accessible state changes and
 * announcements.
 *
 * @param {object} props Component properties.
 * @param {React.ReactNode} props.children Announcement content.
 * @param {React.ReactNode} props.message Announcement message.
 * @param {'polite'|'assertive'} props.politeness Announcement urgency.
 * @param {'polite'|'assertive'} props.priority Alias for politeness.
 * @param {'polite'|'assertive'} props.ariaLive Explicit aria-live value.
 * @param {string} props.role Optional live-region role.
 * @param {boolean|string} props.atomic Whether the region should be announced as a whole.
 * @param {string} props.relevant Changes relevant to assistive technology.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Visually hidden live region.
 */
function LiveRegion({
  ariaLive,
  atomic = true,
  children,
  className = '',
  message,
  politeness,
  priority,
  relevant = 'additions text',
  role,
  ...props
}) {
  const normalizedPoliteness = normalizePoliteness(
    politeness || priority || ariaLive,
  );
  const definition = LIVE_REGION_DEFINITIONS[normalizedPoliteness];
  const content = children !== undefined ? children : message;

  return (
    <div
      {...props}
      aria-atomic={atomic}
      aria-live={ariaLive || definition['aria-live']}
      aria-relevant={relevant}
      className={`${BASE_CLASSES} ${className}`.trim()}
      role={role || definition.role}
    >
      {content}
    </div>
  );
}

LiveRegion.displayName = 'LiveRegion';

LiveRegion.propTypes = {
  ariaLive: () => null,
  atomic: () => null,
  children: childrenPropType,
  className: () => null,
  message: childrenPropType,
  politeness: () => null,
  priority: () => null,
  relevant: () => null,
  role: () => null,
};

export { LIVE_REGION_DEFINITIONS, normalizePoliteness };

export default LiveRegion;