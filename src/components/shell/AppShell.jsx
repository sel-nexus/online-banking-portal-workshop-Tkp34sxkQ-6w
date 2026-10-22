import React, {
  useEffect,
  useRef,
} from 'react';
import { Outlet } from 'react-router-dom';
import Alert from '../feedback/Alert';
import LiveRegion from '../accessibility/LiveRegion';
import Dialog from '../accessibility/Dialog';
import Footer from './Footer';
import Header from './Header';
import ChatPanel from '../chat/ChatPanel';
import { useAccess } from '../../contexts/AccessContext';
import { useCustomerProfile } from '../../contexts/CustomerProfileContext';
import {
  useAnnouncements,
  useToast,
} from '../../contexts/AppProviders';
import {
  closeChat,
  minimizeChat,
  openChat,
  resetChat,
} from '../../services/ChatService';
import {
  useDemoDispatch,
  useDemoState,
} from '../../store/DemoStoreContext';
import { CHAT_MESSAGES } from '../../config/messages';

const childrenPropType = () => null;

function formatRemainingTime(value) {
  const milliseconds = Number(value);

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '30 seconds';
  }

  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/**
 * Renders the authenticated application shell with Header, main content,
 * Footer, idle session warning modal, and BPI Bank Assistant chat panel.
 */
function AppShell({
  children,
  className = '',
  showFooter = true,
}) {
  const access = useAccess();
  const { offers, profileId } = useCustomerProfile();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { announcement } = useAnnouncements();
  const {
    dismissToast,
    showToast,
    toasts = [],
  } = useToast();
  const sessionWarningRef = useRef(null);

  const chat = state?.chat || {};
  const isChatOpen = chat.isOpen === true && chat.isMinimized !== true;
  const isChatMinimized = chat.isOpen === true && chat.isMinimized === true;
  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const remainingTime =
    access.remainingExpiryTime || access.remainingWarningTime || 30000;

  useEffect(() => {
    if (access.idleWarning) {
      sessionWarningRef.current?.focus();
    }
  }, [access.idleWarning]);

  const handleChatOpen = () => {
    openChat(dispatch);
  };

  const handleChatClose = () => {
    closeChat(dispatch);
  };

  const handleChatMinimize = () => {
    minimizeChat(dispatch);
  };

  const handleChatReset = () => {
    resetChat(dispatch);
    showToast('Chat transcript has been reset.', { variant: 'info' });
  };

  const handleContinueSession = () => {
    try {
      access.continueSession();
      showToast('Your session has been extended.', {
        variant: 'success',
      });
    } catch (error) {
      showToast(error?.message || 'Your session could not be extended.', {
        variant: 'error',
      });
    }
  };

  const handleSignOut = () => {
    access.logout();
  };

  const content = children === undefined ? <Outlet /> : children;

  return (
    <div className={`flex min-h-screen flex-col bg-background ${className}`.trim()}>
      <a
        className="sr-only z-50 rounded-md bg-surface px-4 py-3 text-sm font-semibold text-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-primary-500"
        href="#main-content"
      >
        Skip to main content
      </a>

      <Header onChatOpen={handleChatOpen} />

      <main className="flex-1" id="main-content" tabIndex="-1">
        {content}
      </main>

      {showFooter ? <Footer /> : null}

      {access.idleWarning ? (
        <Dialog
          closeOnEscape={false}
          closeOnOverlayClick={false}
          initialFocusRef={sessionWarningRef}
          label="Session timeout warning"
          open
          showCloseButton={false}
          title="Your session is about to expire"
        >
          <div className="space-y-4">
            <p className="text-sm text-foreground-muted">
              For your security, your session will expire in{' '}
              <strong className="text-foreground">
                {formatRemainingTime(remainingTime)}
              </strong>{' '}
              due to inactivity.
            </p>
            <p className="text-sm text-foreground-muted">
              Select Continue session to keep working, or sign out if you are
              finished.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                className="rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={handleContinueSession}
                ref={sessionWarningRef}
                type="button"
              >
                Continue session
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {isChatMinimized ? (
        <button
          aria-label="Restore BPI Bank Assistant chat"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
          onClick={handleChatOpen}
          type="button"
        >
          BPI Bank Assistant (Minimized)
        </button>
      ) : null}

      {!chat.isOpen ? (
        <button
          aria-label={CHAT_MESSAGES.open}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
          onClick={handleChatOpen}
          type="button"
        >
          <span>Chat With Us</span>
        </button>
      ) : null}

      <ChatPanel
        dispatch={dispatch}
        isMinimized={isChatMinimized}
        isOpen={isChatOpen}
        messages={messages}
        offers={offers}
        onClose={handleChatClose}
        onMinimize={handleChatMinimize}
        onReset={handleChatReset}
        profileId={profileId || access.profile?.id}
        state={state}
        title="BPI Bank Assistant"
      />

      {toasts.length ? (
        <div
          aria-label="Notifications"
          className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md flex-col gap-3 sm:right-6 sm:top-6"
          role="region"
        >
          {toasts.map((toast) => (
            <div className="pointer-events-auto" key={toast.id}>
              <Alert
                className="w-full shadow-lg"
                dismissible
                message={toast.message}
                onDismiss={() => dismissToast(toast.id)}
                role={toast.variant === 'info' ? 'status' : 'alert'}
                title={toast.title}
                variant={toast.variant}
              />
            </div>
          ))}
        </div>
      ) : null}

      <LiveRegion
        message={announcement?.message || ''}
        politeness={announcement?.politeness || 'polite'}
      />
    </div>
  );
}

AppShell.displayName = 'AppShell';

AppShell.propTypes = {
  children: childrenPropType,
  className: () => null,
  showFooter: () => null,
};

export default AppShell;
