import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  getActiveProfile,
  getProfileAccounts,
  getProfileOffers,
  getVisibleAccounts,
} from '../services/ProfileService';
import { formatUserIdentifier } from '../utils/formatters';
import {
  useDemoDispatch,
  useDemoState,
  useDemoStore,
} from '../store/DemoStoreContext';

const CustomerProfileContext = createContext(null);

CustomerProfileContext.displayName = 'CustomerProfileContext';

function getSelectedAccount(state, accounts) {
  const selectedAccount = state?.selectedAccount?.account;
  const selectedAccountId = state?.selectedAccount?.id;

  return (
    accounts.find(
      (account) =>
        account.id === selectedAccount?.id ||
        account.accountId === selectedAccount?.accountId ||
        account.id === selectedAccountId ||
        account.accountId === selectedAccountId,
    ) || null
  );
}

function getSelectedOffer(state, offers) {
  const selectedOffer = state?.selectedOffer?.offer;
  const selectedOfferId = state?.selectedOffer?.id;

  return (
    offers.find(
      (offer) =>
        offer.id === selectedOffer?.id ||
        offer.offerId === selectedOffer?.offerId ||
        offer.id === selectedOfferId ||
        offer.offerId === selectedOfferId,
    ) || null
  );
}

/**
 * Provides the active customer profile and profile-dependent demo data.
 *
 * @param {object} props Provider properties.
 * @param {React.ReactNode} props.children Descendant components.
 * @returns {JSX.Element} Customer profile context provider.
 */
function CustomerProfileProvider({ children }) {
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { reset } = useDemoStore();

  const profile = getActiveProfile(state);
  const accounts = getProfileAccounts(profile, state);
  const visibleAccounts = getVisibleAccounts(profile, state);
  const offers = getProfileOffers(profile, state);
  const selectedAccount = getSelectedAccount(state, visibleAccounts);
  const selectedOffer = getSelectedOffer(state, offers);
  const maskedUserId = formatUserIdentifier(profile);

  const switchProfile = useCallback(
    (profileOrId) => {
      const nextProfile = getActiveProfile(profileOrId, state);

      if (!nextProfile) {
        return {
          success: false,
          profile: null,
          accounts: [],
          visibleAccounts: [],
          selectedAccount: null,
          selectedOffer: null,
          error: 'The profile could not be found.',
        };
      }

      const nextAccounts = getVisibleAccounts(nextProfile, state);
      const nextOffers = getProfileOffers(nextProfile, state);
      const nextAccount = nextAccounts[0] || null;

      dispatch({
        type: 'session/switchProfile',
        payload: {
          profileId: nextProfile.id,
          userId: nextProfile.userId || nextProfile.id,
        },
      });

      dispatch({
        type: 'profile/loadSuccess',
        payload: {
          profile: nextProfile,
          profileId: nextProfile.id,
        },
      });

      dispatch({ type: 'account/clearSelection' });
      dispatch({ type: 'offer/clearSelection' });

      if (nextAccount) {
        dispatch({
          type: 'account/select',
          payload: {
            id: nextAccount.id || nextAccount.accountId,
            account: nextAccount,
          },
        });
      }

      return {
        success: true,
        profile: nextProfile,
        profileId: nextProfile.id,
        userId: nextProfile.userId || nextProfile.id,
        accounts: getProfileAccounts(nextProfile, state),
        visibleAccounts: nextAccounts,
        offers: nextOffers,
        selectedAccount: nextAccount,
        selectedOffer: null,
        error: null,
      };
    },
    [dispatch, state],
  );

  const selectAccount = useCallback(
    (accountOrId) => {
      const identifier =
        typeof accountOrId === 'object'
          ? accountOrId?.id || accountOrId?.accountId
          : accountOrId;
      const account = visibleAccounts.find(
        (item) =>
          item.id === identifier ||
          item.accountId === identifier ||
          item.number === identifier ||
          item.accountNumber === identifier,
      );

      if (!account) {
        return null;
      }

      dispatch({
        type: 'account/select',
        payload: {
          id: account.id || account.accountId,
          account,
        },
      });

      return account;
    },
    [dispatch, visibleAccounts],
  );

  const selectOffer = useCallback(
    (offerOrId) => {
      const identifier =
        typeof offerOrId === 'object'
          ? offerOrId?.id || offerOrId?.offerId
          : offerOrId;
      const offer = offers.find(
        (item) => item.id === identifier || item.offerId === identifier,
      );

      if (!offer) {
        return null;
      }

      dispatch({
        type: 'offer/select',
        payload: {
          id: offer.id || offer.offerId,
          offer,
        },
      });

      return offer;
    },
    [dispatch, offers],
  );

  const clearSelections = useCallback(() => {
    dispatch({ type: 'account/clearSelection' });
    dispatch({ type: 'offer/clearSelection' });
  }, [dispatch]);

  const resetDemo = useCallback(() => {
    reset();
  }, [reset]);

  const value = useMemo(
    () => ({
      state,
      profile,
      activeProfile: profile,
      user: profile,
      accounts,
      visibleAccounts,
      profileAccounts: accounts,
      offers,
      selectedAccount,
      selectedOffer,
      maskedUserId,
      maskedUserIdentifier: maskedUserId,
      userId: profile?.userId || profile?.id || null,
      profileId: profile?.id || null,
      switchProfile,
      selectAccount,
      selectOffer,
      clearSelections,
      resetDemo,
      reset,
    }),
    [
      accounts,
      clearSelections,
      maskedUserId,
      offers,
      profile,
      reset,
      resetDemo,
      selectAccount,
      selectOffer,
      selectedAccount,
      selectedOffer,
      state,
      switchProfile,
      visibleAccounts,
    ],
  );

  return (
    <CustomerProfileContext.Provider value={value}>
      {children}
    </CustomerProfileContext.Provider>
  );
}

CustomerProfileProvider.displayName = 'CustomerProfileProvider';

function useCustomerProfile() {
  const context = useContext(CustomerProfileContext);

  if (!context) {
    throw new Error(
      'useCustomerProfile must be used within a CustomerProfileProvider.',
    );
  }

  return context;
}

export {
  CustomerProfileContext,
  CustomerProfileProvider,
  useCustomerProfile,
};

export default CustomerProfileProvider;