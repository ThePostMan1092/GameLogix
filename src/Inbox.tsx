import React, { useEffect, useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from './Backend/AuthProvider';
import { db } from './Backend/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

interface SystemMessage {
  id: string;
  type: 'approval' | 'game' | 'tournament' | 'notification';
  content: string;
  createdAt: any;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

interface CreateMessageProps {
  senderId?: string;
  recipientId: string;
  type: 'approval' | 'game' | 'tournament' | 'notification';
  subject: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
}

export const sendSystemMessage = async ({
  senderId,
  recipientId,
  type,
  subject,
  content,
  actionLabel,
  actionUrl,
}: CreateMessageProps) => {
  await addDoc(collection(db, 'messages'), {
    senderId,
    recipientId,
    type,
    subject,
    content,
    actionLabel,
    actionUrl,
    createdAt: serverTimestamp(),
    read: false,
  });
};

// Custom convenience wrappers:

export const sendJoinApprovalRequest = async (adminId: string, playerName: string, playerId: string, leagueId: string) => {
  await sendSystemMessage({
    recipientId: adminId,
    type: 'approval',
    subject: 'Membership Approval Request',
    content: `${playerName} has requested to join your league.`,
    actionLabel: 'Review',
    actionUrl: `/leagues/${leagueId}/leagueSettings`,
    senderId: playerId
  });
};

export const notifyLeagueMembers = async (memberIds: string[], newPlayerName: string) => {
  console.log('[notifyLeagueMembers] called with:', memberIds, newPlayerName);
  if (!memberIds || memberIds.length === 0) {
    console.log('[notifyLeagueMembers] No memberIds provided, aborting.');
    return;
  }
  const promises = memberIds.map(memberId =>
    sendSystemMessage({
      recipientId: memberId,
      type: 'notification',
      subject: 'New League Member',
      actionLabel: "view",
      content: `${newPlayerName} has joined your league.`,
      actionUrl: ''
    })
  );
  try {
    await Promise.all(promises);
    console.log('[notifyLeagueMembers] All notifications sent.');
  } catch (e) {
    console.error('Failed to notify league members:', e);
  }
};


const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchMessages = async () => {
      try {
        const q = query(collection(db, 'messages'), where('recipientId', '==', user.uid));
        const snap = await getDocs(q);
        setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SystemMessage));
      } catch (e: any) {
        setError('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, read: true } : m));
    } catch {}
  };

  if (!user) return <Alert severity="info">Sign in to view your inbox.</Alert>;
  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Inbox
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        This is where you can view your messages and notifications.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box display="flex" flexDirection="column" gap={2}>
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No messages.</Typography>
        ) : (
          messages.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds).map(msg => (
            <Box key={msg.id} sx={{ p: 2, border: '1px solid #A7A29C', borderRadius: 2, bgcolor: msg.read ? 'background.paper' : '#ffe0b2', textAlign: 'left' }}>
              <Typography variant="subtitle1" fontWeight={700} color={msg.read ? 'text.primary' : 'primary.main'}>
                {msg.type === 'approval' && 'Membership Approval'}
                {msg.type === 'game' && 'Game Request'}
                {msg.type === 'tournament' && 'Tournament Update'}
                {msg.type === 'notification' && 'Notification'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>{msg.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleString()}
              </Typography>
              <Box mt={1} display="flex" gap={1}>
                {!msg.read && (
                  <Button size="small" color="primary" variant="outlined" onClick={() => handleMarkRead(msg.id)}>
                    Mark as Read
                  </Button>
                )}
                {msg.actionLabel && msg.actionUrl && (
                  <Button size="small" color="secondary" variant="contained" onClick={() => navigate(msg.actionUrl!)}>
                    {msg.actionLabel}
                  </Button>
                )}
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Inbox;