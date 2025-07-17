import { db } from './Backend/firebase'; // Adjust the import based on your project structure
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, updateDoc, doc, arrayUnion } from 'firebase/firestore';

export interface Conversation {
    id: string;
    name?: string;
    type: 'direct' | 'inbox' | 'review';
    participants: string[];
    messages?: Message[];
}

export interface Message {
    id: string;
    conversationId: string;
    senderId?: string;
    recipientIds?: string[];
    subject: string;
    content: string;
    timestamp: any; // Firestore Timestamp
    read: boolean;
    messageType: 'direct' | 'request' | 'notification';
    meta?: {
        leagueId?: string;
        status?: 'pending' | 'approved' | 'rejected';
        actionRequiredBy?: string;
        targetUserId?: string;
    };
}


// 1. Fetch user’s conversations
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
    orderBy("lastUpdated", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
}

// 2. Fetch messages in a conversation
export async function getMessages(conversationId: string): Promise<Message[]> {
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

// 3. Send a message
export async function sendMessage(
  conversationId: string,
  message: Omit<Message, "id" | "timestamp">
) {
  const messageRef = collection(db, `conversations/${conversationId}/messages`);

  await addDoc(messageRef, {
    ...message,
    timestamp: serverTimestamp()
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastUpdated: serverTimestamp()
  });
}

// 4. Mark message as read
export async function markMessageAsRead(conversationId: string, messageId: string) {
  await updateDoc(doc(db, `conversations/${conversationId}/messages`, messageId), {
    read: true
  });
}

// 5. Create a new conversation
export async function createConversation(
  subject: string,
  participants: string[],
  type: "direct" | "inbox" | "review"
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "conversations"), {
      subject,
      participants,
      type,
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
}

export async function addUserToLeagueConversations(userId: string, leagueId: string): Promise<void> {
  const leagueSnap = await getDocs(query(collection(db, 'leagues'), where('id', '==', leagueId)));
  const leagueData = leagueSnap.docs[0]?.data();
  const inboxConvo = doc(db, "conversations", leagueData?.inboxConvoId);
  await updateDoc(inboxConvo, {
    participants: arrayUnion(userId)
  });
  const dmConvo = doc(db, "conversations", leagueData?.dmConvoId);
  await updateDoc(dmConvo, {
    participants: arrayUnion(userId)
  });
}
