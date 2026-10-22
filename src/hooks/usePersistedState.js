import { useCallback, useEffect, useRef, useState } from 'react';
import DemoStore from '../store/DemoStore';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function resolveInitialValue(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue;
}

function normalizeKey(key) {
  return String(key ?? '').trim();
}

function getValidationResult(value, validate) {
  if (typeof validate !== 'function') {
    return {
      valid: true,
      error: null,
    };
  }

  try {
    const result = validate(value);

    if (isRecord(result) && Object.prototype.hasOwnProperty.call(result, 'valid')) {
      return {
        valid: result.valid === true,
        error: result.valid === true
          ? null
          : result.error || result.message || 'The persisted value is invalid.',
      };
    }

    if (result === false) {
      return {
        valid: false,
        error: 'The persisted value is invalid.',
      };
    }

    return {
      valid: true,
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      error: error?.message || 'The persisted value is invalid.',
    };
  }
}

function createInitialState(key, initialValue, options) {
  const fallbackValue = resolveInitialValue(initialValue);
  const validation = getValidationResult(fallbackValue, options.validate);

  if (!validation.valid) {
    return {
      value: fallbackValue,
      error: validation.error,
    };
  }

  if (options.persist === false || !key) {
    return {
      value: fallbackValue,
      error: null,
    };
  }

  try {
    const storedValue = DemoStore.get(key, fallbackValue);
    const deserializedValue =
      typeof options.deserialize === 'function'
        ? options.deserialize(storedValue)
        : storedValue;
    const storedValidation = getValidationResult(
      deserializedValue,
      options.validate,
    );

    return storedValidation.valid
      ? {
          value: deserializedValue,
          error: null,
        }
      : {
          value: fallbackValue,
          error: storedValidation.error,
        };
  } catch (error) {
    return {
      value: fallbackValue,
      error: error?.message || 'The persisted value could not be loaded.',
    };
  }
}

/**
 * Stores validated state in the local demo store.
 *
 * @param {string} key Storage key.
 * @param {*} initialValue Initial value or value factory.
 * @param {object} options Persistence options.
 * @param {Function} options.validate Optional value validator.
 * @param {Function} options.serialize Optional value serializer.
 * @param {Function} options.deserialize Optional value deserializer.
 * @param {boolean} options.persist Whether persistence is enabled.
 * @returns {{
 *   value: *,
 *   state: *,
 *   setValue: Function,
 *   setState: Function,
 *   reset: Function,
 *   error: string|null,
 *   isValid: boolean
 * }} Persisted state and controls.
 */
export function usePersistedState(key, initialValue, options = {}) {
  const normalizedKey = normalizeKey(key);
  const initialValueRef = useRef();
  const initialValueInitializedRef = useRef(false);

  if (!initialValueInitializedRef.current) {
    initialValueRef.current = resolveInitialValue(initialValue);
    initialValueInitializedRef.current = true;
  }

  const initialStateRef = useRef(null);

  if (initialStateRef.current === null) {
    initialStateRef.current = createInitialState(
      normalizedKey,
      initialValueRef.current,
      options,
    );
  }

  const [value, setValueState] = useState(initialStateRef.current.value);
  const [error, setError] = useState(initialStateRef.current.error);
  const valueRef = useRef(value);

  valueRef.current = value;

  const validate = options.validate;
  const serialize = options.serialize;
  const deserialize = options.deserialize;
  const persist = options.persist !== false;

  const updateValue = useCallback(
    (nextValue) => {
      const candidate =
        typeof nextValue === 'function'
          ? nextValue(valueRef.current)
          : nextValue;
      const validation = getValidationResult(candidate, validate);

      if (!validation.valid) {
        setError(validation.error);
        return false;
      }

      valueRef.current = candidate;
      setError(null);
      setValueState(candidate);
      return true;
    },
    [validate],
  );

  const reset = useCallback(() => {
    const fallbackValue = initialValueRef.current;
    const validation = getValidationResult(fallbackValue, validate);

    if (!validation.valid) {
      setError(validation.error);
      return false;
    }

    valueRef.current = fallbackValue;
    setValueState(fallbackValue);
    setError(null);
    return true;
  }, [validate]);

  useEffect(() => {
    if (!persist || !normalizedKey) {
      return undefined;
    }

    const unsubscribe = DemoStore.subscribe((change) => {
      if (!change || change.source !== 'storage') {
        return;
      }

      const isReset =
        change.type === 'reset' ||
        change.type === 'reset-marker' ||
        change.key === null;
      const isRemoved =
        change.type === 'remove' && change.key === normalizedKey;
      const isUpdated =
        change.type === 'set' && change.key === normalizedKey;

      if (isReset || isRemoved) {
        reset();
        return;
      }

      if (!isUpdated) {
        return;
      }

      try {
        const nextValue =
          typeof deserialize === 'function'
            ? deserialize(change.value)
            : change.value;
        const validation = getValidationResult(nextValue, validate);

        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        valueRef.current = nextValue;
        setValueState(nextValue);
        setError(null);
      } catch (storageError) {
        setError(
          storageError?.message ||
            'The persisted value could not be loaded.',
        );
      }
    });

    return unsubscribe;
  }, [deserialize, normalizedKey, persist, reset, validate]);

  useEffect(() => {
    if (!persist || !normalizedKey) {
      return;
    }

    try {
      const valueToStore =
        typeof serialize === 'function' ? serialize(value) : value;
      const stored = DemoStore.set(normalizedKey, valueToStore);

      if (!stored) {
        setError('The value could not be persisted.');
      }
    } catch (storageError) {
      setError(
        storageError?.message || 'The value could not be persisted.',
      );
    }
  }, [normalizedKey, persist, serialize, value]);

  return {
    value,
    state: value,
    setValue: updateValue,
    setState: updateValue,
    reset,
    error,
    isValid: error === null,
  };
}

export default usePersistedState;