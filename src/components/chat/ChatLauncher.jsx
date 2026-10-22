import React, {
  forwardRef,
  useId,
  useRef,
} from 'react';
import { openChat } from '../../services/ChatService';

const childrenPropType = () => null;

const BASE_CLASSES =
  'fixed bottom-4 right-4 z-40 flex max-w-sm items-end gap-3 sm:bottom-6 sm:right-6';

const INVITATION_CLASSES =
  'hidden max-w-xs rounded-xl border border-border bg-surface p-4 text-left shadow-lg sm:block';

const BUTTON_CLASSES =
  'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-white shadow-lg transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

function assignRef(ref, value) {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  ref.current = value;
}

/**
 * Renders the persistent signed-in chat-support launcher.
 *
 * The launcher is a local demonstration control. Opening it dispatches the
 * shared chat-open action and invokes the supplied callback so the host shell
 * can render the chat surface. The trigger ref remains available for focus
 * restoration when the chat surface closes.
 *
 * @param {object} props Component properties.
 * @param {Function} props.dispatch Optional demo-store dispatcher.
 * @param {boolean} props.isOpen Whether the chat surface is currently open.
 * @param {boolean} props.isMinimized Whether the chat surface is minimized.
 * @param {boolean} props.showInvitation Whether to show invitation copy.
 * @param {React.ReactNode} props.invitationTitle Invitation heading.
 * @param {React.ReactNode} props.invitationCopy Invitation message.
 * @param {string} props.label Accessible launcher label.
 * @param {string} props.title Invitation heading.
 * @param {Function} props.onOpen Callback invoked when chat is opened.
 * @param {Function} props.onChatOpen Alias for onOpen.
 * @param {Function} props.onRequestOpen Alias for onOpen.
 * @param {object|Function} props.triggerRef Ref used for focus restoration.
 * @param {string} props.className Additional launcher classes.
 * @returns {JSX.Element} Chat launcher.
 */
const ChatLauncher = forwardRef(function ChatLauncher({
  className = '',
  dispatch,
  invitationCopy = 'Have a question? Our simulated support team is here to help.',
  invitationTitle = 'Need help?',
  isMinimized = false,
  isOpen = false,
  label = 'Open chat support',
  onChatOpen,
  onOpen,
  onRequestOpen,
  showInvitation = true,
  title = 'Chat support',
  triggerRef,
  ...props
}) {
  const buttonRef = useRef(null);
  const chatLabelId = useId();
  const resolvedOnOpen = onOpen || onChatOpen || onRequestOpen;
  const isLauncherVisible = !isOpen || isMinimized;

  if (!isLauncherVisible) {
    return null;
  }

  const setButtonRef = (element) => {
    buttonRef.current = element;
    assignRef(triggerRef, element);
    assignRef(props.ref, element);
  };

  const handleOpen = (event) => {
    openChat(dispatch);
    resolvedOnOpen?.(event, buttonRef.current);
  };

  const {
    ref: ignoredRef,
    ...buttonProps
  } = props;

  void ignoredRef;

  return (
    <div className={`${BASE_CLASSES} ${className}`.trim()}>
      {showInvitation ? (
        <div
          aria-labelledby={chatLabelId}
          className={INVITATION_CLASSES}
          role="status"
        >
          <p
            className="font-semibold text-foreground"
            id={chatLabelId}
          >
            {invitationTitle}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {invitationCopy}
          </p>
        </div>
      ) : null}

      <button
        {...buttonProps}
        aria-controls="chat-support-panel"
        aria-expanded={isOpen && !isMinimized}
        aria-label={label}
        className={`${BUTTON_CLASSES} ${
          buttonProps.className || ''
        }`.trim()}
        onClick={handleOpen}
        ref={(element) => {
          setButtonRef(element);
          assignRef(ref, element);
        }}
        type="button"
      >
        <span aria-hidden="true">☎</span>
        <span className="sr-only">{title}</span>
      </button>
    </div>
  );
});

ChatLauncher.displayName = 'ChatLauncher';

ChatLauncher.propTypes = {
  className: () => null,
  dispatch: () => null,
  invitationCopy: childrenPropType,
  invitationTitle: childrenPropType,
  isMinimized: () => null,
  isOpen: () => null,
  label: () => null,
  onChatOpen: () => null,
  onOpen: () => null,
  onRequestOpen: () => null,
  showInvitation: () => null,
  title: () => null,
  triggerRef: () => null,
};

export default ChatLauncher;