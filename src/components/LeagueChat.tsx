import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../Backend/AuthProvider';
import { useParams } from 'react-router-dom';
import { getMessages, sendMessage, type Message } from '../messaging';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Backend/firebase';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'achievement' | 'match_result' | 'trash_talk';
}

interface LeagueChatProps {
  leagueId?: string;
}

const LeagueChat: React.FC<LeagueChatProps> = ({ leagueId }) => {
  const { user } = useAuth();
  const { leagueId: paramLeagueId } = useParams();
  const currentLeagueId = leagueId || paramLeagueId;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch league data and conversation ID
  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!currentLeagueId) return;
      
      try {
        setLoading(true);
        const leagueDoc = await getDoc(doc(db, 'leagues', currentLeagueId));
        if (leagueDoc.exists()) {
          const leagueData = leagueDoc.data();
          const inboxConvoId = leagueData.inboxConvoId;
          setConversationId(inboxConvoId);
          
          if (inboxConvoId) {
            await fetchMessages(inboxConvoId);
          }
        } else {
          setError('League not found');
        }
      } catch (err) {
        console.error('Error fetching league data:', err);
        setError('Failed to load league chat');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [currentLeagueId]);

  // Fetch messages from the conversation
  const fetchMessages = async (convoId: string) => {
    try {
      const firebaseMessages = await getMessages(convoId);
      
      // Transform Firebase messages to our chat format
      const chatMessages: ChatMessage[] = firebaseMessages.map(msg => ({
        id: msg.id,
        userId: msg.senderId || 'system',
        userName: 'Unknown', // We'll need to fetch user names separately
        message: msg.content,
        timestamp: msg.timestamp?.toDate() || new Date(),
        type: msg.messageType === 'notification' ? 'match_result' : 'message'
      }));

      setMessages(chatMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !conversationId) return;

    try {
      // Send message using the real messaging system
      await sendMessage(conversationId, {
        conversationId,
        senderId: user.uid,
        subject: 'League Chat Message',
        content: newMessage.trim(),
        read: false,
        messageType: 'direct'
      });

      // Add message to local state immediately for better UX
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: user.displayName || user.email || 'You',
        userAvatar: user.photoURL || undefined,
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'message'
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Refresh messages to get the actual saved data
      setTimeout(() => {
        if (conversationId) fetchMessages(conversationId);
      }, 1000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'achievement':
        return <EmojiEventsIcon color="warning" fontSize="small" />;
      case 'match_result':
        return <SportsSoccerIcon color="primary" fontSize="small" />;
      case 'trash_talk':
        return <TrendingUpIcon color="secondary" fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box 
      data-testid="league-chat-component"
      className="league-chat-component"
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <Box 
        data-testid="chat-header"
        className="chat-header"
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="h6" fontWeight={600} color="primary">
          League Chat
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use this chat to coordinate your league's draft and talk trash all season long.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Roster moves, weekly reports, and trades will show up here as well.
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box 
          data-testid="chat-loading"
          className="chat-loading"
          sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box 
          data-testid="chat-error"
          className="chat-error"
          sx={{ p: 2 }}
        >
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Messages Area */}
      {!loading && !error && (
        <>
          <Box 
            data-testid="chat-messages-area"
            className="chat-messages-area"
            sx={{ 
              flex: 1, 
              p: 2, 
              overflowY: 'auto',
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '3px',
              },
            }}
          >
            {messages.length === 0 ? (
              <Box 
                data-testid="empty-messages-state"
                className="empty-messages-state"
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  No messages yet
                </Typography>
                <Typography variant="body2">
                  Be the first to start the conversation!
                </Typography>
              </Box>
            ) : (
              <Box 
                data-testid="messages-list"
                className="messages-list"
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {messages.map((message) => (
                  <Box 
                    key={message.id} 
                    data-testid={`message-${message.id}`}
                    className="chat-message"
                    sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                  >
                    <Avatar
                      src={message.userAvatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {message.userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                          {message.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                        {getMessageIcon(message.type)}
                        {message.type !== 'message' && (
                          <Chip 
                            label={message.type.replace('_', ' ')} 
                            size="small" 
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                        {message.message}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>

          {/* Message Input */}
          <Box 
            data-testid="chat-input-area"
            className="chat-input-area"
            sx={{ 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.default'
            }}
          >
            <Box 
              data-testid="chat-input-container"
              className="chat-input-container"
              sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter Message"
                variant="outlined"
                size="small"
                data-testid="message-input"
                className="message-input"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  }
                }}
              />
              <IconButton 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !conversationId}
                color="primary"
                data-testid="send-message-button"
                className="send-message-button"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabled',
                    color: 'action.disabled',
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default LeagueChat;
