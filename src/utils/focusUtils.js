const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

function getDocument(documentOverride) {
  if (documentOverride && typeof documentOverride.querySelectorAll === 'function') {
    return documentOverride;
  }

  if (typeof globalThis !== 'undefined' && globalThis.document) {
    return globalThis.document;
  }

  return null;
}

function isElement(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      value.nodeType === 1 &&
      typeof value.focus === 'function',
  );
}

function isHidden(element) {
  if (!isElement(element)) {
    return true;
  }

  if (
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.getAttribute('inert') !== null
  ) {
    return true;
  }

  let currentElement = element.parentElement;

  while (currentElement) {
    if (
      currentElement.hidden ||
      currentElement.getAttribute('aria-hidden') === 'true' ||
      currentElement.getAttribute('inert') !== null
    ) {
      return true;
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

function isDisabled(element) {
  if (!isElement(element)) {
    return true;
  }

  if (element.disabled === true || element.getAttribute('aria-disabled') === 'true') {
    return true;
  }

  const disabledFieldset = element.closest?.('fieldset[disabled]');

  if (!disabledFieldset) {
    return false;
  }

  const legend = disabledFieldset.querySelector('legend');

  return !legend || !legend.contains(element);
}

function getTabIndex(element) {
  if (!isElement(element)) {
    return -1;
  }

  const tabIndex = element.getAttribute('tabindex');

  if (tabIndex !== null) {
    const numericTabIndex = Number.parseInt(tabIndex, 10);

    return Number.isNaN(numericTabIndex) ? -1 : numericTabIndex;
  }

  if (
    element.matches?.(
      'a[href], area[href], button, input, select, textarea, iframe, object, embed, summary',
    )
  ) {
    return 0;
  }

  return element.isContentEditable ? 0 : -1;
}

function isFocusable(element) {
  return (
    isElement(element) &&
    !isHidden(element) &&
    !isDisabled(element) &&
    getTabIndex(element) >= 0
  );
}

function normalizeContainer(container) {
  if (container && typeof container.querySelectorAll === 'function') {
    return container;
  }

  return getDocument();
}

/**
 * Returns the currently focused element.
 *
 * @param {Document|ShadowRoot} documentOverride Document-like object.
 * @returns {Element|null} The active element, when available.
 */
export function getActiveElement(documentOverride) {
  const documentObject = getDocument(documentOverride);

  if (!documentObject) {
    return null;
  }

  return documentObject.activeElement || null;
}

/**
 * Captures the currently focused element for later restoration.
 *
 * @param {Document|ShadowRoot} documentOverride Document-like object.
 * @returns {Element|null} The element that was focused.
 */
export function captureFocus(documentOverride) {
  return getActiveElement(documentOverride);
}

/**
 * Returns whether an element can receive keyboard focus.
 *
 * @param {*} element Element to inspect.
 * @returns {boolean} Whether the element is keyboard focusable.
 */
export function isKeyboardFocusable(element) {
  return isFocusable(element);
}

/**
 * Finds all keyboard-focusable elements within a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @returns {Element[]} Focusable elements in document order.
 */
export function getFocusableElements(container) {
  const normalizedContainer = normalizeContainer(container);

  if (!normalizedContainer) {
    return [];
  }

  const candidates = [];

  if (isFocusable(normalizedContainer)) {
    candidates.push(normalizedContainer);
  }

  if (typeof normalizedContainer.querySelectorAll !== 'function') {
    return candidates;
  }

  return candidates.concat(
    Array.from(normalizedContainer.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      isFocusable,
    ),
  );
}

/**
 * Finds all keyboard-focusable elements within a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @returns {Element[]} Focusable elements in document order.
 */
export const getKeyboardFocusableElements = getFocusableElements;

/**
 * Returns the first keyboard-focusable element in a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @returns {Element|null} First focusable element.
 */
export function getFirstFocusableElement(container) {
  return getFocusableElements(container)[0] || null;
}

/**
 * Returns the last keyboard-focusable element in a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @returns {Element|null} Last focusable element.
 */
export function getLastFocusableElement(container) {
  const elements = getFocusableElements(container);

  return elements[elements.length - 1] || null;
}

/**
 * Focuses an element without throwing when focus is unavailable.
 *
 * @param {Element|null} element Element to focus.
 * @param {object} options Focus options.
 * @returns {boolean} Whether focus was requested successfully.
 */
export function focusElement(element, options = {}) {
  if (!isElement(element)) {
    return false;
  }

  try {
    element.focus({
      preventScroll: options.preventScroll !== false,
    });
    return true;
  } catch {
    try {
      element.focus();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Focuses the first focusable element in a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @param {object} options Focus options.
 * @returns {Element|null} Focused element, or null when unavailable.
 */
export function focusFirstElement(container, options = {}) {
  const element = getFirstFocusableElement(container);

  return focusElement(element, options) ? element : null;
}

/**
 * Focuses the last focusable element in a container.
 *
 * @param {Element|Document|DocumentFragment} container Search container.
 * @param {object} options Focus options.
 * @returns {Element|null} Focused element, or null when unavailable.
 */
export function focusLastElement(container, options = {}) {
  const element = getLastFocusableElement(container);

  return focusElement(element, options) ? element : null;
}

function focusContainer(container, options = {}) {
  if (!isElement(container)) {
    return null;
  }

  if (isFocusable(container)) {
    return focusElement(container, options) ? container : null;
  }

  if (options.makeFocusable !== false && !container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
    return focusElement(container, options) ? container : null;
  }

  return null;
}

/**
 * Places focus in a modal or panel, preferring an autofocus element and then
 * the first focusable descendant.
 *
 * @param {Element} container Modal or panel element.
 * @param {object} options Focus options.
 * @returns {Element|null} Focused element, or null when unavailable.
 */
export function focusInitialElement(container, options = {}) {
  if (!container || typeof container.querySelector !== 'function') {
    return null;
  }

  const autofocusElement = container.querySelector('[autofocus]');

  if (isFocusable(autofocusElement) && focusElement(autofocusElement, options)) {
    return autofocusElement;
  }

  const firstElement = focusFirstElement(container, options);

  return firstElement || focusContainer(container, options);
}

/**
 * Focuses a modal dialog using standard initial-focus behavior.
 *
 * @param {Element} modal Modal element.
 * @param {object} options Focus options.
 * @returns {Element|null} Focused element, or null when unavailable.
 */
export function focusModal(modal, options = {}) {
  return focusInitialElement(modal, options);
}

/**
 * Focuses a panel using standard initial-focus behavior.
 *
 * @param {Element} panel Panel element.
 * @param {object} options Focus options.
 * @returns {Element|null} Focused element, or null when unavailable.
 */
export function focusPanel(panel, options = {}) {
  return focusInitialElement(panel, options);
}

/**
 * Restores focus to a previously captured element or fallback element.
 *
 * @param {Element|null} capturedElement Previously focused element.
 * @param {object} options Restoration options.
 * @param {Element|null} options.fallback Fallback element.
 * @returns {Element|null} Restored element, or null when unavailable.
 */
export function restoreFocus(capturedElement, options = {}) {
  const candidates = [capturedElement, options.fallback];

  for (const element of candidates) {
    if (isFocusable(element) && focusElement(element, options)) {
      return element;
    }
  }

  return null;
}

/**
 * Keeps keyboard focus within a modal or panel after a Tab key press.
 *
 * @param {KeyboardEvent} event Keyboard event.
 * @param {Element} container Focus boundary.
 * @returns {boolean} Whether focus was moved by the helper.
 */
export function trapFocus(event, container) {
  if (!event || event.key !== 'Tab') {
    return false;
  }

  const elements = getFocusableElements(container);

  if (elements.length === 0) {
    return false;
  }

  const activeElement = getActiveElement();
  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];

  if (event.shiftKey && (activeElement === firstElement || !container.contains(activeElement))) {
    event.preventDefault();
    focusElement(lastElement);
    return true;
  }

  if (!event.shiftKey && (activeElement === lastElement || !container.contains(activeElement))) {
    event.preventDefault();
    focusElement(firstElement);
    return true;
  }

  return false;
}

/**
 * Creates a keyboard focus trap for a modal or panel.
 *
 * @param {Element} container Focus boundary.
 * @param {object} options Focus-trap options.
 * @returns {Function} Cleanup function.
 */
export function createFocusTrap(container, options = {}) {
  if (!container || typeof container.addEventListener !== 'function') {
    return () => {};
  }

  const previouslyFocused = captureFocus(options.document);
  const handleKeyDown = (event) => trapFocus(event, container);

  container.addEventListener('keydown', handleKeyDown);

  if (options.autoFocus !== false) {
    focusInitialElement(container, options);
  }

  return () => {
    container.removeEventListener('keydown', handleKeyDown);

    if (options.restoreFocus !== false) {
      restoreFocus(previouslyFocused, options);
    }
  };
}

/**
 * Creates a focus trap for a modal or panel.
 *
 * @param {Element} container Focus boundary.
 * @param {object} options Focus-trap options.
 * @returns {Function} Cleanup function.
 */
export const setupFocusTrap = createFocusTrap;

export const saveFocus = captureFocus;
export const getFocusable = getFocusableElements;
export const firstFocusable = getFirstFocusableElement;
export const lastFocusable = getLastFocusableElement;
export const focusFirst = focusFirstElement;
export const focusLast = focusLastElement;
export const restoreCapturedFocus = restoreFocus;

const focusUtils = Object.freeze({
  getActiveElement,
  captureFocus,
  saveFocus,
  isKeyboardFocusable,
  getFocusableElements,
  getKeyboardFocusableElements,
  getFocusable,
  getFirstFocusableElement,
  getLastFocusableElement,
  firstFocusable,
  lastFocusable,
  focusElement,
  focusFirstElement,
  focusLastElement,
  focusFirst,
  focusLast,
  focusInitialElement,
  focusModal,
  focusPanel,
  restoreFocus,
  restoreCapturedFocus,
  trapFocus,
  createFocusTrap,
  setupFocusTrap,
});

export default focusUtils;