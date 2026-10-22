import { useCallback, useEffect, useRef } from 'react';
import {
  captureFocus as captureDocumentFocus,
  restoreFocus as restoreDocumentFocus,
} from '../utils/focusUtils';

function isRefObject(value) {
  return Boolean(value && typeof value === 'object' && 'current' in value);
}

function resolveElement(value) {
  if (isRefObject(value)) {
    return value.current || null;
  }

  return value || null;
}

function normalizeArguments(isOpenOrOptions, triggerRefOrOptions, options) {
  if (typeof isOpenOrOptions === 'boolean') {
    return {
      isOpen: isOpenOrOptions,
      triggerRef: triggerRefOrOptions,
      options: options || {},
    };
  }

  if (isRefObject(isOpenOrOptions)) {
    return {
      isOpen: Boolean(triggerRefOrOptions),
      triggerRef: isOpenOrOptions,
      options: options || {},
    };
  }

  const normalizedOptions =
    isOpenOrOptions && typeof isOpenOrOptions === 'object'
      ? isOpenOrOptions
      : {};

  return {
    isOpen: Boolean(
      normalizedOptions.isOpen ?? normalizedOptions.open ?? false,
    ),
    triggerRef:
      normalizedOptions.triggerRef ||
      normalizedOptions.trigger ||
      normalizedOptions.returnFocusRef ||
      null,
    options: normalizedOptions,
  };
}

/**
 * Captures the element that opened an interactive surface and restores focus
 * to it after the surface closes.
 *
 * @param {boolean|object} isOpenOrOptions Whether the surface is open, or hook options.
 * @param {object|boolean} triggerRefOrOptions Trigger ref, or legacy open state.
 * @param {object} options Hook options.
 * @returns {{
 *   triggerRef: object,
 *   capturedElement: Element|null,
 *   capture: Function,
 *   captureTriggerFocus: Function,
 *   restore: Function,
 *   restoreFocus: Function
 * }} Focus restoration controls.
 */
export function useFocusReturn(
  isOpenOrOptions = false,
  triggerRefOrOptions,
  options,
) {
  const normalized = normalizeArguments(
    isOpenOrOptions,
    triggerRefOrOptions,
    options,
  );
  const {
    isOpen,
    triggerRef: providedTriggerRef,
    options: hookOptions,
  } = normalized;
  const internalTriggerRef = useRef(null);
  const triggerRef = providedTriggerRef || internalTriggerRef;
  const capturedElementRef = useRef(null);
  const previousOpenRef = useRef(false);

  const enabled = hookOptions.enabled !== false;
  const restoreOnClose = hookOptions.restoreOnClose !== false;
  const documentOverride = hookOptions.document;
  const restoreOptions = hookOptions.restoreOptions || {};

  const capture = useCallback(() => {
    if (!enabled) {
      return null;
    }

    const triggerElement = resolveElement(triggerRef);
    const capturedElement =
      triggerElement || captureDocumentFocus(documentOverride);

    capturedElementRef.current = capturedElement || null;

    return capturedElementRef.current;
  }, [documentOverride, enabled, triggerRef]);

  const restore = useCallback(() => {
    if (!enabled || !restoreOnClose) {
      return null;
    }

    const capturedElement = capturedElementRef.current;
    const restoredElement = restoreDocumentFocus(capturedElement, {
      ...restoreOptions,
      document: documentOverride,
      fallback:
        restoreOptions.fallback ||
        resolveElement(triggerRef) ||
        hookOptions.fallback ||
        null,
    });

    capturedElementRef.current = null;

    return restoredElement;
  }, [
    documentOverride,
    enabled,
    hookOptions.fallback,
    restoreOnClose,
    restoreOptions,
    triggerRef,
  ]);

  useEffect(() => {
    if (!enabled) {
      previousOpenRef.current = isOpen;
      return undefined;
    }

    const wasOpen = previousOpenRef.current;

    if (isOpen && !wasOpen) {
      capture();
    } else if (!isOpen && wasOpen) {
      restore();
    }

    previousOpenRef.current = isOpen;

    return undefined;
  }, [capture, enabled, isOpen, restore]);

  useEffect(
    () => () => {
      capturedElementRef.current = null;
    },
    [],
  );

  return {
    triggerRef,
    capturedElement: capturedElementRef.current,
    capture,
    captureTriggerFocus: capture,
    restore,
    restoreFocus: restore,
  };
}

export default useFocusReturn;