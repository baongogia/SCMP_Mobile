import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/src/constants/config";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  chatType: "learningPath" | "consultation";
  userId?: string;
  conversationId?: string; // ID để group messages thành conversations
}

export interface Conversation {
  id: string;
  chatType: "learningPath" | "consultation";
  title: string; // First message or user-defined
  lastMessage: string;
  lastMessageTime: number;
  messageCount: number;
  userId?: string;
}

class ChatDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private dbName = "chat_messages.db";

  async initDatabase(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        console.warn("SQLite không được hỗ trợ trên web");
        return;
      }

      if (!this.db) {
        this.db = await SQLite.openDatabaseAsync(this.dbName);
        await this.createTables();
        console.log("✅ Chat database initialized");
      }
    } catch (error) {
      console.error("❌ Error initializing database:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Create tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          isUser INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          chatType TEXT NOT NULL,
          userId TEXT,
          conversationId TEXT,
          createdAt INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY NOT NULL,
          chatType TEXT NOT NULL,
          title TEXT NOT NULL,
          lastMessage TEXT,
          lastMessageTime INTEGER NOT NULL,
          messageCount INTEGER DEFAULT 0,
          userId TEXT,
          createdAt INTEGER DEFAULT (strftime('%s', 'now')),
          updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);

      // Migration: Add conversationId column if it doesn't exist
      // SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
      // So we catch the error if column already exists
      try {
        await this.db.execAsync(`
          ALTER TABLE chat_messages ADD COLUMN conversationId TEXT;
        `);
        console.log("✅ Migration: Added conversationId column");
      } catch (migrationError: any) {
        // If column already exists, SQLite will throw an error
        // We ignore it as the column is already there
        const errorMsg = String(migrationError?.message || migrationError || "");
        if (errorMsg.toLowerCase().includes("duplicate column")) {
          console.log("ℹ️ conversationId column already exists");
        } else {
          // Other errors (like table doesn't exist) are fine, table will be created above
          console.log("ℹ️ Migration check completed");
        }
      }

      // Create indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_chattype
        ON chat_messages(userId, chatType, timestamp);

        CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
        ON chat_messages(conversationId, timestamp);

        CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp
        ON chat_messages(timestamp);

        CREATE INDEX IF NOT EXISTS idx_conversations_user_chattype
        ON conversations(userId, chatType, updatedAt);
      `);
      console.log("✅ Chat tables created");
    } catch (error) {
      console.error("❌ Error creating tables:", error);
      throw error;
    }
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    try {
      if (!this.db) {
        await this.initDatabase();
      }
      if (!this.db) return;

      // Get current user ID
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      await this.db.runAsync(
        `INSERT OR REPLACE INTO chat_messages
         (id, text, isUser, timestamp, chatType, userId, conversationId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.text,
          message.isUser ? 1 : 0,
          message.timestamp,
          message.chatType,
          userId || null,
          message.conversationId || null,
        ]
      );
    } catch (error) {
      console.error("❌ Error saving message:", error);
      // Don't throw - allow app to continue even if save fails
    }
  }

  async saveMessages(messages: ChatMessage[]): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      // Get current user ID
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      // Use transaction for better performance
      await this.db.withTransactionAsync(async () => {
        for (const message of messages) {
          await this.db!.runAsync(
            `INSERT OR REPLACE INTO chat_messages
             (id, text, isUser, timestamp, chatType, userId, conversationId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              message.id,
              message.text,
              message.isUser ? 1 : 0,
              message.timestamp,
              message.chatType,
              userId || null,
              message.conversationId || null,
            ]
          );
        }
      });
    } catch (error) {
      console.error("❌ Error saving messages:", error);
      throw error;
    }
  }

  async loadMessages(
    chatType: "learningPath" | "consultation",
    conversationId?: string,
    limit: number = 100
  ): Promise<ChatMessage[]> {
    try {
      if (!this.db) {
        await this.initDatabase();
      }
      if (!this.db) return [];

      // Get current user ID
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      let query: string;
      let params: any[];

      if (conversationId) {
        query = userId
          ? `SELECT * FROM chat_messages
             WHERE chatType = ? AND userId = ? AND conversationId = ?
             ORDER BY timestamp ASC
             LIMIT ?`
          : `SELECT * FROM chat_messages
             WHERE chatType = ? AND userId IS NULL AND conversationId = ?
             ORDER BY timestamp ASC
             LIMIT ?`;
        params = userId
          ? [chatType, userId, conversationId, limit]
          : [chatType, conversationId, limit];
      } else {
        query = userId
          ? `SELECT * FROM chat_messages
             WHERE chatType = ? AND userId = ? AND (conversationId IS NULL OR conversationId = '')
             ORDER BY timestamp ASC
             LIMIT ?`
          : `SELECT * FROM chat_messages
             WHERE chatType = ? AND userId IS NULL AND (conversationId IS NULL OR conversationId = '')
             ORDER BY timestamp ASC
             LIMIT ?`;
        params = userId ? [chatType, userId, limit] : [chatType, limit];
      }

      const result = await this.db.getAllAsync<{
        id: string;
        text: string;
        isUser: number;
        timestamp: number;
        chatType: string;
        userId: string | null;
        conversationId: string | null;
      }>(query, params);

      return result.map((row) => ({
        id: row.id,
        text: row.text,
        isUser: row.isUser === 1,
        timestamp: row.timestamp,
        chatType: row.chatType as "learningPath" | "consultation",
        userId: row.userId || undefined,
        conversationId: row.conversationId || undefined,
      }));
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      return [];
    }
  }

  async deleteMessages(
    chatType: "learningPath" | "consultation"
  ): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      await this.db.runAsync(
        `DELETE FROM chat_messages
         WHERE chatType = ? ${userId ? "AND userId = ?" : "AND userId IS NULL"}`,
        userId ? [chatType, userId] : [chatType]
      );
    } catch (error) {
      console.error("❌ Error deleting messages:", error);
      throw error;
    }
  }

  async deleteAllMessages(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      await this.db.runAsync(`DELETE FROM chat_messages`);
    } catch (error) {
      console.error("❌ Error deleting all messages:", error);
      throw error;
    }
  }

  async getMessageCount(
    chatType: "learningPath" | "consultation"
  ): Promise<number> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return 0;

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM chat_messages
         WHERE chatType = ? ${userId ? "AND userId = ?" : "AND userId IS NULL"}`,
        userId ? [chatType, userId] : [chatType]
      );

      return result?.count || 0;
    } catch (error) {
      console.error("❌ Error getting message count:", error);
      return 0;
    }
  }

  async createConversation(
    conversation: Omit<Conversation, "userId">
  ): Promise<string> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) throw new Error("Database not initialized");

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      await this.db.runAsync(
        `INSERT OR REPLACE INTO conversations
         (id, chatType, title, lastMessage, lastMessageTime, messageCount, userId, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conversation.id,
          conversation.chatType,
          conversation.title,
          conversation.lastMessage || null,
          conversation.lastMessageTime,
          conversation.messageCount || 0,
          userId || null,
          Date.now(),
        ]
      );

      return conversation.id;
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      throw error;
    }
  }

  async updateConversation(
    conversationId: string,
    updates: Partial<Omit<Conversation, "id" | "userId">>
  ): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push("title = ?");
        values.push(updates.title);
      }
      if (updates.lastMessage !== undefined) {
        updateFields.push("lastMessage = ?");
        values.push(updates.lastMessage);
      }
      if (updates.lastMessageTime !== undefined) {
        updateFields.push("lastMessageTime = ?");
        values.push(updates.lastMessageTime);
      }
      if (updates.messageCount !== undefined) {
        updateFields.push("messageCount = ?");
        values.push(updates.messageCount);
      }

      updateFields.push("updatedAt = ?");
      values.push(Date.now());
      values.push(conversationId);

      await this.db.runAsync(
        `UPDATE conversations SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error("❌ Error updating conversation:", error);
      throw error;
    }
  }

  async getConversations(
    chatType: "learningPath" | "consultation"
  ): Promise<Conversation[]> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return [];

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let userId: string | undefined;

      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user._id || user.id || undefined;
        } catch {
          // If not JSON, ignore
        }
      }

      const query = userId
        ? `SELECT * FROM conversations
           WHERE chatType = ? AND userId = ?
           ORDER BY updatedAt DESC`
        : `SELECT * FROM conversations
           WHERE chatType = ? AND userId IS NULL
           ORDER BY updatedAt DESC`;

      const result = await this.db.getAllAsync<{
        id: string;
        chatType: string;
        title: string;
        lastMessage: string | null;
        lastMessageTime: number;
        messageCount: number;
        userId: string | null;
      }>(query, [chatType]);

      return result.map((row) => ({
        id: row.id,
        chatType: row.chatType as "learningPath" | "consultation",
        title: row.title,
        lastMessage: row.lastMessage || "",
        lastMessageTime: row.lastMessageTime,
        messageCount: row.messageCount,
        userId: row.userId || undefined,
      }));
    } catch (error) {
      console.error("❌ Error getting conversations:", error);
      return [];
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      // Delete conversation and all its messages
      await this.db.withTransactionAsync(async () => {
        await this.db!.runAsync(`DELETE FROM chat_messages WHERE conversationId = ?`, [
          conversationId,
        ]);
        await this.db!.runAsync(`DELETE FROM conversations WHERE id = ?`, [
          conversationId,
        ]);
      });
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      throw error;
    }
  }

  async deleteMessagesByConversation(conversationId: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
    if (!this.db) return;

    try {
      await this.db.runAsync(`DELETE FROM chat_messages WHERE conversationId = ?`, [
        conversationId,
      ]);
    } catch (error) {
      console.error("❌ Error deleting messages by conversation:", error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log("✅ Database closed");
    }
  }
}

// Export singleton instance
export const chatDatabaseService = new ChatDatabaseService();

