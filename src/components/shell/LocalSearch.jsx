import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import LiveRegion from '../accessibility/LiveRegion';
import { useCustomerProfile } from '../../contexts/CustomerProfileContext';
import { listOffers } from '../../services/OfferService';
import { listProducts } from '../../services/ProductService';

const childrenPropType = () => null;

const DEFAULT_MAX_RESULTS = 8;

const RESULT_TYPE_LABELS = Object.freeze({
  account: 'Account',
  offer: 'Offer',
  product: 'Product',
});

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeLimit(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return DEFAULT_MAX_RESULTS;
  }

  return Math.min(50, Math.floor(numericValue));
}

function getItemIdentifier(item, type, index) {
  return (
    item?.id ||
    item?.accountId ||
    item?.productId ||
    item?.offerId ||
    `${type}-${index}`
  );
}

function getItemName(item, type) {
  if (type === 'offer') {
    return item?.title || item?.name || 'Offer';
  }

  return item?.name || item?.title || 'Item';
}

function getItemDescription(item, type) {
  if (type === 'account') {
    return item?.maskedAccountNumber || item?.accountNumber || item?.number || '';
  }

  return item?.description || item?.details || '';
}

function getSearchText(item, type) {
  return [
    getItemName(item, type),
    getItemDescription(item, type),
    item?.type,
    item?.category,
    item?.id,
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function createSearchResult(item, type, index) {
  return {
    id: String(getItemIdentifier(item, type, index)),
    item,
    type,
    label: getItemName(item, type),
    description: getItemDescription(item, type),
    searchText: getSearchText(item, type),
  };
}

/**
 * Renders a local search control for accounts, products, and offers.
 *
 * Search is performed against data already available in the application and
 * never makes a remote request.
 *
 * @param {object} props Component properties.
 * @param {string} props.id Input identifier.
 * @param {string} props.label Accessible search label.
 * @param {string} props.placeholder Search input placeholder.
 * @param {string} props.value Controlled search value.
 * @param {object[]} props.accounts Account records to search.
 * @param {object[]} props.products Product records to search.
 * @param {object[]} props.offers Offer records to search.
 * @param {number} props.maxResults Maximum number of displayed results.
 * @param {Function} props.onChange Search-value callback.
 * @param {Function} props.onSearchChange Alias for onChange.
 * @param {Function} props.onSelect Callback invoked with the selected result.
 * @param {Function} props.onResultSelect Alias for onSelect.
 * @param {string} props.className Additional classes.
 * @returns {JSX.Element} Local search control.
 */
function LocalSearch({
  accounts: providedAccounts,
  className = '',
  id,
  label = 'Search accounts, products, and offers',
  maxResults = DEFAULT_MAX_RESULTS,
  onChange,
  onResultSelect,
  onSearchChange,
  onSelect,
  offers: providedOffers,
  placeholder = 'Search accounts, products, and offers',
  products: providedProducts,
  value: controlledValue,
}) {
  const { visibleAccounts } = useCustomerProfile();
  const generatedId = useId();
  const inputId = id || `local-search-${generatedId}`;
  const listboxId = `${inputId}-results`;
  const inputRef = useRef(null);
  const [searchValue, setSearchValue] = useState(
    controlledValue === undefined ? '' : String(controlledValue),
  );
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const resolvedValue =
    controlledValue === undefined ? searchValue : String(controlledValue);
  const normalizedMaxResults = normalizeLimit(maxResults);

  const results = useMemo(() => {
    const accounts = Array.isArray(providedAccounts)
      ? providedAccounts
      : visibleAccounts;
    const products = Array.isArray(providedProducts)
      ? providedProducts
      : listProducts();
    const offers = Array.isArray(providedOffers)
      ? providedOffers
      : listOffers();

    const source = [
      ...accounts.map((item, index) => createSearchResult(item, 'account', index)),
      ...products.map((item, index) => createSearchResult(item, 'product', index)),
      ...offers.map((item, index) => createSearchResult(item, 'offer', index)),
    ];
    const query = normalizeText(resolvedValue).toLowerCase();

    if (!query) {
      return [];
    }

    return source
      .filter((result) => result.searchText.includes(query))
      .slice(0, normalizedMaxResults);
  }, [
    normalizedMaxResults,
    providedAccounts,
    providedOffers,
    providedProducts,
    resolvedValue,
    visibleAccounts,
  ]);

  const isExpanded = isFocused && Boolean(normalizeText(resolvedValue));
  const resultCount = results.length;
  const activeResult = results[activeIndex];

  useEffect(() => {
    setActiveIndex(-1);
  }, [resolvedValue]);

  const handleChange = (event) => {
    const nextValue = event.target.value;

    if (controlledValue === undefined) {
      setSearchValue(nextValue);
    }

    onChange?.(event);
    onSearchChange?.(nextValue);
  };

  const handleSelect = (result) => {
    const callback = onSelect || onResultSelect;

    callback?.(result.item, result);
    setIsFocused(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!isExpanded || !results.length) {
      if (event.key === 'Escape') {
        setIsFocused(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex >= results.length - 1 ? 0 : currentIndex + 1,
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        currentIndex <= 0 ? results.length - 1 : currentIndex - 1,
      );
    }

    if (event.key === 'Enter' && activeResult) {
      event.preventDefault();
      handleSelect(activeResult);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  const feedbackMessage = normalizeText(resolvedValue)
    ? resultCount
      ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'} found.`
      : 'No matching accounts, products, or offers found.'
    : '';

  return (
    <div className={`relative ${className}`.trim()}>
      <label
        className="sr-only"
        htmlFor={inputId}
      >
        {label}
      </label>

      <input
        aria-activedescendant={
          activeResult ? `${listboxId}-${activeResult.id}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isExpanded}
        aria-label={label}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        id={inputId}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 100);
        }}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        type="search"
        value={resolvedValue}
      />

      <LiveRegion message={feedbackMessage} />

      {isExpanded ? (
        <div
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {results.length ? (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`} role="presentation">
                  <button
                    aria-selected={index === activeIndex}
                    className={`block w-full px-4 py-3 text-left ${
                      index === activeIndex
                        ? 'bg-primary-50'
                        : 'hover:bg-background-muted'
                    }`}
                    id={`${listboxId}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseDown={(event) => event.preventDefault()}
                    role="option"
                    type="button"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium text-foreground">
                        {result.label}
                      </span>
                      <span className="shrink-0 text-xs text-foreground-muted">
                        {RESULT_TYPE_LABELS[result.type]}
                      </span>
                    </span>
                    {result.description ? (
                      <span className="mt-1 block truncate text-sm text-foreground-muted">
                        {result.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-foreground-muted">
              No matching accounts, products, or offers found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

LocalSearch.displayName = 'LocalSearch';

LocalSearch.propTypes = {
  accounts: () => null,
  className: () => null,
  id: () => null,
  label: () => null,
  maxResults: () => null,
  onChange: () => null,
  onResultSelect: () => null,
  onSearchChange: () => null,
  onSelect: () => null,
  offers: () => null,
  placeholder: () => null,
  products: () => null,
  value: () => null,
};

export default LocalSearch;