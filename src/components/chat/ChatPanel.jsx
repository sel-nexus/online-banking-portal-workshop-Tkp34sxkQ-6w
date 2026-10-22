import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import LiveRegion from '../accessibility/LiveRegion';
import Button from '../ui/Button';
import {
  requestRepresentativeEscalation,
  resetChat,
  sendChatMessage,
  setChatDraft,
  setChatTopic,
} from '../../services/ChatService';
import {
  CHAT_ESCALATION_COPY,
  CHAT_PRIVACY_WARNING,
  CHAT_TOPIC_CHIPS,
  CHAT_TRANSCRIPT_MESSAGES,
} from '../../fixtures/chat';
import { SIMULATION_MESSAGES } from '../../config/messages';

const BASE_CLASSES =
  'fixed bottom-4 right-4 z-40 flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl sm:bottom-6 sm:right-6';

const DEFAULT_MESSAGES = CHAT_TRANSCRIPT_MESSAGES;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function getMessageContent(message) {
  return normalizeText(
    message?.content || message?.text || message?.message,
  );
}

function getMessageSender(message) {
  return message?.sender || message?.role || 'assistant';
}

function getMessageIdentifier(message, index) {
  return String(
    message?.id ||
      message?.messageId ||
      `chat-message-${index}`,
  );
}

function getTopicPrompt(topic) {
  return topic?.prompt || topic?.message || topic?.label || '';
}

function getOfferIdentifier(offer) {
  return offer?.id || offer?.offerId || null;
}

function getOfferName(offer) {
  return offer?.title || offer?.name || 'Offer';
}

function getOfferPath(offer) {
  const identifier = getOfferIdentifier(offer);

  return identifier
    ? `/offers/${encodeURIComponent(String(identifier))}`
    : null;
}

function createLocalMessage(content, sender, prefix) {
  const timestamp = new Date().toISOString();
  const id = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

  return {
    id,
    messageId: id,
    sender,
    role: sender,
    content,
    text: content,
    status: 'sent',
    createdAt: timestamp,
    sentAt: timestamp,
  };
}

/**
 * Renders the scripted BPI Bank Assistant chat panel per PRD Section 4 & Section 5.
 */
function ChatPanel({
  className = '',
  dispatch,
  isMinimized,
  isOpen,
  messages,
  onClose,
  onEscalation,
  onEscalationError,
  onMessageSend,
  onMinimize,
  onReset,
  onSend,
  onTopicSelect,
  onViewOffer,
  offers = [],
  open = true,
  placeholder = 'Type a message…',
  profileId,
  showTopics = true,
  state,
  title = 'BPI Bank Assistant',
  topicChips,
  topics,
  ...props
}) {
  const generatedId = useId();
  const inputId = `chat-message-${generatedId}`;
  const transcriptId = `chat-transcript-${generatedId}`;
  const inputRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState(DEFAULT_MESSAGES);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isPanelOpen = isOpen ?? open;
  const isPanelMinimized = isMinimized ?? false;
  const isControlledMessages = Array.isArray(messages);
  const transcript = isControlledMessages ? messages : localMessages;
  const resolvedTopics = useMemo(() => {
    const source = topicChips ?? topics ?? CHAT_TOPIC_CHIPS;

    return Array.isArray(source) ? source : [];
  }, [topicChips, topics]);
  const resolvedOffers = Array.isArray(offers) ? offers : [];
  const resolvedOnSend = onSend || onMessageSend;

  const primaryOffer = useMemo(() => {
    const isRosa = String(profileId || '').includes('rosa-santos') || String(profileId || '') === 'rosa';
    const targetId = isRosa
      ? 'offer-transfer-fee-waiver-2026'
      : 'offer-high-yield-savings-2026';
    const matched = resolvedOffers.find(
      (item) => getOfferIdentifier(item) === targetId,
    );
    if (matched) {
      return matched;
    }
    return {
      id: targetId,
      offerId: targetId,
      title: isRosa ? 'Home-loan fee waiver' : 'Peso Savings Bonus',
    };
  }, [profileId, resolvedOffers]);

  useEffect(() => {
    if (!isPanelOpen || isPanelMinimized) {
      return undefined;
    }

    inputRef.current?.focus();
    return undefined;
  }, [isPanelMinimized, isPanelOpen]);

  if (!isPanelOpen || isPanelMinimized) {
    return null;
  }

  const updateDraft = (value) => {
    setDraft(value);
    setChatDraft(value, dispatch);
  };

  const appendLocalMessage = (message) => {
    if (!isControlledMessages) {
      setLocalMessages((currentMessages) => [
        ...currentMessages,
        message,
      ]);
    }
  };

  const sendContent = (rawContent, topicValue) => {
    const content = normalizeText(rawContent);

    if (!content || isEscalating) {
      return;
    }

    setErrorMessage('');
    const userMessage = createLocalMessage(
      content,
      'user',
      'chat-user-message',
    );
    appendLocalMessage(userMessage);

    try {
      if (resolvedOnSend) {
        resolvedOnSend(content, userMessage);
      } else {
        const result = sendChatMessage(content, {
          dispatch,
          profileId,
          state,
          topic: topicValue,
        });

        if (!isControlledMessages && result?.reply) {
          appendLocalMessage(result.reply);
        }
      }

      updateDraft('');
    } catch (error) {
      setErrorMessage(
        error?.message || 'We could not send your message. Please try again.',
      );
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    sendContent(draft);
  };

  const handleTopicSelect = (topic) => {
    const prompt = getTopicPrompt(topic);

    onTopicSelect?.(topic);

    if (!prompt) {
      return;
    }

    setChatTopic(topic, dispatch);
    sendContent(prompt, topic?.value);
  };

  const handleReset = () => {
    setErrorMessage('');
    setEscalationNotice('');
    setDraft('');
    setLocalMessages([]);
    resetChat(dispatch);
    setChatDraft('', dispatch);
    onReset?.();
  };

  const handleEscalation = async () => {
    if (isEscalating) {
      return;
    }

    setErrorMessage('');
    setIsEscalating(true);

    try {
      const result = await requestRepresentativeEscalation({
        dispatch,
        duration: 150,
      });

      const confirmationText =
        result?.message || CHAT_ESCALATION_COPY.confirmation;
      setEscalationNotice(confirmationText);

      const assistantReply = createLocalMessage(
        confirmationText,
        'assistant',
        'chat-escalation-message',
      );
      appendLocalMessage(assistantReply);
      if (typeof dispatch === 'function') {
        dispatch({
          type: 'chat/reply',
          payload: assistantReply,
        });
      }

      onEscalation?.(result);
    } catch (error) {
      const message =
        error?.message ||
        CHAT_ESCALATION_COPY.unavailable;

      setErrorMessage(message);
      onEscalationError?.(error);
    } finally {
      setIsEscalating(false);
    }
  };

  const primaryOfferPath = getOfferPath(primaryOffer);
  const primaryOfferTitle = getOfferName(primaryOffer);

  return (
    <section
      {...props}
      aria-labelledby={`${transcriptId}-title`}
      className={`${BASE_CLASSES} ${className}`.trim()}
      id="chat-support-panel"
    >
      <header className="flex items-start justify-between gap-4 bg-primary px-4 py-3 text-white">
        <div className="min-w-0">
          <h2
            className="font-semibold text-white"
            id={`${transcriptId}-title`}
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-white/90">
            Welcome. Choose a topic or enter a question. This is a simulated conversation.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label="Minimize chat"
            className="rounded-md px-2 py-1 text-sm font-semibold leading-none text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={onMinimize}
            title="Minimize"
            type="button"
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            aria-label="Close chat"
            className="rounded-md px-2 py-1 text-sm font-semibold leading-none text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      <div
        aria-live="polite"
        aria-label="Chat transcript"
        className="max-h-72 space-y-3 overflow-y-auto p-4"
        id={transcriptId}
        role="log"
      >
        {transcript.length ? (
          transcript.map((message, index) => {
            const isUser = getMessageSender(message) === 'user';
            const content = getMessageContent(message);

            if (!content) {
              return null;
            }

            return (
              <div
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
                key={getMessageIdentifier(message, index)}
              >
                <span className="mb-1 text-[11px] font-medium text-foreground-muted">
                  {message.timestampLabel ? `${message.timestampLabel}, ` : ''}
                  {isUser ? 'Customer' : 'Assistant'}
                </span>
                <p
                  className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
                    isUser
                      ? 'border-border-accent/30 bg-bpi-rose text-foreground'
                      : 'border-border bg-surface-muted text-foreground'
                  }`}
                >
                  {content}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-foreground-muted">
            Welcome. Choose a topic or enter a question. This is a simulated conversation.
          </p>
        )}
      </div>

      {showTopics && resolvedTopics.length ? (
        <div className="border-t border-border px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            Topics
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {resolvedTopics.map((topic, index) => (
              <button
                className="rounded-full border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary hover:bg-primary-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                key={topic?.id || topic?.value || `topic-${index}`}
                onClick={() => handleTopicSelect(topic)}
                type="button"
              >
                {topic?.label || topic?.name || topic?.value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t border-border px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {primaryOfferPath ? (
            <Link
              aria-label={`View offer ${primaryOfferTitle}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-primary-700"
              onClick={() => onViewOffer?.(primaryOffer)}
              to={primaryOfferPath}
            >
              View offer ({primaryOfferTitle})
            </Link>
          ) : null}

          <button
            className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            disabled={isEscalating}
            onClick={handleEscalation}
            type="button"
          >
            {isEscalating
              ? 'Connecting (simulated)...'
              : CHAT_ESCALATION_COPY.actionLabel}
          </button>

          <button
            className="ml-auto text-xs font-semibold text-foreground-muted hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
        </div>

        {escalationNotice ? (
          <p className="mt-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-xs text-foreground">
            {escalationNotice}
          </p>
        ) : null}

        <div className="mt-2 rounded-md border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          <span className="font-semibold">{CHAT_PRIVACY_WARNING.title}: </span>
          <span>{CHAT_PRIVACY_WARNING.message}</span>
        </div>
      </div>

      <form
        className="border-t border-border bg-surface-muted p-3"
        onSubmit={handleSend}
      >
        <label className="sr-only" htmlFor={inputId}>
          Type a message
        </label>
        <div className="flex items-end gap-2">
          <textarea
            aria-label="Type a message"
            className="min-h-10 flex-1 resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            id={inputId}
            onChange={(event) => updateDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend(event);
              }
            }}
            placeholder={placeholder}
            ref={inputRef}
            rows="1"
            value={draft}
          />
          <Button
            disabled={!normalizeText(draft) || isEscalating}
            type="submit"
          >
            Send
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-foreground-muted">
          <span className="sr-only">{SIMULATION_MESSAGES.simulationOnly}</span>
          <span>BPI Digital Assistant • Bank-grade 256-bit encryption</span>
        </p>
      </form>

      <LiveRegion
        message={errorMessage}
        politeness="assertive"
      />
    </section>
  );
}

ChatPanel.displayName = 'ChatPanel';

ChatPanel.propTypes = {
  className: () => null,
  dispatch: () => null,
  isMinimized: () => null,
  isOpen: () => null,
  messages: () => null,
  onClose: () => null,
  onEscalation: () => null,
  onEscalationError: () => null,
  onMessageSend: () => null,
  onMinimize: () => null,
  onReset: () => null,
  onSend: () => null,
  onTopicSelect: () => null,
  onViewOffer: () => null,
  offers: () => null,
  open: () => null,
  placeholder: () => null,
  profileId: () => null,
  showTopics: () => null,
  state: () => null,
  title: () => null,
  topicChips: () => null,
  topics: () => null,
};

export {
  createLocalMessage,
  getMessageContent,
  getMessageIdentifier,
  getMessageSender,
  getOfferName,
  getOfferPath,
  getTopicPrompt,
};

export default ChatPanel;
