import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Send, ShoppingBag, Wifi, WifiOff } from 'lucide-react';
import { TextDialog } from '../components/ui/AppDialog';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../contexts/PWAContext';
import { PWAGate } from '../components/ui/PWAGate';
import { api, getErrorMessage } from '../utils/api';
import { getSocket } from '../utils/socket';
import './Chat.css';

interface Sender {
  _id: string;
  name?: string;
  initials?: string;
  avatar?: string;
}

interface ApiMessage {
  _id?: string;
  sender: string | Sender;
  text: string;
  createdAt?: string;
  read?: boolean;
}

interface ChatMessage {
  _id?: string;
  clientId?: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: string;
  status?: 'sending' | 'sent' | 'failed';
  read?: boolean;
}

interface SocketMessagePayload {
  message?: ApiMessage;
  sender?: string;
}

interface ConversationMeta {
  _id: string;
  participants: Sender[];
  listing?: {
    _id?: string;
    title?: string;
    price?: number;
    images?: string[];
    isActive?: boolean;
  };
}

interface Pagination {
  hasMore: boolean;
  page: number;
}

const getSenderId = (sender: string | Sender) =>
  typeof sender === 'string' ? sender : sender._id;

const getSenderName = (sender: string | Sender) =>
  typeof sender === 'string' ? 'User' : sender.name || sender.initials || 'User';

const normalizeMessage = (message: ApiMessage): ChatMessage => ({
  _id: message._id,
  senderId: getSenderId(message.sender),
  senderName: getSenderName(message.sender),
  text: message.text,
  createdAt: message.createdAt,
  status: 'sent',
  read: message.read,
});

const reconcileMessage = (current: ChatMessage[], next: ChatMessage) => {
  if (next._id && current.some(message => message._id === next._id)) return current;
  if (next._id) {
    const optimisticIndex = current.findIndex(message =>
      !message._id &&
      message.status === 'sending' &&
      message.senderId === next.senderId &&
      message.text === next.text
    );
    if (optimisticIndex >= 0) {
      return current.map((message, index) => index === optimisticIndex ? next : message);
    }
  }
  return [...current, next];
};

const prependUnique = (current: ChatMessage[], older: ChatMessage[]) => {
  const existing = new Set(current.map(message => message._id).filter(Boolean));
  return [...older.filter(message => !message._id || !existing.has(message._id)), ...current];
};

const getMessageDayKey = (timestamp?: string) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toDateString();
};

const formatMessageDay = (timestamp?: string) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

const formatPrice = (price?: number) => {
  if (typeof price !== 'number') return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export const ChatPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, fetchUnreadCounts } = useAuth();
  const { showPushNudge } = usePWA();
  const hasNudgedRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [conversation, setConversation] = useState<ConversationMeta | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ hasMore: false, page: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const fetchUnreadCountsRef = useRef(fetchUnreadCounts);
  const [unseenIncomingCount, setUnseenIncomingCount] = useState(0);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const lastEmitTypingTimeRef = useRef(0);

  useEffect(() => {
    fetchUnreadCountsRef.current = fetchUnreadCounts;
  }, [fetchUnreadCounts]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!roomId) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get<{ messages: ApiMessage[]; conversation?: ConversationMeta; pagination?: Pagination }>(`/chat/conversations/${roomId}/messages?page=1&limit=40`);
        setMessages(res.messages.map(normalizeMessage));
        setConversation(res.conversation || null);
        setPagination(res.pagination || { hasMore: false, page: 1 });
        shouldStickToBottomRef.current = true;
        
        // Refresh global unread count since this marks them as read
        fetchUnreadCountsRef.current();
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load messages'));
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId]);

  const loadOlderMessages = async () => {
    if (!roomId || !pagination.hasMore || loadingOlder) return;
    setLoadingOlder(true);
    setError('');
    try {
      const nextPage = pagination.page + 1;
      const res = await api.get<{ messages: ApiMessage[]; pagination?: Pagination }>(`/chat/conversations/${roomId}/messages?page=${nextPage}&limit=40`);
      const container = messagesRef.current;
      prevScrollHeightRef.current = container?.scrollHeight ?? 0;
      isPrependingRef.current = true;
      setMessages(prev => prependUnique(prev, res.messages.map(normalizeMessage)));
      setPagination(res.pagination || { hasMore: false, page: nextPage });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load older messages'));
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = getSocket();
    if (!socket) return;

    const joinRoom = () => {
      setConnected(true);
      socket.emit('join_conversation', { conversationId: roomId });
    };
    
    const handleIncomingMessage = (payload: SocketMessagePayload) => {
      if (!payload.message) return;
      const msg = payload.message as ApiMessage;
      // Only append if it belongs to this conversation (the backend sends all new_messages to the user room too)
      // Actually, since we joined conv_roomId, we might get it twice if we don't check.
      // Wait, backend sends 'new_message' with { message: { conversationId, text... } } ?
      // Let's just append it, appendUnique handles duplicates by _id.
      setMessages(prev => reconcileMessage(prev, normalizeMessage(msg)));
      
      setPartnerTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Since we are actively viewing it, tell backend to mark as read, or just refresh counts
      setTimeout(() => fetchUnreadCountsRef.current(), 1000); 
    };

    const handlePartnerTyping = (data: { conversationId: string; userName: string }) => {
      if (data.conversationId !== roomId) return;
      setPartnerTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setPartnerTyping(false);
      }, 3000);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }
    
    socket.on('new_message', handleIncomingMessage);
    socket.on('typing_indicator', handlePartnerTyping);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new_message', handleIncomingMessage);
      socket.off('typing_indicator', handlePartnerTyping);
      // We don't disconnect the global socket
    };
  }, [roomId, user]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (partnerTyping && shouldStickToBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [partnerTyping]);

  const handleTyping = () => {
    if (!roomId) return;
    const now = Date.now();
    if (now - lastEmitTypingTimeRef.current > 1500) {
      lastEmitTypingTimeRef.current = now;
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('typing', { conversationId: roomId });
      }
    }
  };

  const prevLastMessageRef = useRef<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
    // Backup scroll to handle keyboard/layout reflows on mobile
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 100);
  };

  const updateStickiness = () => {
    const container = messagesRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    shouldStickToBottomRef.current = isNearBottom;
    if (isNearBottom) {
      setUnseenIncomingCount(0);
    }
  };

  useLayoutEffect(() => {
    if (isPrependingRef.current && messagesRef.current) {
      isPrependingRef.current = false;
      const container = messagesRef.current;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop += (newScrollHeight - prevScrollHeightRef.current);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const lastMsgId = lastMsg._id || lastMsg.clientId || lastMsg.text;
      if (prevLastMessageRef.current !== lastMsgId) {
        if (!prevLastMessageRef.current) {
          scrollToBottom('auto');
        } else {
          const isOwn = lastMsg.senderId === user?._id;
          if (isOwn) {
            scrollToBottom('auto');
          } else {
            if (shouldStickToBottomRef.current) {
              scrollToBottom('smooth');
            } else {
              setUnseenIncomingCount(prev => prev + 1);
            }
          }
        }
        prevLastMessageRef.current = lastMsgId;
      }
    }
  }, [messages, user?._id]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    // Scroll to bottom when text composer changes size (growth or shrinkage)
    if (shouldStickToBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [text]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      if (shouldStickToBottomRef.current) {
        scrollToBottom('auto');
      }
    };
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  const partnerName = useMemo(() => {
    const partner = conversation?.participants.find(participant => participant._id !== user?._id);
    if (partner) return partner.name || partner.initials || 'Student';
    const messagePartner = messages.find(message => message.senderId !== user?._id);
    return messagePartner?.senderName || 'Conversation';
  }, [conversation, messages, user?._id]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !roomId || sending) return;

    const draft = text.trim();
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      clientId,
      senderId: user?._id || 'me',
      senderName: user?.name || 'You',
      text: draft,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    const isFirstMessage = messages.length === 0 && !hasNudgedRef.current;

    setText('');
    setSending(true);
    setError('');
    shouldStickToBottomRef.current = true;
    // Scroll instantly to bottom before adding optimistic message
    // This prevents the "jump" caused by smooth scroll after textarea shrinks
    requestAnimationFrame(() => {
      const container = messagesRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    });
    setMessages(prev => reconcileMessage(prev, optimisticMessage));

    try {
      const res = await api.post<{ message: ApiMessage }>(`/chat/conversations/${roomId}/messages`, { text: draft });
      const confirmed = normalizeMessage(res.message);
      setMessages(prev => {
        let replaced = false;
        const next = prev.map(message => {
          if (message.clientId !== clientId) return message;
          replaced = true;
          return confirmed;
        });
        return replaced ? next : reconcileMessage(prev, confirmed);
      });

      if (isFirstMessage) {
        hasNudgedRef.current = true;
        showPushNudge();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send message'));
      setMessages(prev => prev.map(message =>
        message.clientId === clientId ? { ...message, status: 'failed' } : message
      ));
    } finally {
      setSending(false);
    }
  };

  const retryMessage = (message: ChatMessage) => {
    if (message.status !== 'failed') return;
    setMessages(prev => prev.filter(item => item.clientId !== message.clientId));
    setText(message.text);
    textareaRef.current?.focus();
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (chipText: string) => {
    setText(chipText);
    textareaRef.current?.focus();
  };

  const openReportMessage = (message: ChatMessage) => {
    if (!message._id || message.senderId === user?._id) return;
    setReportingMessage(message);
    setReportDetails('');
  };

  const submitMessageReport = async () => {
    if (!reportingMessage?._id || !reportDetails.trim()) return;
    setReporting(true);
    try {
      await api.post(`/chat/messages/${reportingMessage._id}/report`, { reason: 'other', details: reportDetails.trim() });
      setError('Message reported. Admin will review it.');
      setReportingMessage(null);
      setReportDetails('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to report message'));
    } finally {
      setReporting(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'now';
    return new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const userHasSentMessage = messages.some(m => m.senderId === user?._id && !m.clientId?.startsWith('local-'));
  const showQuickReplies = !userHasSentMessage && text === '' && !sending;

  const quickReplies = useMemo(() => {
    const price = conversation?.listing?.price;
    const hasPrice = typeof price === 'number';
    const formattedPrice = hasPrice ? formatPrice(price) : '';
    const cleanPrice = formattedPrice.startsWith('₹') ? formattedPrice : `₹${formattedPrice}`;

    return [
      { id: 'available',  label: 'Is this still available?',       text: 'Hi! Is this still available?' },
      {
        id: 'negotiate',
        label: hasPrice ? '💬 Can you do a lower price?' : 'Can you do a lower price?',
        text: hasPrice
          ? `Hi! Would you consider a price lower than ${cleanPrice} for this?`
          : 'Hi! Would you consider a lower price for this?'
      },
      { id: 'condition',  label: "What's the exact condition?",    text: 'Hi! Can you share more details about the condition?' },
      { id: 'pickup',     label: ' Where can we meet?',             text: 'Hi! Where would you like to meet for pickup?' },
      { id: 'photos',     label: 'Can you share more photos?',     text: 'Hi! Could you share a few more photos of the item?' },
    ];
  }, [conversation?.listing?.price]);

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="chat-avatar">{partnerName[0]?.toUpperCase()}</div>
        <div className="chat-header-info">
          <div className="chat-partner-name">{partnerName}</div>
          {conversation?.listing?.title && (
            <div className="chat-listing-title">{conversation.listing.title}</div>
          )}
          <div className="chat-status">
            {connected
              ? <><span className="status-dot online" />Connected</>
              : <><span className="status-dot offline" />Reconnecting...</>}
          </div>
        </div>
        <div className="chat-header-icon">
          {connected ? <Wifi size={16} color="#00e554" /> : <WifiOff size={16} color="#f87171" />}
        </div>
      </div>

      {conversation?.listing && (
        <button
          type="button"
          className="chat-listing-card"
          onClick={() => conversation.listing?._id && navigate(`/item/${conversation.listing._id}`)}
        >
          {conversation.listing.images?.[0] ? (
            <img src={conversation.listing.images[0]} alt="" />
          ) : (
            <div className="chat-listing-fallback"><ShoppingBag size={18} /></div>
          )}
          <div className="chat-listing-card-main">
            <span>{conversation.listing.title || 'Marketplace listing'}</span>
            <strong>{formatPrice(conversation.listing.price)}</strong>
          </div>
          {!conversation.listing.isActive && <em>Inactive</em>}
        </button>
      )}

      <div className="chat-messages" ref={messagesRef} onScroll={updateStickiness}>
        {loading && (
          <div className="chat-empty">
            <p>Loading messages...</p>
          </div>
        )}

        {!loading && error && messages.length === 0 && (
          <div className="chat-empty">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="chat-empty">
            <p>No messages yet. Say hello.</p>
          </div>
        )}

        {!loading && pagination.hasMore && (
          <button type="button" className="chat-load-older" onClick={loadOlderMessages} disabled={loadingOlder}>
            {loadingOlder ? 'Loading...' : 'Load Older Messages'}
          </button>
        )}

        {messages.map((message, index) => {
          const isOwn = message.senderId === user?._id;
          const previous = messages[index - 1];
          const showDateSeparator = !previous || getMessageDayKey(previous.createdAt) !== getMessageDayKey(message.createdAt);
          const isGroupedWithPrevious = !showDateSeparator && previous &&
            previous.senderId === message.senderId &&
            (new Date(message.createdAt || '').getTime() - new Date(previous.createdAt || '').getTime()) < 60000;
          return (
            <React.Fragment key={message._id ?? message.clientId ?? index}>
              {showDateSeparator && (
                <div className="chat-date-separator">
                  <span>{formatMessageDay(message.createdAt)}</span>
                </div>
              )}
              <div className={`msg-row ${isOwn ? 'own' : 'other'} ${message.status === 'failed' ? 'failed' : ''} ${isGroupedWithPrevious ? 'grouped' : ''}`}>
                {!isOwn && (
                  isGroupedWithPrevious ? (
                    <div className="msg-avatar-spacer" />
                  ) : (
                    <div className="msg-avatar">{message.senderName[0]?.toUpperCase()}</div>
                  )
                )}
                <div className="msg-bubble-wrap">
                  {!isOwn && !isGroupedWithPrevious && <div className="msg-sender-name">{message.senderName}</div>}
                  <div className="msg-bubble">{message.text}</div>
                  <div className="msg-time">
                    {message.status === 'sending' ? 'Sending...' : message.status === 'failed' ? (
                      <button type="button" className="msg-retry-btn" onClick={() => retryMessage(message)}>
                        Failed. Tap to edit
                      </button>
                    ) : formatTime(message.createdAt)}

                    {isOwn && message.status === 'sent' && (
                      <span className={`msg-status-check ${message.read ? 'read' : 'sent'}`}>
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}

                    {!isOwn && message._id && (
                      <button type="button" onClick={() => openReportMessage(message)} className="msg-report-btn" aria-label="Report message">
                        <Flag size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {partnerTyping && (
          <div className="msg-row other typing-row">
            <div className="msg-avatar">{partnerName[0]?.toUpperCase()}</div>
            <div className="msg-bubble-wrap">
              <div className="msg-bubble typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <PWAGate>
        {unseenIncomingCount > 0 && (
          <button
            type="button"
            className="unseen-pill"
            onClick={() => {
              scrollToBottom('smooth');
              setUnseenIncomingCount(0);
            }}
          >
            New message{unseenIncomingCount > 1 ? 's' : ''} ↓
            {unseenIncomingCount > 1 && <span className="unseen-badge">{unseenIncomingCount}</span>}
          </button>
        )}
        {showQuickReplies && (
          <div className="quick-replies">
            {quickReplies.map(chip => (
              <button
                key={chip.id}
                type="button"
                className="quick-reply-chip"
                onClick={() => handleQuickReply(chip.text)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {error && messages.length > 0 && (
          <div style={{ padding: '8px 16px', color: '#f87171', fontSize: 13 }}>{error}</div>
        )}

        <form className="chat-input-bar" onSubmit={sendMessage}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type a message..."
            value={text}
            onChange={e => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleComposerKeyDown}
            rows={1}
            autoFocus
          />
          <button type="submit" className="chat-send" disabled={!text.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </PWAGate>

      <TextDialog
        open={Boolean(reportingMessage)}
        title="Report message"
        description="Tell us what looks unsafe, abusive, or suspicious. Admin will review this message."
        value={reportDetails}
        placeholder="Write the reason for this report..."
        submitLabel="Send report"
        loading={reporting}
        onChange={setReportDetails}
        onCancel={() => setReportingMessage(null)}
        onSubmit={submitMessageReport}
      />
    </div>
  );
};
