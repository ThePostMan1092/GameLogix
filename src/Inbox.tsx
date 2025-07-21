import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { useAuth } from './Backend/AuthProvider';
import { db } from './Backend/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { getUserConversations } from './messaging';

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]); 
  console.log("conversations:", conversations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchConvAndMessages = async () => {
      try {
        const convos = await getUserConversations(user.uid);
        setConversations(convos);

        const inboxConversations = convos.filter(c => c.type === 'inbox');

        const allInboxMessages = await Promise.all(
          inboxConversations.map(async convo => {
            const baseCollection = collection(db, `conversations/${convo.id}/messages`);
            let q;
            // Use type assertion to access recipientIds if present
            const recipientIds = (convo as any).recipientIds;
            if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
              q = query(baseCollection, where('recipientIds', 'array-contains', user.uid));
            } else {
              q = query(baseCollection);
            }
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({
              id: doc.id,
              conversationId: convo.id,
              ...doc.data()
            }));
          })
        );
        setMessages(allInboxMessages.flat());
        messages.sort((a, b) => a.timestamp - b.timestamp);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again later.');
        setLoading(false);
      }
    };
    fetchConvAndMessages();
  }, [user]);

  const [messages, setMessages] = useState<any[]>([]);


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
          <Alert severity="info">No messages in your inbox.</Alert>
        ) : (
          messages.map(msg => (
            <Box key={msg.id} p={2} borderBottom="1px solid #eee">
              <Typography variant="subtitle2">{msg.subject}</Typography>
              <Typography variant="body2">{msg.content}</Typography>
              { msg.meta?.leagueId && (
                <Box>
                  <Button onClick={() => navigate(`/league/${msg.meta?.leagueId}/LeagueSettings/basic`)}>
                    review
                  </Button>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                {new Date(msg.timestamp?.toDate()).toLocaleString()}
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

export default Inbox;