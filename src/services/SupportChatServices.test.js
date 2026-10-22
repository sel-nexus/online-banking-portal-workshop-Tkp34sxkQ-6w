import {
  CHAT_ESCALATION_COPY,
  CHAT_TOPIC_CHIPS,
} from '../fixtures/chat';
import { NOTIFICATIONS } from '../fixtures/notifications';
import { SUPPORT } from '../fixtures/support';
import {
  closeChat,
  getChatOfferLinks,
  getChatReply,
  minimizeChat,
  openChat,
  requestRepresentativeEscalation,
  resetChat,
  sendChatMessage,
} from './ChatService';
import {
  getSupportContent,
  submitSecureMessage,
  validateSecureMessage,
} from './SupportService';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './NotificationService';
import { createInitialState } from '../store/initialState';
import { demoReducer } from '../store/demoReducer';

describe('SupportChatServices', () => {
  describe('support content and secure-message workflow', () => {
    it('returns the configured support channels, FAQs, and secure-message form', () => {
      const support = getSupportContent();

      expect(support).toEqual(
        expect.objectContaining({
          id: SUPPORT.id,
          title: 'Help & Support',
          channels: expect.any(Array),
          faqs: expect.any(Array),
          secureMessage: expect.objectContaining({
            fields: expect.any(Array),
          }),
        }),
      );
      expect(support.channels.length).toBeGreaterThan(0);
      expect(support.faqs.length).toBeGreaterThan(0);
    });

    it('validates a complete secure message and rejects sensitive content', () => {
      const validResult = validateSecureMessage(
        {
          subject: 'Question about my account',
          category: 'Account access',
          message: 'Please explain how I can review my recent activity.',
        },
        { support: SUPPORT },
      );

      expect(validResult).toEqual(
        expect.objectContaining({
          valid: true,
          errors: [],
          value: expect.objectContaining({
            subject: 'Question about my account',
            category: 'Account access',
          }),
        }),
      );

      const invalidResult = validateSecureMessage(
        {
          subject: 'Account question',
          category: 'Account access',
          message: 'My password and PIN need to be updated.',
        },
        { support: SUPPORT },
      );

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'message',
          }),
        ]),
      );
    });

    it('returns a simulated receipt without sending message contents', async () => {
      const receipt = await submitSecureMessage(
        {
          subject: 'Transfer question',
          category: 'Transfers',
          message: 'How can I review a simulated transfer?',
        },
        {
          support: SUPPORT,
          duration: 300,
        },
      );

      expect(receipt).toEqual(
        expect.objectContaining({
          success: true,
          status: 'submitted',
          simulated: true,
          referenceId: expect.stringContaining('demo-support-'),
          category: 'Transfers',
          subject: 'Transfer question',
        }),
      );
      expect(receipt).not.toHaveProperty(
        'message',
        'How can I review a simulated transfer?',
      );
      expect(receipt.disclosure).toEqual(expect.any(String));
    });

    it('rejects an incomplete secure-message submission', async () => {
      await expect(
        submitSecureMessage(
          {
            subject: '',
            category: '',
            message: '',
          },
          { support: SUPPORT, duration: 300 },
        ),
      ).rejects.toMatchObject({
        code: 'SECURE_MESSAGE_VALIDATION_FAILED',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'subject' }),
          expect.objectContaining({ field: 'category' }),
          expect.objectContaining({ field: 'message' }),
        ]),
      });
    });
  });

  describe('scripted chat support', () => {
    it('returns scripted replies for supported topics and rejects blank messages', () => {
      expect(getChatReply('How do I check my balance?')).toEqual(
        expect.objectContaining({
          topic: 'balance',
          content: expect.stringContaining('simulated'),
        }),
      );
      expect(getChatReply(CHAT_TOPIC_CHIPS[1])).toEqual(
        expect.objectContaining({
          topic: 'cards',
          content: expect.stringContaining('card'),
        }),
      );

      expect(() => sendChatMessage('   ')).toThrow(
        expect.objectContaining({
          code: 'CHAT_INVALID_MESSAGE',
        }),
      );
    });

    it('creates user and assistant messages when a supported message is sent', () => {
      const dispatchedActions = [];
      const result = sendChatMessage('How do I make a payment?', {
        dispatch: (action) => dispatchedActions.push(action),
      });

      expect(result).toEqual(
        expect.objectContaining({
          topic: 'payments',
          message: expect.objectContaining({
            sender: 'user',
            content: 'How do I make a payment?',
          }),
          reply: expect.objectContaining({
            sender: 'assistant',
            content: expect.stringContaining('payment'),
          }),
        }),
      );
      expect(dispatchedActions).toHaveLength(2);
      expect(dispatchedActions.map((action) => action.type)).toEqual([
        'chat/sendMessage',
        'chat/reply',
      ]);
    });

    it('returns non-expired profile offer links for chat support', () => {
      const offerLinks = getChatOfferLinks('profile-miguel-rosa');

      expect(offerLinks.length).toBeGreaterThan(0);
      expect(offerLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'offer-miguel-cashback-2026',
            offerId: 'offer-miguel-cashback-2026',
            simulated: true,
            url: expect.any(String),
          }),
        ]),
      );
      expect(
        offerLinks.some((offer) => offer.id === 'offer-new-year-cashback-2026'),
      ).toBe(false);
    });

    it('returns no personalized offer links for an unknown profile', () => {
      expect(getChatOfferLinks('profile-does-not-exist')).toEqual([]);
    });
  });

  describe('chat lifecycle actions', () => {
    it('opens, minimizes, restores, and closes chat through the reducer', () => {
      let state = createInitialState();

      state = demoReducer(state, openChat());
      expect(state.chat).toEqual(
        expect.objectContaining({
          isOpen: true,
          isMinimized: false,
        }),
      );

      state = demoReducer(state, minimizeChat());
      expect(state.chat).toEqual(
        expect.objectContaining({
          isOpen: true,
          isMinimized: true,
        }),
      );

      state = demoReducer(state, {
        type: 'chat/restore',
      });
      expect(state.chat).toEqual(
        expect.objectContaining({
          isOpen: true,
          isMinimized: false,
        }),
      );

      state = demoReducer(state, closeChat());
      expect(state.chat).toEqual(
        expect.objectContaining({
          isOpen: false,
          isMinimized: false,
        }),
      );
    });

    it('resets the chat transcript and draft without reopening the conversation', () => {
      let state = createInitialState();

      state = demoReducer(state, openChat());
      state = demoReducer(state, {
        type: 'chat/setDraft',
        payload: { draft: 'A temporary question' },
      });
      state = demoReducer(state, {
        type: 'chat/sendMessage',
        payload: {
          content: 'A temporary question',
        },
      });

      const messageCountBeforeReset = state.chat.messages.length;
      expect(messageCountBeforeReset).toBeGreaterThan(0);

      state = demoReducer(state, resetChat());

      expect(state.chat).toEqual(
        expect.objectContaining({
          draft: '',
          activeTopic: null,
          isTyping: false,
          messages: [],
        }),
      );
    });
  });

  describe('support escalation', () => {
    it('creates a simulated representative-escalation confirmation', async () => {
      const dispatchedActions = [];
      const result = await requestRepresentativeEscalation({
        dispatch: (action) => dispatchedActions.push(action),
        duration: 300,
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          status: 'confirmed',
          simulated: true,
          requested: true,
          referenceId: expect.stringContaining('demo-escalation-'),
          message: CHAT_ESCALATION_COPY.confirmation,
        }),
      );
      expect(dispatchedActions.map((action) => action.type)).toEqual([
        'chat/requestEscalation',
        'chat/completeEscalation',
      ]);
    });
  });

  describe('notifications', () => {
    it('lists fixture notifications and reports their unread count', () => {
      const notifications = listNotifications({
        notifications: NOTIFICATIONS,
        includeRead: true,
        persist: false,
        usePersistence: false,
      });

      expect(notifications).toHaveLength(NOTIFICATIONS.length);
      expect(getUnreadNotificationCount({
        notifications: NOTIFICATIONS,
        includeRead: true,
        persist: false,
        usePersistence: false,
      })).toBe(2);
    });

    it('marks one notification and then all notifications as read locally', () => {
      const options = {
        notifications: NOTIFICATIONS,
        includeRead: true,
        persist: false,
        usePersistence: false,
      };
      const notification = markNotificationRead(
        NOTIFICATIONS[0].id,
        options,
      );

      expect(notification).toEqual(
        expect.objectContaining({
          id: NOTIFICATIONS[0].id,
          read: true,
          isRead: true,
          status: 'read',
        }),
      );

      const allRead = markAllNotificationsRead(options);

      expect(allRead).toEqual(
        expect.objectContaining({
          total: NOTIFICATIONS.length,
          unreadCount: 0,
          items: expect.arrayContaining([
            expect.objectContaining({
              read: true,
              isRead: true,
            }),
          ]),
        }),
      );
    });
  });
});