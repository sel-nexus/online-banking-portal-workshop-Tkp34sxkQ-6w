import React from 'react';

const childrenPropType = () => null;

const STATUS_DEFINITIONS = Object.freeze({
  active: Object.freeze({
    label: 'Active',
    icon: '●',
    classes: 'border-success-200 bg-success-50 text-success-700',
  }),
  pending: Object.freeze({
    label: 'Pending',
    icon: '◷',
    classes: 'border-warning-200 bg-warning-50 text-warning-700',
  }),
  declined: Object.freeze({
    label: 'Declined',
    icon: '×',
    classes: 'border-danger-200 bg-danger-50 text-danger-700',
  }),
  success: Object.freeze({
    label: 'Success',
    icon: '✓',
    classes: 'border-success-200 bg-success-50 text-success-700',
  }),
  warning: Object.freeze({
    label: 'Warning',
    icon: '!',
    classes: 'border-warning-200 bg-warning-50 text-warning-700',
  }),
  unavailable: Object.freeze({
    label: 'Unavailable',
    icon: '—',
    classes: 'border-border-strong bg-background-muted text-foreground-muted',
  }),
});

const STATUS_ALIASES = Object.freeze({
  approved: 'success',
  completed: 'success',
  available: 'active',
  processing: 'pending',
  scheduled: 'pending',
  failed: 'declined',
  inactive: 'unavailable',
  unavailable: 'unavailable',
});

const BASE_CLASSES =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4';

function normalizeStatus(status) {
  const normalizedStatus = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
    .replace(/_/g, '');

  return STATUS_DEFINITIONS[normalizedStatus]
    ? normalizedStatus
    : STATUS_ALIASES[normalizedStatus] || 'unavailable';
}

/**
 * Renders a semantic status badge with an icon and visible status label.
 *
 * @param {object} props Component properties.
 * @param {string} props.status Status value.
 * @param {React.ReactNode} props.children Optional custom visible label.
 * @param {string} props.label Optional custom visible label.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Status badge.
 */
function StatusBadge({
  children,
  className = '',
  label,
  status = 'active',
  ...props
}) {
  const normalizedStatus = normalizeStatus(status);
  const definition = STATUS_DEFINITIONS[normalizedStatus];
  const visibleLabel = label || children || definition.label;

  return (
    <span
      {...props}
      aria-label={String(visibleLabel)}
      className={`${BASE_CLASSES} ${definition.classes} ${className}`.trim()}
      data-status={normalizedStatus}
      role="status"
    >
      <span aria-hidden="true" className="font-bold leading-none">
        {definition.icon}
      </span>
      <span>{visibleLabel}</span>
    </span>
  );
}

StatusBadge.displayName = 'StatusBadge';

StatusBadge.propTypes = {
  children: childrenPropType,
  className: () => null,
  label: () => null,
  status: () => null,
};

export default StatusBadge;