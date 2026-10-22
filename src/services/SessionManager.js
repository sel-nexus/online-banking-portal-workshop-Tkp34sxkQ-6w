import DemoStore from '../store/DemoStore';
import { TIMEOUT_DURATIONS } from '../config/constants';

const DEFAULT_IDLE_WARNING_DURATION = 2 * 60 * 1000;
const DEFAULT_EXPIRY_DURATION = 30 * 1000;
const DEFAULT_DEADLINE_KEY = 'session-deadline';

const SESSION_EVENTS = Object.freeze({
  ACTIVITY: 'activity',
  WARNING: 'warning',
  CONTINUED: 'continued',
  EXPIRED: 'expired',
  LOGGED_OUT: 'loggedOut',
  INVALIDATED: 'invalidated',
});

function getGlobalEventTarget() {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.addEventListener === 'function'
  ) {
    return globalThis;
  }

  return null;
}

function normalizeDuration(value, fallback) {
  const duration = Number(value);

  return Number.isFinite(duration) && duration > 0
    ? Math.round(duration)
    : fallback;
}

function normalizeTimestamp(value, fallback = null) {
  const timestamp = Number(value);

  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : fallback;
}

function createSessionError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createTimerApi(timerApi = {}) {
  const defaultSetTimeout =
    typeof globalThis !== 'undefined' &&
    typeof globalThis.setTimeout === 'function'
      ? globalThis.setTimeout.bind(globalThis)
      : (...args) => setTimeout(...args);
  const defaultClearTimeout =
    typeof globalThis !== 'undefined' &&
    typeof globalThis.clearTimeout === 'function'
      ? globalThis.clearTimeout.bind(globalThis)
      : (...args) => clearTimeout(...args);

  return {
    setTimeout:
      typeof timerApi.setTimeout === 'function'
        ? timerApi.setTimeout.bind(timerApi)
        : defaultSetTimeout,
    clearTimeout:
      typeof timerApi.clearTimeout === 'function'
        ? timerApi.clearTimeout.bind(timerApi)
        : defaultClearTimeout,
    now:
      typeof timerApi.now === 'function'
        ? timerApi.now
        : () => Date.now(),
  };
}

/**
 * Manages an in-memory demonstration session and synchronizes its deadline.
 */
export class SessionManager {
  /**
   * @param {object} options Session manager options.
   * @param {Function} options.dispatch Optional application state dispatcher.
   * @param {Function} options.onChange Optional session event listener.
   * @param {Function} options.onWarning Optional idle-warning listener.
   * @param {Function} options.onExpire Optional expiry listener.
   * @param {number} options.idleWarningDuration Time before the idle warning.
   * @param {number} options.expiryDuration Time between warning and expiry.
   * @param {string} options.deadlineKey Demo store key for the deadline.
   * @param {boolean} options.invalidateOnBackNavigation Whether navigation invalidates a session.
   * @param {object} options.timerApi Timer and clock overrides for testing.
   */
  constructor(options = {}) {
    this.dispatch =
      typeof options.dispatch === 'function' ? options.dispatch : null;
    this.onChange =
      typeof options.onChange === 'function' ? options.onChange : null;
    this.onWarning =
      typeof options.onWarning === 'function' ? options.onWarning : null;
    this.onExpire =
      typeof options.onExpire === 'function' ? options.onExpire : null;

    this.idleWarningDuration = normalizeDuration(
      options.idleWarningDuration,
      DEFAULT_IDLE_WARNING_DURATION,
    );
    this.expiryDuration = normalizeDuration(
      options.expiryDuration,
      DEFAULT_EXPIRY_DURATION,
    );
    this.deadlineKey =
      String(options.deadlineKey || DEFAULT_DEADLINE_KEY).trim() ||
      DEFAULT_DEADLINE_KEY;
    this.invalidateOnBackNavigation =
      options.invalidateOnBackNavigation !== false;
    this.timerApi = createTimerApi(options.timerApi);

    this.session = null;
    this.deadline = null;
    this.warningAt = null;
    this.expiryAt = null;
    this.warningTimer = null;
    this.expiryTimer = null;
    this.unsubscribeFromStore = null;
    this.eventTarget = null;
    this.started = false;
    this.warningShown = false;
    this.expired = false;

    this.handleActivity = this.handleActivity.bind(this);
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handlePageShow = this.handlePageShow.bind(this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
  }

  /**
   * Starts tracking an authenticated session.
   *
   * @param {object} session Authenticated session data.
   * @returns {object} Current session state.
   */
  start(session = {}) {
    this.stop({ preserveSession: true });

    this.session = {
      ...session,
      isAuthenticated: session.isAuthenticated !== false,
    };
    this.deadline = this.timerApi.now() + this.idleWarningDuration;
    this.warningAt = this.deadline;
    this.expiryAt = this.deadline + this.expiryDuration;
    this.warningShown = false;
    this.expired = false;
    this.started = true;

    this.attachListeners();
    this.persistDeadline();
    this.scheduleTimers();
    this.dispatchSessionAction('session/loginSuccess', this.session);

    return this.getState();
  }

  /**
   * Starts tracking an existing session using its persisted deadline.
   *
   * @param {object} session Authenticated session data.
   * @returns {object} Current session state.
   */
  restore(session = {}) {
    const storedDeadline = this.readDeadline();

    if (!storedDeadline || storedDeadline <= this.timerApi.now()) {
      this.session = {
        ...session,
        isAuthenticated: false,
      };
      this.invalidate('SESSION_EXPIRED');
      return this.getState();
    }

    this.stop({ preserveSession: true });
    this.session = {
      ...session,
      isAuthenticated: session.isAuthenticated !== false,
    };
    this.deadline = storedDeadline;
    this.warningAt = storedDeadline;
    this.expiryAt = storedDeadline + this.expiryDuration;
    this.warningShown = false;
    this.expired = false;
    this.started = true;

    this.attachListeners();
    this.scheduleTimers();

    return this.getState();
  }

  /**
   * Stops timers and listeners.
   *
   * @param {object} options Stop options.
   * @param {boolean} options.preserveSession Preserve the current session object.
   * @returns {void}
   */
  stop({ preserveSession = false } = {}) {
    this.clearTimers();
    this.detachListeners();
    this.started = false;

    if (!preserveSession) {
      this.session = null;
      this.deadline = null;
      this.warningAt = null;
      this.expiryAt = null;
      this.warningShown = false;
      this.expired = false;
    }
  }

  /**
   * Records user activity and resets the idle deadline.
   *
   * @param {object} event Activity metadata.
   * @returns {object} Current session state.
   */
  handleActivity(event = {}) {
    if (!this.isAuthenticated()) {
      return this.getState();
    }

    const now = this.timerApi.now();
    this.deadline = now + this.idleWarningDuration;
    this.warningAt = this.deadline;
    this.expiryAt = this.deadline + this.expiryDuration;
    this.warningShown = false;
    this.expired = false;

    this.persistDeadline();
    this.scheduleTimers();
    this.dispatchSessionAction('session/continueSession', {
      ...this.session,
      timestamp: new Date(now).toISOString(),
      activity: event.type || 'activity',
    });
    this.emit(SESSION_EVENTS.ACTIVITY, event);

    return this.getState();
  }

  /**
   * Continues an idle session after the warning.
   *
   * @returns {object} Current session state.
   */
  continueSession() {
    if (!this.isAuthenticated() || this.expired) {
      throw createSessionError(
        'The session is no longer available.',
        'SESSION_UNAVAILABLE',
      );
    }

    return this.handleActivity({ type: 'continue-session' });
  }

  /**
   * Logs out and clears the synchronized deadline.
   *
   * @returns {object} Anonymous session state.
   */
  logout() {
    const previousSession = this.session;

    this.stop();
    this.clearPersistedDeadline();
    this.dispatchSessionAction('session/logout', {
      userId: previousSession?.userId || null,
      profileId: previousSession?.profileId || null,
    });
    this.emit(SESSION_EVENTS.LOGGED_OUT, previousSession);

    return this.getState();
  }

  /**
   * Invalidates the current session without restoring it from browser history.
   *
   * @param {string} reason Invalidation reason.
   * @returns {object} Anonymous session state.
   */
  invalidate(reason = 'SESSION_INVALIDATED') {
    const previousSession = this.session;

    this.stop();
    this.clearPersistedDeadline();
    this.session = {
      isAuthenticated: false,
      status: 'anonymous',
      error: reason,
    };
    this.expired = true;
    this.dispatchSessionAction('session/sessionExpired', {
      error: reason,
      reason,
    });
    this.emit(SESSION_EVENTS.INVALIDATED, {
      reason,
      session: previousSession,
    });

    return this.getState();
  }

  /**
   * Returns whether the manager has an authenticated session.
   *
   * @returns {boolean} Whether the session is authenticated.
   */
  isAuthenticated() {
    return Boolean(this.session?.isAuthenticated) && !this.expired;
  }

  /**
   * Returns the current manager state.
   *
   * @returns {object} Session manager state.
   */
  getState() {
    return {
      session: this.session,
      isAuthenticated: this.isAuthenticated(),
      started: this.started,
      warningShown: this.warningShown,
      expired: this.expired,
      deadline: this.deadline,
      warningAt: this.warningAt,
      expiryAt: this.expiryAt,
      remainingWarningTime: this.deadline
        ? Math.max(0, this.deadline - this.timerApi.now())
        : 0,
      remainingExpiryTime: this.expiryAt
        ? Math.max(0, this.expiryAt - this.timerApi.now())
        : 0,
    };
  }

  clearTimers() {
    if (this.warningTimer !== null) {
      this.timerApi.clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (this.expiryTimer !== null) {
      this.timerApi.clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  scheduleTimers() {
    this.clearTimers();

    if (!this.started || !this.deadline) {
      return;
    }

    const now = this.timerApi.now();
    const warningDelay = Math.max(0, this.deadline - now);
    const expiryDelay = Math.max(0, this.expiryAt - now);

    this.warningTimer = this.timerApi.setTimeout(
      () => this.showWarning(),
      warningDelay,
    );
    this.expiryTimer = this.timerApi.setTimeout(
      () => this.expire(),
      expiryDelay,
    );
  }

  showWarning() {
    if (!this.isAuthenticated() || this.warningShown) {
      return;
    }

    this.warningShown = true;
    this.dispatchSessionAction('session/idleWarning', {
      warningAt: this.warningAt,
      expiresAt: this.expiryAt,
      remainingTime: this.expiryDuration,
    });
    this.onWarning?.(this.getState());
    this.emit(SESSION_EVENTS.WARNING, this.getState());
  }

  expire() {
    if (!this.isAuthenticated()) {
      return;
    }

    this.warningShown = true;
    this.expired = true;
    this.clearPersistedDeadline();
    this.stop({ preserveSession: true });
    this.session = {
      ...this.session,
      isAuthenticated: false,
      status: 'expired',
    };
    this.dispatchSessionAction('session/sessionExpired', {
      expiresAt: this.expiryAt,
      error: 'Your session has expired.',
    });
    this.onExpire?.(this.getState());
    this.emit(SESSION_EVENTS.EXPIRED, this.getState());
  }

  attachListeners() {
    this.eventTarget = getGlobalEventTarget();

    if (this.eventTarget) {
      ['click', 'keydown', 'pointerdown', 'touchstart'].forEach((eventName) =>
        this.eventTarget.addEventListener(eventName, this.handleActivity),
      );

      if (this.invalidateOnBackNavigation) {
        this.eventTarget.addEventListener('popstate', this.handleNavigation);
        this.eventTarget.addEventListener('pageshow', this.handlePageShow);
      }
    }

    this.unsubscribeFromStore = DemoStore.subscribe(this.handleStoreChange);
  }

  detachListeners() {
    if (this.eventTarget) {
      ['click', 'keydown', 'pointerdown', 'touchstart'].forEach((eventName) =>
        this.eventTarget.removeEventListener(eventName, this.handleActivity),
      );
      this.eventTarget.removeEventListener('popstate', this.handleNavigation);
      this.eventTarget.removeEventListener('pageshow', this.handlePageShow);
    }

    this.eventTarget = null;

    if (this.unsubscribeFromStore) {
      this.unsubscribeFromStore();
      this.unsubscribeFromStore = null;
    }
  }

  handleNavigation() {
    if (this.isAuthenticated()) {
      this.invalidate('BACK_NAVIGATION_INVALIDATED');
    }
  }

  handlePageShow(event) {
    if (event?.persisted && this.isAuthenticated()) {
      this.invalidate('BACK_NAVIGATION_INVALIDATED');
    }
  }

  handleStoreChange(change) {
    if (!change) {
      return;
    }

    if (change.type === 'reset' || change.type === 'reset-marker') {
      this.stop();
      this.onChange?.(this.getState());
      return;
    }

    if (
      change.source !== 'storage' ||
      change.key !== this.deadlineKey ||
      !this.isAuthenticated()
    ) {
      return;
    }

    const deadline = normalizeTimestamp(change.value?.deadline, null);

    if (!deadline || deadline <= this.timerApi.now()) {
      this.expire();
      return;
    }

    this.deadline = deadline;
    this.warningAt = deadline;
    this.expiryAt = deadline + this.expiryDuration;
    this.warningShown = false;
    this.scheduleTimers();
  }

  persistDeadline() {
    if (!this.deadline) {
      return;
    }

    DemoStore.set(this.deadlineKey, {
      deadline: this.deadline,
      expiryAt: this.expiryAt,
      updatedAt: new Date(this.timerApi.now()).toISOString(),
    });
  }

  readDeadline() {
    const storedValue = DemoStore.get(this.deadlineKey, null);

    return normalizeTimestamp(
      typeof storedValue === 'object' ? storedValue.deadline : storedValue,
      null,
    );
  }

  clearPersistedDeadline() {
    DemoStore.remove(this.deadlineKey);
  }

  dispatchSessionAction(type, payload) {
    this.dispatch?.({
      type,
      payload,
    });
  }

  emit(type, payload) {
    this.onChange?.({
      type,
      payload,
      state: this.getState(),
    });
  }
}

/**
 * Creates a demonstration session manager.
 *
 * @param {object} options Session manager options.
 * @returns {SessionManager} Session manager instance.
 */
export function createSessionManager(options = {}) {
  return new SessionManager(options);
}

export const DEFAULT_SESSION_TIMEOUTS = Object.freeze({
  IDLE_WARNING: DEFAULT_IDLE_WARNING_DURATION,
  EXPIRY: DEFAULT_EXPIRY_DURATION,
  SESSION: TIMEOUT_DURATIONS.SESSION,
});

export const sessionManager = new SessionManager();

export default sessionManager;