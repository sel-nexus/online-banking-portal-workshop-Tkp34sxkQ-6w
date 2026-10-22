import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ProductCard from '../components/catalogue/ProductCard';
import CatalogueFilters from '../components/catalogue/CatalogueFilters';
import InterestConfirmation from '../components/catalogue/InterestConfirmation';
import EmptyState from '../components/feedback/EmptyState';
import ErrorState from '../components/feedback/ErrorState';
import LoadingSkeleton from '../components/feedback/LoadingSkeleton';
import { SIMULATION_MESSAGES } from '../config/messages';
import { useToast } from '../contexts/AppProviders';
import {
  confirmProductAction,
  retrieveProducts,
} from '../services/ProductService';

const childrenPropType = () => null;

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  category: 'all',
  type: 'all',
  status: 'all',
});

const DEFAULT_PRODUCTS = Object.freeze([]);

function normalizeProducts(products) {
  return Array.isArray(products) ? products : [];
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeFilterValue(value, fallback = 'all') {
  const normalizedValue = normalizeText(value).toLowerCase();

  return normalizedValue || fallback;
}

function normalizeFilters(filters = {}) {
  return {
    search: normalizeText(filters.search ?? filters.query ?? ''),
    category: normalizeFilterValue(filters.category),
    type: normalizeFilterValue(filters.type),
    status: normalizeFilterValue(filters.status),
  };
}

function getProductIdentifier(product) {
  return product?.id || product?.productId || null;
}

function getProductName(product) {
  return product?.name || product?.title || 'Product';
}

function getProductSearchText(product) {
  return [
    getProductIdentifier(product),
    getProductName(product),
    product?.description,
    product?.category,
    product?.type,
    product?.status,
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.benefits) ? product.benefits : []),
  ]
    .map(normalizeText)
    .join(' ')
    .toLowerCase();
}

function filterProducts(products, filters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const normalizedSearch = normalizedFilters.search.toLowerCase();

  return normalizeProducts(products).filter((product) => {
    const category = normalizeFilterValue(product?.category);
    const type = normalizeFilterValue(product?.type);
    const status = normalizeFilterValue(product?.status);

    if (
      normalizedSearch &&
      !getProductSearchText(product).includes(normalizedSearch)
    ) {
      return false;
    }

    if (
      normalizedFilters.category !== 'all' &&
      category !== normalizedFilters.category
    ) {
      return false;
    }

    if (normalizedFilters.type !== 'all' && type !== normalizedFilters.type) {
      return false;
    }

    if (
      normalizedFilters.status !== 'all' &&
      status !== normalizedFilters.status
    ) {
      return false;
    }

    return true;
  });
}

function createFilterOptions(products, key, allLabel) {
  const values = [
    ...new Set(
      normalizeProducts(products)
        .map((product) => normalizeText(product?.[key]).toLowerCase())
        .filter(Boolean),
    ),
  ];

  return [
    { value: 'all', label: allLabel },
    ...values.map((value) => ({
      value,
      label: value
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    })),
  ];
}

function getCategoryOptions(products) {
  return createFilterOptions(products, 'category', 'All categories');
}

function getTypeOptions(products) {
  return createFilterOptions(products, 'type', 'All types');
}

function getStatusOptions(products) {
  return createFilterOptions(products, 'status', 'All statuses');
}

/**
 * Renders the six-product catalogue with local search, filtering, loading,
 * error, empty, and simulated-action confirmation states.
 *
 * @param {object} props Component properties.
 * @param {object[]} props.products Optional product collection override.
 * @param {object} props.filters Initial or controlled catalogue filters.
 * @param {boolean} props.simulateFailure Whether product retrieval should fail.
 * @param {boolean} props.failureSimulation Alias for simulateFailure.
 * @param {Function} props.onRetry Callback invoked when retrieval is retried.
 * @param {Function} props.onAction Callback invoked after a simulated action.
 * @param {Function} props.onApply Alias for onAction.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Product catalogue page.
 */
function ProductsPage({
  className = '',
  failureSimulation = false,
  filters: providedFilters,
  onAction,
  onApply,
  onRetry,
  products: providedProducts,
  simulateFailure = false,
}) {
  const { showToast } = useToast();
  const [products, setProducts] = useState(() =>
    normalizeProducts(providedProducts ?? DEFAULT_PRODUCTS),
  );
  const [filters, setFilters] = useState(() =>
    normalizeFilters(providedFilters),
  );
  const [isLoading, setIsLoading] = useState(
    providedProducts === undefined,
  );
  const [error, setError] = useState(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const shouldSimulateFailure = simulateFailure || failureSimulation;
  const resolvedFilters =
    providedFilters === undefined
      ? filters
      : normalizeFilters(providedFilters);

  const loadProducts = useCallback(async () => {
    if (providedProducts !== undefined) {
      setProducts(normalizeProducts(providedProducts));
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const retrievedProducts = await retrieveProducts({
        simulateFailure: shouldSimulateFailure,
      });

      setProducts(normalizeProducts(retrievedProducts));
    } catch (retrievalError) {
      setProducts([]);
      setError(retrievalError);
    } finally {
      setIsLoading(false);
    }
  }, [providedProducts, shouldSimulateFailure]);

  useEffect(() => {
    let isMounted = true;

    const retrieveCatalogue = async () => {
      if (providedProducts !== undefined) {
        if (isMounted) {
          setProducts(normalizeProducts(providedProducts));
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const retrievedProducts = await retrieveProducts({
          simulateFailure: shouldSimulateFailure,
        });

        if (isMounted) {
          setProducts(normalizeProducts(retrievedProducts));
        }
      } catch (retrievalError) {
        if (isMounted) {
          setProducts([]);
          setError(retrievalError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    retrieveCatalogue();

    return () => {
      isMounted = false;
    };
  }, [
    providedProducts,
    retryVersion,
    shouldSimulateFailure,
  ]);

  const filteredProducts = useMemo(
    () => filterProducts(products, resolvedFilters),
    [products, resolvedFilters],
  );

  const categoryOptions = useMemo(
    () => getCategoryOptions(products),
    [products],
  );
  const typeOptions = useMemo(
    () => getTypeOptions(products),
    [products],
  );
  const statusOptions = useMemo(
    () => getStatusOptions(products),
    [products],
  );

  const handleFiltersChange = (nextFilters) => {
    setFilters(normalizeFilters(nextFilters));
  };

  const handleRetry = () => {
    setRetryVersion((version) => version + 1);
    onRetry?.();
  };

  const handleProductAction = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseConfirmation = () => {
    if (!isConfirming) {
      setSelectedProduct(null);
    }
  };

  const handleConfirmAction = async (product, details = {}) => {
    if (!product || isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      const confirmation = confirmProductAction(
        product,
        'product_application_confirmed',
      );

      onAction?.(confirmation, product, details);
      onApply?.(confirmation, product, details);
      const refNumber = `BPI-INQ-${Math.floor(10000 + Math.random() * 90000)}`;
      showToast(
        `Thank you for your interest! Your product inquiry has been recorded (Ref: ${refNumber}). A BPI specialist will contact you.`,
        { variant: 'success' },
      );
      setSelectedProduct(null);
    } catch (actionError) {
      showToast(
        actionError?.message ||
          'Your product inquiry could not be submitted. Please try again.',
        { variant: 'error' },
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <section
        aria-labelledby="products-page-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          BPI PRODUCT CATALOGUE
        </p>
        <h1
          className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl"
          id="products-page-title"
        >
          Banking products
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
          Explore our suite of everyday deposit accounts, credit cards, personal and home loans.
        </p>
      </section>

      <CatalogueFilters
        categoryOptions={categoryOptions}
        filters={resolvedFilters}
        onChange={handleFiltersChange}
        onReset={() => setFilters({ ...DEFAULT_FILTERS })}
        searchLabel="Search products"
        searchPlaceholder="Search products by name, type, or feature"
        statusOptions={statusOptions}
        typeOptions={typeOptions}
      />

      {isLoading ? (
        <LoadingSkeleton
          count={6}
          label="Loading products"
          variant="catalogue"
        />
      ) : null}

      {!isLoading && error ? (
        <ErrorState
          description="We could not load the product catalogue."
          error={error}
          onRetry={handleRetry}
          retryLabel="Retry loading products"
          title="Products are temporarily unavailable"
          variant="unavailable"
        />
      ) : null}

      {!isLoading && !error && !filteredProducts.length ? (
        <EmptyState
          description="Try a different search term or remove some filters."
          onAction={() => setFilters({ ...DEFAULT_FILTERS })}
          showAction
          title="No products found"
        />
      ) : null}

      {!isLoading && !error && filteredProducts.length ? (
        <section
          aria-labelledby="products-results-title"
          className="space-y-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="text-xl font-semibold text-foreground"
                id="products-results-title"
              >
                Available products
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? '' : 's'} shown
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <ProductCard
                actionLabel="Express Interest"
                key={
                  String(getProductIdentifier(product)) ||
                  `product-${index}`
                }
                onAction={() => handleProductAction(product)}
                product={product}
              />
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-center text-xs text-foreground-subtle">
        {SIMULATION_MESSAGES.notice}
      </p>

      <InterestConfirmation
        item={selectedProduct}
        loading={isConfirming}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmAction}
        open={Boolean(selectedProduct)}
        type="product"
      />
    </div>
  );
}

ProductsPage.displayName = 'ProductsPage';

ProductsPage.propTypes = {
  className: () => null,
  failureSimulation: () => null,
  filters: () => null,
  onAction: () => null,
  onApply: () => null,
  onRetry: () => null,
  products: () => null,
  simulateFailure: () => null,
};

export {
  DEFAULT_FILTERS,
  filterProducts,
  getCategoryOptions,
  getProductIdentifier,
  getProductName,
  getProductSearchText,
  getStatusOptions,
  getTypeOptions,
  normalizeFilters,
  normalizeProducts,
};

export default ProductsPage;