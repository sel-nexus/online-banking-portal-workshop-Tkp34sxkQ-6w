import React, { useId } from 'react';

const childrenPropType = () => null;

const VARIANT_DEFINITIONS = Object.freeze({
  info: Object.freeze({
    icon: 'i',
    classes: 'border-info-200 bg-info-50 text-info-700',
  }),
  success: Object.freeze({
    icon: '✓',
    classes: 'border-success-200 bg-success-50 text-success-700',
  }),
  warning: Object.freeze({
    icon: '!',
    classes: 'border-warning-200 bg-warning-50 text-warning-700',
  }),
  error: Object.freeze({
    icon: '!',
    classes: 'border-danger-200 bg-danger-50 text-danger-700',
  }),
});

const VARIANT_ALIASES = Object.freeze({
  danger: 'error',
  failure: 'error',
  notice: 'info',
  success: 'success',
  warning: 'warning',
});

const BASE_CLASSES =
  'flex items-start gap-3 rounded-lg border p-4 text-sm shadow-sm';

function normalizeVariant(variant) {
  const normalizedVariant = String(variant ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '');

  if (VARIANT_DEFINITIONS[normalizedVariant]) {
    return normalizedVariant;
  }

  return VARIANT_ALIASES[normalizedVariant] || 'info';
}

/**
 * Renders an accessible feedback alert.
 *
 * The visible message remains available independently of the decorative icon.
 * Alerts use live-region semantics so updates are announced by assistive
 * technology.
 *
 * @param {object} props Component properties.
 * @param {'info'|'success'|'warning'|'error'} props.variant Alert visual variant.
 * @param {React.ReactNode} props.title Optional alert heading.
 * @param {React.ReactNode} props.message Alert message.
 * @param {React.ReactNode} props.description Supporting alert text.
 * @param {React.ReactNode} props.children Additional alert content.
 * @param {React.ReactNode} props.icon Optional decorative icon.
 * @param {boolean} props.dismissible Whether to show a dismiss button.
 * @param {Function} props.onDismiss Dismiss callback.
 * @param {string} props.dismissLabel Accessible dismiss button label.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Accessible feedback alert.
 */
function Alert({
  children,
  className = '',
  description,
  dismissLabel = 'Dismiss alert',
  dismissible = false,
  icon,
  message,
  onDismiss,
  role = 'alert',
  title,
  variant = 'info',
  ...props
}) {
  const headingId = useId();
  const normalizedVariant = normalizeVariant(variant);
  const definition = VARIANT_DEFINITIONS[normalizedVariant];
  const resolvedIcon = icon === undefined ? definition.icon : icon;
  const hasTitle = Boolean(title);
  const hasContent = Boolean(message || description || children);
  const labelledBy = hasTitle ? headingId : undefined;

  return (
    <div
      {...props}
      aria-atomic="true"
      aria-labelledby={labelledBy}
      aria-live={role === 'status' ? 'polite' : 'assertive'}
      className={`${BASE_CLASSES} ${definition.classes} ${className}`.trim()}
      role={role}
    >
      {resolvedIcon ? (
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 font-bold"
        >
          {resolvedIcon}
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        {hasTitle ? (
          <h2 className="font-semibold" id={headingId}>
            {title}
          </h2>
        ) : null}

        {message ? (
          <p className={hasTitle ? 'mt-1' : ''}>{message}</p>
        ) : null}

        {description ? (
          <p className={`${hasTitle || message ? 'mt-1' : ''} opacity-90`.trim()}>
            {description}
          </p>
        ) : null}

        {children ? (
          <div className={`${hasContent ? 'mt-2' : ''}`.trim()}>{children}</div>
        ) : null}
      </div>

      {dismissible && onDismiss ? (
        <button
          aria-label={dismissLabel}
          className="shrink-0 rounded-md p-1 font-semibold transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
          onClick={onDismiss}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  );
}

Alert.displayName = 'Alert';

Alert.propTypes = {
  children: childrenPropType,
  className: () => null,
  description: childrenPropType,
  dismissLabel: () => null,
  dismissible: () => null,
  icon: childrenPropType,
  message: childrenPropType,
  onDismiss: () => null,
  role: () => null,
  title: childrenPropType,
  variant: () => null,
};

export { VARIANT_DEFINITIONS, normalizeVariant };

export default Alert;