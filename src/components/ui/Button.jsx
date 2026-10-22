import React from 'react';

const childrenPropType = () => null;

const VARIANT_CLASSES = Object.freeze({
  primary:
    'bg-primary text-white shadow-sm hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary:
    'border border-border-strong bg-surface text-foreground hover:bg-background-muted focus-visible:ring-primary-500',
  text: 'bg-transparent text-primary hover:bg-primary-50 hover:underline focus-visible:ring-primary-500',
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger-700 focus-visible:ring-danger-500',
});

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

function Button({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  loading = false,
  loadingText = 'Loading...',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const variantClasses =
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const widthClasses = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={`${BASE_CLASSES} ${variantClasses} ${widthClasses} ${className}`.trim()}
      disabled={isDisabled}
      type={type}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

Button.displayName = 'Button';

Button.propTypes = {
  children: childrenPropType,
  className: () => null,
  disabled: () => null,
  fullWidth: () => null,
  loading: () => null,
  loadingText: () => null,
  onClick: () => null,
  type: () => null,
  variant: () => null,
};

export default Button;