import React, {
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import LiveRegion from '../accessibility/LiveRegion';

const childrenPropType = () => null;

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  category: 'all',
  type: 'all',
  status: 'all',
});

const DEFAULT_CATEGORY_OPTIONS = Object.freeze([
  { value: 'all', label: 'All categories' },
]);

const DEFAULT_TYPE_OPTIONS = Object.freeze([
  { value: 'all', label: 'All types' },
]);

const DEFAULT_STATUS_OPTIONS = Object.freeze([
  { value: 'all', label: 'All statuses' },
]);

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeOption(option) {
  if (typeof option === 'string' || typeof option === 'number') {
    return {
      value: String(option),
      label: String(option),
    };
  }

  return {
    value: String(option?.value ?? option?.id ?? ''),
    label: String(option?.label ?? option?.name ?? option?.value ?? ''),
  };
}

function normalizeOptions(options, fallback) {
  const source = Array.isArray(options) && options.length
    ? options
    : fallback;

  return source
    .map(normalizeOption)
    .filter((option) => option.value && option.label);
}

function normalizeFilters(value = {}) {
  return {
    search: normalizeText(
      value.search ?? value.query ?? value.keyword,
    ),
    category: normalizeText(value.category || 'all').toLowerCase(),
    type: normalizeText(value.type || 'all').toLowerCase(),
    status: normalizeText(value.status || 'all').toLowerCase(),
  };
}

function getInitialFilters(props) {
  return normalizeFilters({
    ...(props.filters || {}),
    search: props.search ?? props.query ?? props.filters?.search,
    category: props.category ?? props.filters?.category,
    type: props.type ?? props.filters?.type,
    status: props.status ?? props.filters?.status,
  });
}

function getOptionLabel(options, value) {
  return (
    options.find((option) => option.value === String(value))?.label ||
    String(value)
  );
}

function getFilterLabel(key) {
  const labels = {
    search: 'Search',
    category: 'Category',
    type: 'Type',
    status: 'Status',
  };

  return labels[key] || key;
}

function getSelectedFilters(
  filters,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  statusOptions = DEFAULT_STATUS_OPTIONS,
) {
  return Object.entries(filters)
    .filter(([, value]) => value !== '' && value !== 'all')
    .map(([key, value]) => ({
      key,
      value,
      label:
        key === 'category'
          ? getOptionLabel(categoryOptions, value)
          : key === 'type'
            ? getOptionLabel(typeOptions, value)
            : key === 'status'
              ? getOptionLabel(statusOptions, value)
              : value,
    }));
}

/**
 * Renders shared search and filtering controls for product and offer
 * catalogues.
 *
 * @param {object} props Component properties.
 * @param {object} props.filters Controlled catalogue filters.
 * @param {string} props.search Search query.
 * @param {string} props.query Alias for search.
 * @param {string} props.category Selected category.
 * @param {string} props.type Selected catalogue type.
 * @param {string} props.status Selected status.
 * @param {object[]} props.categoryOptions Category choices.
 * @param {object[]} props.typeOptions Type choices.
 * @param {object[]} props.statusOptions Status choices.
 * @param {Function} props.onChange Filter-change callback.
 * @param {Function} props.onFiltersChange Alias for onChange.
 * @param {Function} props.onReset Reset callback.
 * @param {boolean} props.showSelected Whether to display selected-filter feedback.
 * @param {string} props.searchLabel Accessible search label.
 * @param {string} props.searchPlaceholder Search input placeholder.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Catalogue filter controls.
 */
function CatalogueFilters({
  category,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  className = '',
  filters,
  id,
  onChange,
  onFiltersChange,
  onReset,
  query,
  search,
  searchLabel = 'Search products and offers',
  searchPlaceholder = 'Search products and offers',
  showSelected = true,
  status,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  type,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `catalogue-filters-${generatedId}`;
  const isControlled = filters !== undefined;
  const [localFilters, setLocalFilters] = useState(() =>
    getInitialFilters({
      category,
      filters,
      query,
      search,
      status,
      type,
    }),
  );

  const resolvedFilters = useMemo(
    () =>
      isControlled
        ? getInitialFilters({
            category,
            filters,
            query,
            search,
            status,
            type,
          })
        : localFilters,
    [category, filters, isControlled, localFilters, query, search, status, type],
  );

  const normalizedCategoryOptions = useMemo(
    () => normalizeOptions(categoryOptions, DEFAULT_CATEGORY_OPTIONS),
    [categoryOptions],
  );
  const normalizedTypeOptions = useMemo(
    () => normalizeOptions(typeOptions, DEFAULT_TYPE_OPTIONS),
    [typeOptions],
  );
  const normalizedStatusOptions = useMemo(
    () => normalizeOptions(statusOptions, DEFAULT_STATUS_OPTIONS),
    [statusOptions],
  );

  const emitFilters = (nextFilters) => {
    if (!isControlled) {
      setLocalFilters(nextFilters);
    }

    onChange?.(nextFilters);
    onFiltersChange?.(nextFilters);
  };

  const handleFilterChange = (key, value) => {
    emitFilters({
      ...resolvedFilters,
      [key]: value,
    });
  };

  const handleRemoveFilter = (key) => {
    handleFilterChange(
      key,
      key === 'search' ? '' : 'all',
    );
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS };

    if (!isControlled) {
      setLocalFilters(resetFilters);
    }

    onChange?.(resetFilters);
    onFiltersChange?.(resetFilters);
    onReset?.();
  };

  const selectedFilters = getSelectedFilters(
    resolvedFilters,
    normalizedCategoryOptions,
    normalizedTypeOptions,
    normalizedStatusOptions,
  );
  const feedbackMessage = selectedFilters.length
    ? `${selectedFilters.length} catalogue filter${
        selectedFilters.length === 1 ? '' : 's'
      } selected.`
    : 'No catalogue filters selected.';

  return (
    <section
      {...props}
      aria-label="Catalogue filters"
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2">
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-search`}
            >
              {searchLabel}
            </label>
            <input
              aria-label={searchLabel}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-search`}
              onChange={(event) =>
                handleFilterChange('search', event.target.value)
              }
              placeholder={searchPlaceholder}
              type="search"
              value={resolvedFilters.search}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-category`}
            >
              Category
            </label>
            <select
              aria-label="Catalogue category"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-category`}
              onChange={(event) =>
                handleFilterChange('category', event.target.value)
              }
              value={resolvedFilters.category}
            >
              {normalizedCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-type`}
            >
              Type
            </label>
            <select
              aria-label="Catalogue type"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-type`}
              onChange={(event) =>
                handleFilterChange('type', event.target.value)
              }
              value={resolvedFilters.type}
            >
              {normalizedTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-status`}
            >
              Status
            </label>
            <select
              aria-label="Catalogue status"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-status`}
              onChange={(event) =>
                handleFilterChange('status', event.target.value)
              }
              value={resolvedFilters.status}
            >
              {normalizedStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button
            className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={handleReset}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </form>

      <LiveRegion message={feedbackMessage} />

      {showSelected && selectedFilters.length ? (
        <div
          aria-label="Selected catalogue filters"
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4"
        >
          <span className="text-sm font-medium text-foreground">
            Active filters:
          </span>

          {selectedFilters.map((filter) => (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
              key={filter.key}
            >
              <span>
                {getFilterLabel(filter.key)}: {filter.label}
              </span>
              <button
                aria-label={`Remove ${getFilterLabel(filter.key)} filter`}
                className="rounded-full px-1 font-semibold hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={() => handleRemoveFilter(filter.key)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

CatalogueFilters.displayName = 'CatalogueFilters';

CatalogueFilters.propTypes = {
  category: () => null,
  categoryOptions: () => null,
  className: () => null,
  filters: () => null,
  id: () => null,
  onChange: () => null,
  onFiltersChange: () => null,
  onReset: () => null,
  query: () => null,
  search: () => null,
  searchLabel: () => null,
  searchPlaceholder: () => null,
  showSelected: () => null,
  status: () => null,
  statusOptions: () => null,
  type: () => null,
  typeOptions: () => null,
};

export {
  DEFAULT_FILTERS,
  DEFAULT_CATEGORY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
  DEFAULT_TYPE_OPTIONS,
  getInitialFilters,
  getSelectedFilters,
  normalizeFilters,
  normalizeOption,
  normalizeOptions,
};

export default CatalogueFilters;