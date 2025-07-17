export interface InboxMessage {
    id: string;
    senderId: string;
    receiverId: string;
    subject: string;
    content: string;
    timestamp: any; // Firestore Timestamp
    read: boolean;
    archived: boolean;
}