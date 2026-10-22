import React from 'react';

const childrenPropType = () => null;

const VARIANT_CLASSES = Object.freeze({
  account: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  catalogue: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
  table: 'space-y-3',
  route: 'space-y-5',
  default: 'space-y-4',
});

function normalizeCount(value, fallback = 1) {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? Math.min(12, Math.floor(count)) : fallback;
}

function SkeletonBlock({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-background-muted ${className}`.trim()}
    />
  );
}

SkeletonBlock.displayName = 'SkeletonBlock';

SkeletonBlock.propTypes = {
  className: () => null,
};

/**
 * Renders an accessible loading skeleton for common banking portal loading
 * states.
 *
 * @param {object} props Component properties.
 * @param {'account'|'table'|'catalogue'|'route'|'default'} props.variant Skeleton layout.
 * @param {number} props.rows Number of skeleton rows.
 * @param {number} props.columns Number of skeleton columns.
 * @param {number} props.count Number of repeated cards for card layouts.
 * @param {string} props.label Accessible loading label.
 * @param {React.ReactNode} props.message Visible loading status text.
 * @param {boolean} props.showMessage Whether to render the status text.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Accessible loading skeleton.
 */
function LoadingSkeleton({
  variant = 'default',
  rows = 3,
  columns = 1,
  count,
  label,
  message = 'Loading...',
  showMessage = true,
  className = '',
  ...props
}) {
  const normalizedVariant = VARIANT_CLASSES[variant]
    ? variant
    : 'default';
  const normalizedRows = normalizeCount(rows, 3);
  const normalizedColumns = normalizeCount(columns, 1);
  const cardCount = normalizeCount(count, normalizedVariant === 'account' ? 3 : 3);
  const accessibleLabel = label || String(message || 'Loading...');

  const renderAccountSkeleton = (index) => (
    <div
      className="rounded-xl border border-border bg-surface p-5 shadow-sm"
      key={`account-skeleton-${index}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/5" />
            <SkeletonBlock className="h-3 w-2/5" />
          </div>
        </div>
        <SkeletonBlock className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonBlock className="mt-6 h-8 w-2/3" />
      <div className="mt-5 flex items-center justify-between gap-4">
        <SkeletonBlock className="h-3 w-1/3" />
        <SkeletonBlock className="h-3 w-1/4" />
      </div>
    </div>
  );

  const renderCatalogueSkeleton = (index) => (
    <div
      className="rounded-xl border border-border bg-surface p-5 shadow-sm"
      key={`catalogue-skeleton-${index}`}
    >
      <SkeletonBlock className="h-32 w-full rounded-lg" />
      <div className="mt-5 space-y-3">
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-5/6" />
        <SkeletonBlock className="mt-5 h-9 w-2/5" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="hidden items-center gap-4 border-b border-border bg-surface-muted px-4 py-3 sm:grid sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock className="h-3 w-3/5" key={`table-heading-${index}`} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: normalizedRows }, (_, rowIndex) => (
          <div
            className="grid gap-3 px-4 py-4 sm:grid-cols-4 sm:items-center"
            key={`table-row-${rowIndex}`}
          >
            {Array.from({ length: normalizedColumns === 1 ? 4 : normalizedColumns }, (_, columnIndex) => (
              <SkeletonBlock
                className={`h-4 ${
                  columnIndex === 0 ? 'w-4/5' : 'w-3/5'
                }`}
                key={`table-cell-${rowIndex}-${columnIndex}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderRouteSkeleton = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-2/5" />
        <SkeletonBlock className="h-4 w-3/5" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: normalizedRows }, (_, index) => (
            <div className="space-y-2" key={`route-row-${index}`}>
              <SkeletonBlock className="h-3 w-1/4" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    if (normalizedVariant === 'account') {
      return Array.from({ length: cardCount }, (_, index) =>
        renderAccountSkeleton(index),
      );
    }

    if (normalizedVariant === 'catalogue') {
      return Array.from({ length: cardCount }, (_, index) =>
        renderCatalogueSkeleton(index),
      );
    }

    if (normalizedVariant === 'table') {
      return renderTableSkeleton();
    }

    if (normalizedVariant === 'route') {
      return renderRouteSkeleton();
    }

    return (
      <div className="space-y-4">
        {Array.from({ length: normalizedRows }, (_, rowIndex) => (
          <div
            className={`grid gap-4 ${
              normalizedColumns > 1
                ? `sm:grid-cols-${Math.min(normalizedColumns, 4)}`
                : ''
            }`}
            key={`skeleton-row-${rowIndex}`}
          >
            {Array.from({ length: normalizedColumns }, (_, columnIndex) => (
              <div className="space-y-3" key={`skeleton-item-${rowIndex}-${columnIndex}`}>
                <SkeletonBlock className="h-4 w-2/5" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      {...props}
      aria-busy="true"
      aria-label={accessibleLabel}
      className={`space-y-4 ${className}`.trim()}
      role="status"
    >
      {showMessage ? (
        <p className="text-sm text-foreground-muted">{message}</p>
      ) : null}
      <div className={VARIANT_CLASSES[normalizedVariant]}>
        {renderSkeleton()}
      </div>
    </div>
  );
}

LoadingSkeleton.displayName = 'LoadingSkeleton';

LoadingSkeleton.propTypes = {
  variant: () => null,
  rows: () => null,
  columns: () => null,
  count: () => null,
  label: () => null,
  message: childrenPropType,
  showMessage: () => null,
  className: () => null,
};

export { SkeletonBlock };

export default LoadingSkeleton;