const MIN_SIMULATION_DELAY = 300;
const MAX_SIMULATION_DELAY = 800;
const DEFAULT_SIMULATION_DELAY = 500;

function normalizeDelay(value, fallback = DEFAULT_SIMULATION_DELAY) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    MAX_SIMULATION_DELAY,
    Math.max(MIN_SIMULATION_DELAY, Math.round(numericValue)),
  );
}

function normalizeOptions(options) {
  if (typeof options === 'number') {
    return { duration: options };
  }

  return options && typeof options === 'object' ? options : {};
}

function createCancellationError(message = 'The simulated operation was cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function getSignal(options) {
  return options?.signal && typeof options.signal.addEventListener === 'function'
    ? options.signal
    : null;
}

/**
 * Clamps a simulation delay to the supported demonstration interval.
 *
 * @param {number} duration Requested delay in milliseconds.
 * @returns {number} Bounded delay in milliseconds.
 */
export function clampSimulationDelay(duration) {
  return normalizeDelay(duration);
}

/**
 * Checks whether an error represents a cancelled simulated operation.
 *
 * @param {*} error Error to check.
 * @returns {boolean} Whether the error represents cancellation.
 */
export function isCancellationError(error) {
  return Boolean(error && error.name === 'AbortError');
}

/**
 * Waits for a bounded local demonstration delay.
 *
 * @param {number|object} duration Delay in milliseconds or delay options.
 * @param {object} options Delay options.
 * @returns {Promise<void>} Promise resolved after the delay.
 */
export function delay(duration = DEFAULT_SIMULATION_DELAY, options = {}) {
  const normalizedOptions =
    duration && typeof duration === 'object'
      ? normalizeOptions(duration)
      : { ...normalizeOptions(options), duration };
  const signal = getSignal(normalizedOptions);
  const delayDuration = normalizeDelay(
    normalizedOptions.duration,
    DEFAULT_SIMULATION_DELAY,
  );

  return new Promise((resolve, reject) => {
    let timerId;

    const cleanup = () => {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }

      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      cleanup();
      reject(createCancellationError());
    };

    if (signal?.aborted) {
      reject(createCancellationError());
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    timerId = setTimeout(() => {
      cleanup();
      resolve();
    }, delayDuration);
  });
}

/**
 * Runs a local simulated operation after a bounded demonstration delay.
 *
 * @param {*} result Value to return, or a function returning a value or promise.
 * @param {object|number} options Simulation options or delay in milliseconds.
 * @returns {Promise<*>} Resolved simulated result.
 */
export async function simulateLoading(result, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  const signal = getSignal(normalizedOptions);

  await delay(normalizedOptions.duration, { signal });

  if (typeof result === 'function') {
    return result();
  }

  return result;
}

/**
 * Runs an asynchronous operation with a bounded local loading delay.
 *
 * @param {Function} operation Operation to execute after the delay.
 * @param {object|number} options Simulation options or delay in milliseconds.
 * @returns {Promise<*>} Operation result.
 */
export async function withSimulatedLoading(operation, options = {}) {
  if (typeof operation !== 'function') {
    throw new TypeError('A simulated loading operation must be a function.');
  }

  return simulateLoading(operation, options);
}

export const sleep = delay;
export const wait = delay;
export const cancellableDelay = delay;
export const simulateAsync = simulateLoading;
export const runWithSimulatedLoading = withSimulatedLoading;

export const ASYNC_SIMULATION_LIMITS = Object.freeze({
  MIN_DELAY: MIN_SIMULATION_DELAY,
  MAX_DELAY: MAX_SIMULATION_DELAY,
  DEFAULT_DELAY: DEFAULT_SIMULATION_DELAY,
});

const asyncUtils = Object.freeze({
  clampSimulationDelay,
  isCancellationError,
  delay,
  sleep,
  wait,
  cancellableDelay,
  simulateLoading,
  simulateAsync,
  withSimulatedLoading,
  runWithSimulatedLoading,
  ASYNC_SIMULATION_LIMITS,
});

export default asyncUtils;