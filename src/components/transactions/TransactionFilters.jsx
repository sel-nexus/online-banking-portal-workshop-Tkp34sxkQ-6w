import React, {
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

const childrenPropType = () => null;

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  type: 'all',
  category: 'all',
  datePreset: '30d',
  startDate: '',
  endDate: '',
});

const DEFAULT_SORT = Object.freeze({
  sortBy: 'date',
  sortDirection: 'desc',
});

const DEFAULT_TYPE_OPTIONS = Object.freeze([
  { value: 'all', label: 'All' },
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
]);

const DEFAULT_CATEGORY_OPTIONS = Object.freeze([
  { value: 'all', label: 'All categories' },
  { value: 'income', label: 'Income' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'savings', label: 'Savings' },
  { value: 'dining', label: 'Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'card', label: 'Card' },
]);

const DEFAULT_DATE_PRESETS = Object.freeze([
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]);

const DEFAULT_SORT_OPTIONS = Object.freeze([
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
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
  const source = Array.isArray(options) && options.length ? options : fallback;

  return source
    .map(normalizeOption)
    .filter((option) => option.value && option.label);
}

function getPresetDates(preset) {
  if (preset === '7d') {
    return { startDate: '2026-10-08', endDate: '2026-10-14' };
  }
  if (preset === '30d') {
    return { startDate: '', endDate: '' };
  }
  if (preset === '90d') {
    return { startDate: '2026-07-17', endDate: '2026-10-22' };
  }
  return null;
}

function normalizeFilters(value = {}) {
  return {
    search: normalizeText(value.search ?? value.query ?? value.keyword),
    type: normalizeText(value.type || 'all').toLowerCase(),
    category: normalizeText(value.category || 'all').toLowerCase(),
    datePreset: normalizeText(value.datePreset || '30d').toLowerCase(),
    startDate: normalizeText(value.startDate ?? value.dateFrom ?? value.fromDate),
    endDate: normalizeText(value.endDate ?? value.dateTo ?? value.toDate),
  };
}

function normalizeSort(value = {}) {
  return {
    sortBy: normalizeText((value.sortBy ?? value.sort) || DEFAULT_SORT.sortBy),
    sortDirection:
      normalizeText((value.sortDirection ?? value.direction) || DEFAULT_SORT.sortDirection)
        .toLowerCase() === 'asc'
        ? 'asc'
        : 'desc',
  };
}

function getInitialFilters(props) {
  return normalizeFilters({
    ...(props.filters || {}),
    search: props.search ?? props.filters?.search,
    type: props.type ?? props.filters?.type,
    category: props.category ?? props.filters?.category,
    datePreset: props.datePreset ?? props.filters?.datePreset,
    startDate: props.startDate ?? props.filters?.startDate,
    endDate: props.endDate ?? props.filters?.endDate,
  });
}

function getFilterLabel(key) {
  const labels = {
    search: 'Search',
    type: 'Type',
    category: 'Category',
    datePreset: 'Period',
    startDate: 'From',
    endDate: 'To',
  };

  return labels[key] || key;
}

function getOptionLabel(options, value) {
  return options.find((option) => option.value === String(value))?.label || value;
}

function getSelectedFilters(filters, typeOptions, categoryOptions) {
  const items = [
    {
      key: 'datePreset',
      value: filters.datePreset || '30d',
      label: getOptionLabel(DEFAULT_DATE_PRESETS, filters.datePreset || '30d'),
      alwaysVisible: true,
    },
    {
      key: 'type',
      value: filters.type || 'all',
      label: getOptionLabel(typeOptions, filters.type || 'all'),
      alwaysVisible: true,
    },
  ];

  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'datePreset' || key === 'type') {
      return;
    }
    if (value !== '' && value !== 'all') {
      items.push({
        key,
        value,
        label:
          key === 'category'
            ? getOptionLabel(categoryOptions, value)
            : value,
      });
    }
  });

  return items;
}

function getCustomFilterDefinitions(customFilterOptions, customFilters) {
  if (Array.isArray(customFilterOptions)) {
    return customFilterOptions
      .map((option) => ({
        ...option,
        key: String(option?.key ?? option?.name ?? ''),
        label: option?.label || option?.name || option?.key || '',
        options: normalizeOptions(option?.options, []),
      }))
      .filter((option) => option.key && option.label && option.options.length);
  }

  if (customFilters && typeof customFilters === 'object') {
    return Object.keys(customFilters).map((key) => ({
      key,
      label: getFilterLabel(key),
      options: [],
    }));
  }

  return [];
}

/**
 * Renders accessible transaction search, filtering, date range presets,
 * selected-filter chips, and sorting controls per PRD Section 4.
 */
function TransactionFilters({
  category,
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  children,
  className = '',
  customFilterOptions = [],
  customFilters,
  customFiltersContent,
  datePreset,
  endDate,
  filters,
  id,
  onChange,
  onFiltersChange,
  onReset,
  onSort,
  onSortChange,
  search,
  showSelected = true,
  showSort = true,
  sortBy,
  sortDirection,
  sortOptions = DEFAULT_SORT_OPTIONS,
  startDate,
  type,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `transaction-filters-${generatedId}`;
  const isControlled = filters !== undefined;
  const [localFilters, setLocalFilters] = useState(() =>
    getInitialFilters({
      category,
      datePreset,
      filters,
      search,
      startDate,
      endDate,
      type,
    }),
  );
  const [localCustomFilters, setLocalCustomFilters] = useState(
    customFilters && typeof customFilters === 'object' ? customFilters : {},
  );

  const resolvedFilters = useMemo(
    () =>
      isControlled
        ? getInitialFilters({
            category,
            datePreset,
            filters,
            search,
            startDate,
            endDate,
            type,
          })
        : localFilters,
    [
      category,
      datePreset,
      endDate,
      filters,
      isControlled,
      localFilters,
      search,
      startDate,
      type,
    ],
  );

  const resolvedSort = normalizeSort({
    sortBy,
    sortDirection,
  });
  const normalizedTypeOptions = useMemo(
    () => normalizeOptions(typeOptions, DEFAULT_TYPE_OPTIONS),
    [typeOptions],
  );
  const normalizedCategoryOptions = useMemo(
    () => normalizeOptions(categoryOptions, DEFAULT_CATEGORY_OPTIONS),
    [categoryOptions],
  );
  const normalizedSortOptions = useMemo(
    () => normalizeOptions(sortOptions, DEFAULT_SORT_OPTIONS),
    [sortOptions],
  );
  const customDefinitions = useMemo(
    () => getCustomFilterDefinitions(customFilterOptions, customFilters),
    [customFilterOptions, customFilters],
  );

  useEffect(() => {
    if (customFilters && typeof customFilters === 'object') {
      setLocalCustomFilters(customFilters);
    }
  }, [customFilters]);

  const emitFilters = (nextFilters, nextCustomFilters = localCustomFilters) => {
    const combinedFilters = {
      ...nextFilters,
      ...nextCustomFilters,
    };

    if (!isControlled) {
      setLocalFilters(nextFilters);
    }

    onChange?.(combinedFilters);
    onFiltersChange?.(combinedFilters);
  };

  const handleFilterChange = (key, value) => {
    emitFilters({
      ...resolvedFilters,
      [key]: value,
    });
  };

  const handlePresetChange = (preset) => {
    const presetDates = getPresetDates(preset);
    emitFilters({
      ...resolvedFilters,
      datePreset: preset,
      startDate: presetDates ? presetDates.startDate : resolvedFilters.startDate,
      endDate: presetDates ? presetDates.endDate : resolvedFilters.endDate,
    });
  };

  const handleDateInputChange = (key, value) => {
    emitFilters({
      ...resolvedFilters,
      datePreset: 'custom',
      [key]: value,
    });
  };

  const handleCustomFilterChange = (key, value) => {
    const nextCustomFilters = {
      ...localCustomFilters,
      [key]: value,
    };

    setLocalCustomFilters(nextCustomFilters);
    emitFilters(resolvedFilters, nextCustomFilters);
  };

  const handleRemoveFilter = (key) => {
    if (key === 'datePreset') {
      handlePresetChange('30d');
      return;
    }

    if (Object.prototype.hasOwnProperty.call(resolvedFilters, key)) {
      handleFilterChange(key, key === 'search' || key.includes('Date') ? '' : 'all');
      return;
    }

    handleCustomFilterChange(key, '');
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS };
    const resetCustomFilters = Object.keys(localCustomFilters).reduce(
      (result, key) => ({
        ...result,
        [key]: '',
      }),
      {},
    );

    if (!isControlled) {
      setLocalFilters(resetFilters);
    }

    setLocalCustomFilters(resetCustomFilters);
    onChange?.({
      ...resetFilters,
      ...resetCustomFilters,
    });
    onFiltersChange?.({
      ...resetFilters,
      ...resetCustomFilters,
    });
    onReset?.();
  };

  const handleSortChange = (event) => {
    const nextSort = {
      ...resolvedSort,
      sortBy: event.target.value,
    };

    onSortChange?.(nextSort);
    onSort?.(nextSort);
  };

  const handleSortDirectionChange = () => {
    const nextSort = {
      ...resolvedSort,
      sortDirection: resolvedSort.sortDirection === 'asc' ? 'desc' : 'asc',
    };

    onSortChange?.(nextSort);
    onSort?.(nextSort);
  };

  const selectedFilters = [
    ...getSelectedFilters(
      resolvedFilters,
      normalizedTypeOptions,
      normalizedCategoryOptions,
    ),
    ...Object.entries(localCustomFilters)
      .filter(([, value]) => value !== '' && value !== 'all' && value !== undefined)
      .map(([key, value]) => ({
        key,
        value,
        label: value,
      })),
  ];

  return (
    <section
      {...props}
      aria-label="Transaction filters"
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5 ${className}`.trim()}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Date range
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEFAULT_DATE_PRESETS.map((preset) => {
              const isActive = (resolvedFilters.datePreset || '30d') === preset.value;
              return (
                <button
                  aria-pressed={isActive}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-strong bg-surface text-foreground hover:bg-surface-muted'
                  }`}
                  key={preset.value}
                  onClick={() => handlePresetChange(preset.value)}
                  type="button"
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2">
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-search`}
            >
              Search transactions
            </label>
            <input
              aria-label="Search transactions"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-search`}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="Search by description or reference"
              type="search"
              value={resolvedFilters.search}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-type`}
            >
              Type
            </label>
            <select
              aria-label="Transaction type"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-type`}
              onChange={(event) => handleFilterChange('type', event.target.value)}
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
              htmlFor={`${inputId}-category`}
            >
              Category
            </label>
            <select
              aria-label="Transaction category"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-category`}
              onChange={(event) => handleFilterChange('category', event.target.value)}
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
              htmlFor={`${inputId}-start-date`}
            >
              From date
            </label>
            <input
              aria-label="From date"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-start-date`}
              onChange={(event) => handleDateInputChange('startDate', event.target.value)}
              type="date"
              value={resolvedFilters.startDate}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor={`${inputId}-end-date`}
            >
              To date
            </label>
            <input
              aria-label="To date"
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              id={`${inputId}-end-date`}
              onChange={(event) => handleDateInputChange('endDate', event.target.value)}
              type="date"
              value={resolvedFilters.endDate}
            />
          </div>

          {customDefinitions.map((definition) => (
            <div key={definition.key}>
              <label
                className="block text-sm font-medium text-foreground"
                htmlFor={`${inputId}-${definition.key}`}
              >
                {definition.label}
              </label>
              {definition.options.length ? (
                <select
                  aria-label={definition.label}
                  className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id={`${inputId}-${definition.key}`}
                  onChange={(event) =>
                    handleCustomFilterChange(definition.key, event.target.value)
                  }
                  value={localCustomFilters[definition.key] || ''}
                >
                  <option value="">All</option>
                  {definition.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>

        {customFiltersContent || children ? (
          <div className="border-t border-border pt-4">
            {customFiltersContent || children}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          {showSort ? (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label
                  className="block text-sm font-medium text-foreground"
                  htmlFor={`${inputId}-sort`}
                >
                  Sort by
                </label>
                <select
                  aria-label="Sort transactions by"
                  className="mt-1 rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id={`${inputId}-sort`}
                  onChange={handleSortChange}
                  value={resolvedSort.sortBy}
                >
                  {normalizedSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                aria-label={`Sort ${resolvedSort.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={handleSortDirectionChange}
                type="button"
              >
                {resolvedSort.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
          ) : (
            <span />
          )}

          <button
            className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>

      {showSelected && selectedFilters.length ? (
        <div
          aria-label="Selected transaction filters"
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Selected filters:
          </span>
          {selectedFilters.map((filter) => (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border bg-primary-50 px-3 py-1 text-xs font-semibold text-foreground"
              key={filter.key}
            >
              <span>
                {getFilterLabel(filter.key)}: {filter.label}
              </span>
              {!filter.alwaysVisible ? (
                <button
                  aria-label={`Remove ${getFilterLabel(filter.key)} filter`}
                  className="rounded-full px-1 font-bold hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  onClick={() => handleRemoveFilter(filter.key)}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

TransactionFilters.displayName = 'TransactionFilters';

TransactionFilters.propTypes = {
  category: () => null,
  categoryOptions: () => null,
  children: childrenPropType,
  className: () => null,
  customFilterOptions: () => null,
  customFilters: () => null,
  customFiltersContent: childrenPropType,
  datePreset: () => null,
  endDate: () => null,
  filters: () => null,
  id: () => null,
  onChange: () => null,
  onFiltersChange: () => null,
  onReset: () => null,
  onSort: () => null,
  onSortChange: () => null,
  search: () => null,
  showSelected: () => null,
  showSort: () => null,
  sortBy: () => null,
  sortDirection: () => null,
  sortOptions: () => null,
  startDate: () => null,
  type: () => null,
  typeOptions: () => null,
};

export {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  getSelectedFilters,
  normalizeFilters,
  normalizeOptions,
  normalizeSort,
};

export default TransactionFilters;
