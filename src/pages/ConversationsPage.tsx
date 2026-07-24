import React, { useEffect, useState } from 'react';
import { MessageCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { SkeletonConversation } from '../components/ui/SkeletonCard';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import './WorkspacePages.css';

interface Conversation {
  _id: string;
  participants: Array<{ _id: string; name: string; initials?: string }>;
  listing?: { title?: string; price?: number; images?: string[] };
  lastMessage?: string;
  unreadCount?: number;
  isBlocked?: boolean;
  updatedAt?: string;
}

interface Pagination {
  hasMore: boolean;
  page: number;
}

export const ConversationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ hasMore: false, page: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await api.get<{ conversations: Conversation[]; pagination?: Pagination }>('/chat/conversations?page=1&limit=20');
      setConversations(res.conversations);
      setPagination(res.pagination || { hasMore: false, page: 1 });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load conversations'));
    }
  };

  const handleRefresh = async () => {
    await loadConversations();
  };

  const { pullDistance, isRefreshing } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadConversations();
      setLoading(false);
    };
    load();
  }, []);

  const loadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const nextPage = pagination.page + 1;
      const res = await api.get<{ conversations: Conversation[]; pagination?: Pagination }>(`/chat/conversations?page=${nextPage}&limit=20`);
      setConversations(prev => [...prev, ...res.conversations]);
      setPagination(res.pagination || { hasMore: false, page: nextPage });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load more conversations'));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    import('../utils/socket').then(({ getSocket }) => {
      const socket = getSocket();
      if (!socket) return;

      const handleNewMessage = (payload: { message: { conversationId?: string; conversation?: string; text?: string } }) => {
        const msg = payload.message;
        const convId = msg.conversationId || msg.conversation;
        if (!convId) return;

        setConversations(prev => prev.map(c => {
          if (c._id === convId) {
            return {
              ...c,
              unreadCount: (c.unreadCount || 0) + 1,
              lastMessage: msg.text || c.lastMessage
            };
          }
          return c;
        }));
      };

      socket.on('new_message', handleNewMessage);
      return () => {
        socket.off('new_message', handleNewMessage);
      };
    }).catch(() => {});
  }, []);

  return (
    <div className="workspace-page container">
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="pull-to-refresh-indicator" 
          style={{ 
            transform: `translateY(${Math.min(pullDistance, 80)}px) translateX(-50%)`,
            opacity: Math.min(pullDistance / 60, 1)
          }}
        >
          {isRefreshing ? <span className="refresh-spinner" /> : '↓ Pull to refresh'}
        </div>
      )}
      <div className="workspace-header">
        <div>
          <h1>Messages</h1>
          <p>Your campus conversations in one place.</p>
        </div>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {loading ? (
        <div className="workspace-list">
          {Array.from({ length: 5 }, (_, i) => <SkeletonConversation key={i} />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">No conversations yet. Start by messaging a seller.</div>
      ) : (
        <div className="workspace-list">
          {conversations.map(conversation => {
            const partner = conversation.participants.find(participant => participant._id !== user?._id) || conversation.participants[0];
            return (
              <button className="workspace-card" key={conversation._id} onClick={() => navigate(`/messages/${conversation._id}`)} style={{ textAlign: 'left' }}>
                <div className="workspace-card-main">
                  <img src={conversation.listing?.images?.[0] || '/favicon.svg'} alt="" />
                  <div>
                    <div className="card-kicker">
                      {conversation.isBlocked ? <ShieldAlert size={14} /> : <MessageCircle size={14} />}
                      {conversation.unreadCount || 0} unread
                    </div>
                    <h2>{conversation.listing?.title || 'Conversation'}</h2>
                    <p>{conversation.lastMessage || 'Open chat'}</p>
                    <p className="muted">With {partner?.name || 'Student'}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {pagination.hasMore && (
            <button className="apply-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
