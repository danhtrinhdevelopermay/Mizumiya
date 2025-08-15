import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  // For development, you can use Firebase emulator or service account key
  // For production, use environment variables
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback to default credentials in development
      console.log('Firebase service account not configured, using local fallback');
    }
  } catch (error) {
    console.log('Firebase initialization skipped:', (error as Error).message);
  }
}

// Simple JSON file storage service as fallback when Firebase is not configured
class JSONFileStorage {
  private messages: Map<string, any[]> = new Map();
  private conversations: Map<string, any> = new Map();

  async saveMessage(conversationId: string, message: any): Promise<void> {
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, []);
    }
    this.messages.get(conversationId)!.push({
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    });
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    const messages = this.messages.get(conversationId) || [];
    return messages.slice(-limit);
  }

  async saveConversationMetadata(conversationId: string, metadata: any): Promise<void> {
    this.conversations.set(conversationId, {
      ...metadata,
      lastUpdated: new Date().toISOString(),
    });
  }

  async getConversationMetadata(conversationId: string): Promise<any | null> {
    return this.conversations.get(conversationId) || null;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    this.messages.delete(conversationId);
    this.conversations.delete(conversationId);
  }

  async archiveOldMessages(conversationId: string, daysOld: number = 30): Promise<number> {
    const messages = this.messages.get(conversationId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const recentMessages = messages.filter(msg => 
      new Date(msg.createdAt) > cutoffDate
    );
    
    const archivedCount = messages.length - recentMessages.length;
    this.messages.set(conversationId, recentMessages);
    
    return archivedCount;
  }
}

class FirebaseMessageStorage {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  async saveMessage(conversationId: string, message: any): Promise<void> {
    const messagesRef = this.db.collection('conversations').doc(conversationId).collection('messages');
    await messagesRef.add({
      ...message,
      createdAt: new Date(),
    });
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    const messagesRef = this.db.collection('conversations').doc(conversationId).collection('messages');
    const snapshot = await messagesRef
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString(),
    })).reverse();
  }

  async saveConversationMetadata(conversationId: string, metadata: any): Promise<void> {
    const conversationRef = this.db.collection('conversations').doc(conversationId);
    await conversationRef.set({
      ...metadata,
      lastUpdated: new Date(),
    }, { merge: true });
  }

  async getConversationMetadata(conversationId: string): Promise<any | null> {
    const conversationRef = this.db.collection('conversations').doc(conversationId);
    const doc = await conversationRef.get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    return {
      ...data,
      lastUpdated: data?.lastUpdated?.toDate?.()?.toISOString() || null,
    };
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const batch = this.db.batch();
    
    // Delete all messages in the conversation
    const messagesSnapshot = await this.db
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .get();
    
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete conversation metadata
    const conversationRef = this.db.collection('conversations').doc(conversationId);
    batch.delete(conversationRef);
    
    await batch.commit();
  }

  async archiveOldMessages(conversationId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const messagesRef = this.db.collection('conversations').doc(conversationId).collection('messages');
    const oldMessagesSnapshot = await messagesRef
      .where('createdAt', '<', cutoffDate)
      .get();
    
    const batch = this.db.batch();
    oldMessagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return oldMessagesSnapshot.size;
  }
}

// Export the appropriate storage service based on Firebase availability
export const messageStorage = (() => {
  try {
    if (getApps().length > 0) {
      console.log('Using Firebase for message storage');
      return new FirebaseMessageStorage();
    }
  } catch (error) {
    console.log('Firebase not available, using JSON file storage');
  }
  
  console.log('Using JSON file storage for messages');
  return new JSONFileStorage();
})();

export { FirebaseMessageStorage, JSONFileStorage };