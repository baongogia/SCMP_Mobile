import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for chat groups
const mockChatGroups = [
  {
    id: 1,
    groupName: "Bơi cơ bản - Lớp A1",
    lastMessage: "Chào thầy! Em muốn hỏi về kỹ thuật bơi sải.",
    lastMessageTime: new Date(Date.now() - 300000),
    unreadCount: 3,
    memberCount: 15,
  },
  {
    id: 2,
    groupName: "Bơi nâng cao - Lớp B2",
    lastMessage: "Cảm ơn thầy đã chỉ dạy kỹ thuật bơi bướm!",
    lastMessageTime: new Date(Date.now() - 1800000),
    unreadCount: 0,
    memberCount: 12,
  },
  {
    id: 3,
    groupName: "Bơi trẻ em - Lớp C3",
    lastMessage: "Thầy ơi, con muốn học bơi ngửa ạ",
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 1,
    memberCount: 20,
  },
  {
    id: 4,
    groupName: "Bơi người lớn - Lớp D4",
    lastMessage: "Buổi học hôm nay rất bổ ích ạ",
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 0,
    memberCount: 18,
  },
];

// Mock data for individual chat messages
const mockMessages: Message[] = [
  {
    id: 1,
    text: "Chào thầy! Em muốn hỏi về kỹ thuật thở khi bơi sải.",
    sender: "student",
    senderName: "Nguyễn Văn A",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    text: "Chào em! Thầy nghe em nói đi.",
    sender: "instructor",
    senderName: "Thầy Minh",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: 3,
    text: "Em thấy khó thở khi bơi sải ạ. Thầy có thể chỉ em cách thở đúng không?",
    sender: "student",
    senderName: "Nguyễn Văn A", 
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: 4,
    text: "Được, thầy sẽ hướng dẫn chi tiết. Khi bơi sải, em cần thở theo nhịp: một tay vớt lên thì đầu nghiêng sang bên đó để hít thở...",
    sender: "instructor",
    senderName: "Thầy Minh",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 5,
    text: "Cảm ơn thầy! Em sẽ tập theo hướng dẫn ạ.",
    sender: "student", 
    senderName: "Nguyễn Văn A",
    timestamp: new Date(Date.now() - 60000),
  }
];

type ChatGroup = {
  id: number;
  groupName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  memberCount: number;
};

type Message = {
  id: number;
  text: string;
  sender: 'student' | 'instructor';
  senderName: string;
  timestamp: Date;
};

export default function Chat() {
  const [currentView, setCurrentView] = useState<'groups' | 'chat'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Filter groups based on search
  const filteredGroups = mockChatGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && messages.length > 0 && currentView === 'chat') {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, currentView]);

  const selectGroup = (group: ChatGroup) => {
    setSelectedGroup(group);
    setCurrentView('chat');
  };

  const goBackToGroups = () => {
    setCurrentView('groups');
    setSelectedGroup(null);
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputText.trim(),
        sender: 'instructor',
        senderName: 'Thầy Minh',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    }
  };

  const renderChatGroup = ({ item }: { item: ChatGroup }) => (
    <TouchableOpacity 
      style={styles.groupItem}
      onPress={() => selectGroup(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupIcon}>
        <Ionicons name="people" size={24} color="#007BFF" />
      </View>
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>{item.groupName}</Text>
          <Text style={styles.lastMessageTime}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <View style={styles.groupFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          <View style={styles.groupStats}>
            <Text style={styles.memberCount}>{item.memberCount} thành viên</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isInstructor = item.sender === 'instructor';
    
    return (
      <View style={[
        styles.messageContainer,
        isInstructor ? styles.instructorMessage : styles.studentMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isInstructor ? styles.instructorBubble : styles.studentBubble
        ]}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text style={[
            styles.messageText,
            isInstructor ? styles.instructorText : styles.studentText
          ]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (currentView === 'groups') {
    return (
      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Groups List */}
        <FlatList
          data={filteredGroups}
          renderItem={renderChatGroup}
          keyExtractor={(item) => item.id.toString()}
          style={styles.groupsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goBackToGroups} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{selectedGroup?.groupName}</Text>
            <Text style={styles.headerSubtitle}>{selectedGroup?.memberCount} thành viên</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => Alert.alert('Thông tin nhóm', selectedGroup?.groupName || '')}
        >
          <Ionicons name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButton: {
    padding: 5,
  },
  backButton: {
    marginRight: 15,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 10,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  instructorMessage: {
    alignItems: 'flex-end',
  },
  studentMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  instructorBubble: {
    backgroundColor: '#007BFF',
    borderBottomRightRadius: 4,
  },
  studentBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  instructorText: {
    color: '#fff',
  },
  studentText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
});