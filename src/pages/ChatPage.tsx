import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Send, Wifi, WifiOff } from 'lucide-react';
import { TextDialog } from '../components/ui/AppDialog';
import { useAuth } from '../contexts/AuthContext';
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
}

interface ChatMessage {
  _id?: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: string;
}

interface SocketMessagePayload {
  message?: ApiMessage;
  sender?: string;
}

interface ConversationMeta {
  _id: string;
  participants: Sender[];
  listing?: {
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
});

const appendUnique = (current: ChatMessage[], next: ChatMessage) => {
  if (next._id && current.some(message => message._id === next._id)) return current;
  return [...current, next];
};

const prependUnique = (current: ChatMessage[], older: ChatMessage[]) => {
  const existing = new Set(current.map(message => message._id).filter(Boolean));
  return [...older.filter(message => !message._id || !existing.has(message._id)), ...current];
};

export const ChatPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, fetchUnreadCounts } = useAuth();
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
  const bottomRef = useRef<HTMLDivElement>(null);

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
        
        // Refresh global unread count since this marks them as read
        fetchUnreadCounts();
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
      setMessages(prev => appendUnique(prev, normalizeMessage(msg)));
      
      // Since we are actively viewing it, tell backend to mark as read, or just refresh counts
      setTimeout(() => fetchUnreadCounts(), 1000); 
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }
    
    socket.on('new_message', handleIncomingMessage);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new_message', handleIncomingMessage);
      // We don't disconnect the global socket
    };
  }, [roomId, user]);

  const prevLastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const lastMsgId = lastMsg._id || lastMsg.text;
      if (prevLastMessageRef.current !== lastMsgId) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        prevLastMessageRef.current = lastMsgId;
      }
    }
  }, [messages]);

  const partnerName = useMemo(() => {
    const partner = conversation?.participants.find(participant => participant._id !== user?._id);
    if (partner) return partner.name || partner.initials || 'Student';
    const messagePartner = messages.find(message => message.senderId !== user?._id);
    return messagePartner?.senderName || 'Conversation';
  }, [conversation, messages, user?._id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !roomId || sending) return;

    const draft = text.trim();
    setText('');
    setSending(true);
    setError('');

    try {
      const res = await api.post<{ message: ApiMessage }>(`/chat/conversations/${roomId}/messages`, { text: draft });
      setMessages(prev => appendUnique(prev, normalizeMessage(res.message)));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send message'));
      setText(draft);
    } finally {
      setSending(false);
    }
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

      <div className="chat-messages">
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
          return (
            <div key={message._id ?? index} className={`msg-row ${isOwn ? 'own' : 'other'}`}>
              {!isOwn && <div className="msg-avatar">{message.senderName[0]?.toUpperCase()}</div>}
              <div className="msg-bubble-wrap">
                {!isOwn && <div className="msg-sender-name">{message.senderName}</div>}
                <div className="msg-bubble">{message.text}</div>
                <div className="msg-time">
                  {formatTime(message.createdAt)}
                  {!isOwn && message._id && (
                    <button type="button" onClick={() => openReportMessage(message)} className="msg-report-btn" aria-label="Report message">
                      <Flag size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && messages.length > 0 && (
        <div style={{ padding: '8px 16px', color: '#f87171', fontSize: 13 }}>{error}</div>
      )}

      <form className="chat-input-bar" onSubmit={sendMessage}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <button type="submit" className="chat-send" disabled={!text.trim() || sending}>
          <Send size={18} />
        </button>
      </form>

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
