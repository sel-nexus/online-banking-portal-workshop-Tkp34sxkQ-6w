import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import AnalyticsService from '../services/AnalyticsService';
import {
  useDemoDispatch,
  useDemoState,
} from '../store/DemoStoreContext';

const AnalyticsContext = createContext(null);

AnalyticsContext.displayName = 'AnalyticsContext';

function getAnalyticsState(state) {
  return state?.analytics || {
    status: 'idle',
    events: [],
    lastEvent: null,
    lastTrackedAt: null,
    error: null,
  };
}

/**
 * Provides access to local synthetic analytics tracking and retrieval.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Analytics context provider.
 */
function AnalyticsProvider({ children }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const analyticsState = getAnalyticsState(state);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const trackEvent = useCallback(
    (eventOrName, properties = {}, options = {}) => {
      try {
        setError(null);

        if (
          eventOrName &&
          typeof eventOrName === 'object' &&
          !Array.isArray(eventOrName)
        ) {
          return AnalyticsService.trackEvent(eventOrName, {
            ...options,
            dispatch,
          });
        }

        return AnalyticsService.trackEvent(eventOrName, properties, {
          ...options,
          dispatch,
        });
      } catch (trackingError) {
        setError(trackingError);
        throw trackingError;
      }
    },
    [dispatch],
  );

  const listEvents = useCallback(
    (options = {}) => {
      try {
        setError(null);

        return AnalyticsService.listEvents({
          ...options,
          state,
        });
      } catch (listingError) {
        setError(listingError);
        throw listingError;
      }
    },
    [state],
  );

  const queryEvents = useCallback(
    (options = {}) => {
      try {
        setError(null);

        return AnalyticsService.queryEvents({
          ...options,
          state,
        });
      } catch (queryError) {
        setError(queryError);
        throw queryError;
      }
    },
    [state],
  );

  const retrieveEvents = useCallback(
    async (options = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        return await AnalyticsService.retrieveEvents({
          ...options,
          state,
        });
      } catch (retrievalError) {
        setError(retrievalError);
        throw retrievalError;
      } finally {
        setIsLoading(false);
      }
    },
    [state],
  );

  const clearEvents = useCallback(
    (options = {}) => {
      try {
        setError(null);

        return AnalyticsService.clearEvents({
          ...options,
          dispatch,
        });
      } catch (clearError) {
        setError(clearError);
        throw clearError;
      }
    },
    [dispatch],
  );

  const value = useMemo(
    () => ({
      state,
      analytics: analyticsState,
      events: analyticsState.events || [],
      lastEvent: analyticsState.lastEvent || null,
      lastTrackedAt: analyticsState.lastTrackedAt || null,
      status: analyticsState.status || 'idle',
      isLoading,
      loading: isLoading,
      error: error || analyticsState.error || null,
      trackEvent,
      track: trackEvent,
      recordEvent: trackEvent,
      logEvent: trackEvent,
      listEvents,
      getEvents: listEvents,
      queryEvents,
      retrieveEvents,
      fetchEvents: retrieveEvents,
      clearEvents,
      clear: clearEvents,
      clearAnalytics: clearEvents,
      resetAnalytics: clearEvents,
    }),
    [
      analyticsState,
      clearEvents,
      error,
      isLoading,
      listEvents,
      queryEvents,
      retrieveEvents,
      state,
      trackEvent,
    ],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

AnalyticsProvider.displayName = 'AnalyticsProvider';

function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error(
      'useAnalytics must be used within an AnalyticsProvider.',
    );
  }

  return context;
}

export {
  AnalyticsContext,
  AnalyticsProvider,
  useAnalytics,
};

export default AnalyticsProvider;