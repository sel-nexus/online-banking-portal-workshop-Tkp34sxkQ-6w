import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import DemoStore from './DemoStore';
import { createInitialState } from './initialState';
import { demoReducer } from './demoReducer';

const DEFAULT_STATE_KEY = 'demo-state';

const DemoStoreContext = createContext(null);

DemoStoreContext.displayName = 'DemoStoreContext';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeSlice(baseSlice, persistedSlice) {
  return isRecord(persistedSlice)
    ? {
        ...baseSlice,
        ...persistedSlice,
      }
    : baseSlice;
}

function mergePersistedState(baseState, persistedState) {
  if (!isRecord(persistedState)) {
    return baseState;
  }

  return {
    ...baseState,
    ...persistedState,
    session: mergeSlice(baseState.session, persistedState.session),
    profile: mergeSlice(baseState.profile, persistedState.profile),
    facilitator: mergeSlice(
      baseState.facilitator,
      persistedState.facilitator,
    ),
    selectedAccount: mergeSlice(
      baseState.selectedAccount,
      persistedState.selectedAccount,
    ),
    selectedOffer: mergeSlice(
      baseState.selectedOffer,
      persistedState.selectedOffer,
    ),
    transactionQuery: mergeSlice(
      baseState.transactionQuery,
      persistedState.transactionQuery,
    ),
    chat: mergeSlice(baseState.chat, persistedState.chat),
    notifications: mergeSlice(
      baseState.notifications,
      persistedState.notifications,
    ),
    analytics: mergeSlice(baseState.analytics, persistedState.analytics),
  };
}

function readInitialState(initialState, storageKey, persist) {
  const baseState =
    typeof initialState === 'function' ? initialState() : initialState;

  if (!persist) {
    return baseState;
  }

  try {
    const persistedState = DemoStore.get(storageKey, null);
    return mergePersistedState(baseState, persistedState);
  } catch {
    return baseState;
  }
}

function getInitialState(initialState, storageKey, persist) {
  return readInitialState(
    initialState || createInitialState,
    storageKey,
    persist,
  );
}

/**
 * Provides reducer-backed demo banking state and persistence synchronization.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Child components.
 * @param {string} props.storageKey Storage key used for persisted state.
 * @param {boolean} props.persist Whether state should be persisted.
 * @param {object|Function} props.initialState Optional initial state or state factory.
 * @returns {JSX.Element} Demo store context provider.
 */
function DemoStoreProvider({
  children,
  storageKey = DEFAULT_STATE_KEY,
  persist = true,
  initialState,
}) {
  const normalizedStorageKey =
    String(storageKey || DEFAULT_STATE_KEY).trim() || DEFAULT_STATE_KEY;
  const shouldPersist = persist !== false;
  const [state, dispatch] = useReducer(
    demoReducer,
    initialState,
    (providedInitialState) =>
      getInitialState(
        providedInitialState || createInitialState,
        normalizedStorageKey,
        shouldPersist,
      ),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!shouldPersist) {
      return undefined;
    }

    const unsubscribe = DemoStore.subscribe((change) => {
      if (!change) {
        return;
      }

      if (change.type === 'reset' || change.type === 'reset-marker') {
        dispatch({ type: 'demo/reset' });
        return;
      }

      if (change.source !== 'storage') {
        return;
      }

      if (change.type === 'remove') {
        dispatch({ type: 'demo/reset' });
        return;
      }

      if (
        change.type === 'set' &&
        change.key === normalizedStorageKey &&
        isRecord(change.value)
      ) {
        const currentSession = stateRef.current?.session;
        const incomingSession = change.value?.session;

        if (
          currentSession?.isAuthenticated === true &&
          incomingSession?.isAuthenticated !== true
        ) {
          return;
        }

        dispatch({
          type: 'demo/hydrate',
          payload: {
            state: mergePersistedState(createInitialState(), change.value),
          },
        });
      }
    });

    return unsubscribe;
  }, [normalizedStorageKey, shouldPersist]);

  useEffect(() => {
    if (!shouldPersist) {
      return;
    }

    try {
      DemoStore.set(normalizedStorageKey, state);
    } catch {
      // Persistence is best effort and must not interrupt application state updates.
    }
  }, [normalizedStorageKey, shouldPersist, state]);

  const reset = useCallback(() => {
    if (shouldPersist) {
      try {
        DemoStore.reset();
      } catch {
        // The reducer reset remains available when storage is unavailable.
      }
    }

    dispatch({ type: 'demo/reset' });
  }, [shouldPersist]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      reset,
      store: DemoStore,
      storageKey: normalizedStorageKey,
      persist: shouldPersist,
    }),
    [normalizedStorageKey, reset, shouldPersist, state],
  );

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

DemoStoreProvider.displayName = 'DemoStoreProvider';

function useDemoStore() {
  const context = useContext(DemoStoreContext);

  if (!context) {
    throw new Error(
      'useDemoStore must be used within a DemoStoreProvider.',
    );
  }

  return context;
}

function useDemoState() {
  return useDemoStore().state;
}

function useDemoDispatch() {
  return useDemoStore().dispatch;
}

export {
  DEFAULT_STATE_KEY,
  DemoStoreContext,
  DemoStoreProvider,
  useDemoStore,
  useDemoState,
  useDemoDispatch,
};

export default DemoStoreProvider;