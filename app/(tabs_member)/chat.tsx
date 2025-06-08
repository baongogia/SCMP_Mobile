import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { getConversations } from '@/api/member/conversations';
import { getConversation } from '@/api/member/conversation';
import { memberToManager } from '@/api/member/member-to-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface ChatGroup {
  id: string;
  groupName: string;
  lastMessage: string;
  lastMessageTime: Date;
  memberCount: number;
  unreadCount: number;
  isManager: boolean;
  conversationType: string[];
  classInfo?: {
    id: string;
    name: string;
    course: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: number | string;
  text: string;
  sender: 'instructor' | 'student' | 'me' | 'other';
  senderName: string;
  senderRole?: string;
  timestamp: Date;
  timestampString?: string; // Original timestamp string from API
  media?: Array<{
    _id: string;
    filename: string;
    path: string;
    mime: string;
    title?: string;
    alt?: string;
    size?: number;
  }>;
}

export default function Chat() {
  const insets = useSafeAreaInsets();
  const bottomTabOverflow = useBottomTabOverflow();
  const [currentView, setCurrentView] = useState<'groups' | 'chat'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentDetailConversationId, setCurrentDetailConversationId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Cache detail messages for each conversation - each conversation has its own data
  const [conversationDetailCache, setConversationDetailCache] = useState<{[key: string]: any[]}>({});
  const flatListRef = useRef<FlatList>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Helper function to parse timestamp exactly as received from API
  const parseApiTimestamp = (timestampString: string) => {
    // Return the exact timestamp from API without timezone conversion
    return new Date(timestampString);
  };

  // Helper function to format timestamp for display (showing full date and time)
  const formatApiTimestamp = (timestampString: string) => {
    // Extract date and time directly from ISO string to avoid timezone conversion
    const isoMatch = timestampString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    
    if (isoMatch) {
      const [, year, month, day, hour, minute] = isoMatch;
      // Use the exact date and time from API without timezone conversion
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    
    // Fallback to original method if regex fails
    const date = new Date(timestampString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    return `${day}/${month}/${year} ${timeStr}`;
  };

  // Fetch chat groups from API
  const fetchChatGroups = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const tenantString = await AsyncStorage.getItem('tenant');
      const token = await AsyncStorage.getItem('loginToken');
      if (!tenantString) {
        setLoading(false);
        return;
      }
      const tenantObject = JSON.parse(tenantString);
      const tenant = tenantObject?.value;
      const response = await getConversations(tenant, token);
      
      if (response.meta_data && response.data) {
        // Transform API data to match ChatGroup interface
        const transformedGroups: ChatGroup[] = response.data.map((conversation: any) => {
          // Determine group name based on conversation type
          let groupName = 'Hội thoại';
          let isManager = false;
          
          if (conversation.type?.includes('manager')) {
            groupName = 'Quản lý';
            isManager = true;
          } else if (conversation.type?.includes('class') && conversation.class_id) {
            groupName = conversation.class_id.name || 'Lớp học';
            isManager = false;
          }
          
          return {
            id: conversation._id || Math.random().toString(),
            groupName: groupName,
            lastMessage: 'Chưa có tin nhắn', // API doesn't provide last message
            lastMessageTime: new Date(new Date(conversation.updated_at || conversation.created_at).getTime() - 7 * 60 * 60 * 1000),
            memberCount: conversation.users?.length || 0,
            unreadCount: 0, // API doesn't provide unread count
            isManager: isManager,
            conversationType: conversation.type || [],
            classInfo: conversation.class_id ? {
              id: conversation.class_id._id,
              name: conversation.class_id.name,
              course: conversation.class_id.course
            } : undefined,
            createdAt: new Date(new Date(conversation.created_at).getTime() - 7 * 60 * 60 * 1000),
            updatedAt: new Date(new Date(conversation.updated_at).getTime() - 7 * 60 * 60 * 1000)
          };
        });
        
        setChatGroups(transformedGroups);
      } else {
        throw new Error('Không có dữ liệu hội thoại');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách hội thoại. Vui lòng thử lại.');
      // Keep existing groups if error occurs during refresh
      if (!showRefreshing) {
        setChatGroups([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load chat groups on component mount
  useEffect(() => {
    fetchChatGroups();
  }, []);

  // Lấy userId từ AsyncStorage khi mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userObj = JSON.parse(userString);

          setUserId(userObj?.id || null);
        }
      } catch {}
    };
    getUserId();
  }, []);

  // Filter groups based on search
  const filteredGroups = chatGroups.filter(group =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && messages.length > 0 && currentView === 'chat') {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, currentView]);

  // Auto scroll to bottom when a new message from 'me' is added
  useEffect(() => {
    if (
      flatListRef.current &&
      messages.length > 0 &&
      currentView === 'chat'
    ) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender === 'me') {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    }
  }, [messages, currentView]);

  const selectGroup = (group: ChatGroup) => {
    setSelectedGroup(group);
    setCurrentView('chat');
    if (group?.id) {
      fetchConversationMessages(group.id);
    }
  };

  const goBackToGroups = () => {
    setCurrentView('groups');
    setSelectedGroup(null);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (!selectedGroup) return;
    if (selectedGroup.conversationType?.includes('manager')) {
      // Gửi tin nhắn qua API memberToManager với đúng thứ tự tham số
      try {
        const token = await AsyncStorage.getItem('loginToken');
        const tenantString = await AsyncStorage.getItem('tenant');
        let tenant = null;
        if (tenantString) {
          const tenantObj = JSON.parse(tenantString);
          tenant = tenantObj?.value || tenantObj;
        }
        await memberToManager(token, tenant, inputText.trim(), selectedGroup.id);
        fetchConversationMessages(selectedGroup.id);
        // Clear cache for this conversation to refresh detail popup
        setConversationDetailCache(prev => {
          const newCache = { ...prev };
          delete newCache[selectedGroup.id];
          return newCache;
        });
      } catch (e) {
        // Xử lý lỗi nếu cần
      }
    } else {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputText.trim(),
        sender: 'instructor',
        senderName: 'Thầy Minh',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newMessage]);
    }
    setInputText('');
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
      <View style={[styles.groupIcon, item.isManager && styles.managerIcon]}>
        <Ionicons
          name={item.isManager ? "person-circle" : "people"}
          size={24}
          color={item.isManager ? "#FF6B35" : "#007BFF"}
        />
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
    // Determine if this message is sent by me
    const isMe = userId && (item.sender === 'me' || item.senderName === userId);
    const screenWidth = Dimensions.get('window').width;
    const imageWidth = screenWidth * 0.6; // 60% of screen width
    const maxImageHeight = 150;

    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.instructorMessage : styles.studentMessage,
        { alignSelf: isMe ? 'flex-end' : 'flex-start' }
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.instructorBubble : styles.studentBubble
        ]}>
          <Text style={styles.senderName}>
            {item.senderName}
            {item.senderRole ? ` (${item.senderRole})` : ''}
          </Text>
          
          {/* Text content */}
          {item.text && (
            <Text style={[
              styles.messageText,
              isMe ? styles.instructorText : styles.studentText
            ]}>
              {item.text}
            </Text>
          )}
          
          {/* Media content - Only display images using path field */}
          {item.media && item.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {item.media.map((mediaItem, index) => {
                // Check if it's an image by MIME type or file extension
                const isImage = mediaItem.mime?.startsWith('image/') || 
                               mediaItem.path?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                               mediaItem.filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
                
                // Only render images
                if (isImage && mediaItem.path) {
                  return (
                    <View key={`${mediaItem._id}-${index}`} style={styles.imageContainer}>
                      <Image
                        source={{ uri: mediaItem.path }}
                        style={[
                          styles.messageImage,
                          {
                            width: imageWidth,
                            height: maxImageHeight,
                          }
                        ]}
                        resizeMode="cover"
                      />
                    </View>
                  );
                }
                
                // Don't render non-image files
                return null;
              })}
            </View>
          )}
          
          <Text style={styles.timestamp}>
            {item.timestampString ? formatApiTimestamp(item.timestampString) : item.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const showConversationDetail = () => {
    if (selectedGroup?.id) {
      setCurrentDetailConversationId(selectedGroup.id);
      setShowDetailModal(true);
    }
  };

  const hideConversationDetail = () => {
    setShowDetailModal(false);
    setCurrentDetailConversationId(null);
  };

  const formatDetailTime = (date: Date) => {
    // Display UTC time directly without timezone conversion
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    const monthNames = [
      'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
      'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
    ];
    
    return `${day} ${monthNames[month]} ${year}, ${hours}:${minutes}`;
  };

  // Hàm fetch messages cho detail popup với cache
  const fetchConversationDetailMessages = async (conversationId: string) => {
    // Kiểm tra cache trước
    if (conversationDetailCache[conversationId]) {
      return; // Không cần set lại detailMessages vì sẽ lấy từ cache
    }
    
    try {
      setDetailLoading(true);
      const tenantString = await AsyncStorage.getItem('tenant');
      const token = await AsyncStorage.getItem('loginToken');
      if (!tenantString || !token) return;
      const tenantObject = JSON.parse(tenantString);
      const tenant = tenantObject?.value;
      // Gọi API đúng hàm getConversation
      const response = await getConversation(tenant, token, conversationId, 1, 10);
      const messages = response.data || [];
      
      // Lưu vào cache
      setConversationDetailCache(prev => ({
        ...prev,
        [conversationId]: messages
      }));
    } catch (e) {
      // Nếu có lỗi, set cache empty array để tránh fetch lại
      setConversationDetailCache(prev => ({
        ...prev,
        [conversationId]: []
      }));
    } finally {
      setDetailLoading(false);
    }
  };

  // Khi mở popup detail thì fetch messages
  useEffect(() => {
    if (showDetailModal && selectedGroup?.id) {
      fetchConversationDetailMessages(selectedGroup.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetailModal, selectedGroup?.id]);

  // Fetch messages with pagination, append: false = replace, true = prepend
  const fetchConversationMessages = async (conversationId: string, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);
      const tenantString = await AsyncStorage.getItem('tenant');
      const token = await AsyncStorage.getItem('loginToken');
      const userString = await AsyncStorage.getItem('user');
      let myId = null;
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          myId = userObj?._id || userObj?.id;
        } catch {}
      }
      if (!tenantString || !token) return;
      const tenantObject = JSON.parse(tenantString);
      const tenant = tenantObject?.value;
      const response = await getConversation(tenant, token, conversationId, pageNum, 7);
      const rawMessages = response.data || [];
      const total = response.meta_data?.count || 0;
      const mapped = rawMessages.map((msg: any, idx: number) => {
        let baseId = msg._id ? String(msg._id) : '';
        let created = msg.created_at ? String(msg.created_at) : '';
        let uniqueKey = `${baseId}-${created}-p${pageNum}-i${idx}`;
        
        // Debug: Log original timestamp and formatted result

        
        return {
          id: uniqueKey,
          text: msg.content,
          sender: (myId && (msg.created_by?._id === myId || msg.created_by?.id === myId)) ? 'me' : 'other',
          senderName: msg.created_by?.username || 'Người dùng',
          senderRole: Array.isArray(msg.created_by?.role_front) ? msg.created_by?.role_front.join(', ') : (msg.created_by?.role_front || ''),
          timestamp: parseApiTimestamp(msg.created_at),
          timestampString: msg.created_at, // Keep original string for exact display
          media: msg.media ? msg.media.map((mediaItem: any) => {
            // Ensure path field is properly mapped
            return {
              _id: mediaItem._id || `media_${Date.now()}_${Math.random()}`,
              filename: mediaItem.filename || 'Unknown file',
              path: mediaItem.path || '', // This is the key field for displaying images
              mime: mediaItem.mime || 'application/octet-stream',
              title: mediaItem.title || mediaItem.filename || 'Media file',
              alt: mediaItem.alt || mediaItem.title || mediaItem.filename,
              size: mediaItem.size || 0
            };
          }) : undefined,
        };
      });
      
      // Sort messages by timestamp (oldest first, then reverse for newest at bottom)
      const sorted = mapped.sort((a: any, b: any) => {
        const timeA = new Date(a.timestampString || a.timestamp).getTime();
        const timeB = new Date(b.timestampString || b.timestamp).getTime();
        return timeA - timeB;
      });
      
      // Reverse for FlatList inverted display (newest messages at bottom/index 0)
      const reversed = sorted.reverse();
      if (append) {
        setMessages(prev => {
          // For FlatList inverted=true: append older messages to END of array (higher index = top of screen)
          const newMessages = [...prev, ...reversed];
          setHasMore(newMessages.length < total);
          return newMessages;
        });
      } else {
        setMessages(reversed);
        setHasMore(reversed.length < total);
      }
    } catch (e) {
      if (!append) setMessages([]);
    } finally {
      if (pageNum === 1) setLoading(false);
      if (pageNum > 1) setLoadingMore(false);
    }
  };

  // Khi vào chat, load trang đầu và scroll xuống cuối
  useEffect(() => {
    if (currentView === 'chat' && selectedGroup?.id) {
      setPage(1);
      setHasMore(true);
      fetchConversationMessages(selectedGroup.id, 1, false);
    }
  }, [currentView, selectedGroup?.id]);

  // Auto scroll to bottom khi load xong trang đầu
  useEffect(() => {
    if (
      flatListRef.current &&
      messages.length > 0 &&
      currentView === 'chat' &&
      page === 1
    ) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
    }
  }, [messages, currentView, page]);

  // Track if user has scrolled to top (for load more)
  const hasScrolledRef = useRef(false);
  const canLoadMoreRef = useRef(false);
  const listHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  // Reset scroll refs when entering a new chat
  useEffect(() => {
    hasScrolledRef.current = false;
    canLoadMoreRef.current = false;
    listHeightRef.current = 0;
    contentHeightRef.current = 0;
  }, [selectedGroup?.id]);

  // FlatList onScroll handler to detect user scroll
  const handleScroll = (event: any) => {
    if (!hasScrolledRef.current) {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (offsetY > 20) {
        hasScrolledRef.current = true;
      }
    }
  };

  // FlatList onLayout to get list height
  const handleListLayout = (event: any) => {
    listHeightRef.current = event.nativeEvent.layout.height;
    // Check if can scroll
    if (contentHeightRef.current > listHeightRef.current + 10) {
      canLoadMoreRef.current = true;
    }
  };

  // FlatList onContentSizeChange to get content height
  const handleContentSizeChange = (w: number, h: number) => {
    contentHeightRef.current = h;
    if (listHeightRef.current > 0 && h > listHeightRef.current + 10) {
      canLoadMoreRef.current = true;
    }
  };

  // Load more khi scroll lên đầu (only if user has scrolled and can scroll)
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && selectedGroup?.id && hasScrolledRef.current && canLoadMoreRef.current) {
      const nextPage = page + 1;
      fetchConversationMessages(selectedGroup.id, nextPage, true);
      setPage(nextPage);
    }
  };

  // --- FlatList keyExtractor: always return a unique string key ---
  const getMessageKey = (item: Message, index: number) => {
    // Use id if string, else fallback to created_at+index
    if (typeof item.id === 'string') return item.id;
    if (typeof item.id === 'number') return String(item.id);
    // fallback: combine senderName, timestamp, and index
    return `${item.senderName || ''}-${item.timestamp?.toISOString?.() || ''}-${index}`;
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

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Đang tải danh sách hội thoại...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B35" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchChatGroups()}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Groups List */}
        {!loading && !error && (
          <FlatList
            data={filteredGroups}
            renderItem={renderChatGroup}
            keyExtractor={(item) => item.id}
            style={styles.groupsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchChatGroups(true)}
                colors={['#007BFF']}
                tintColor="#007BFF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Không tìm thấy hội thoại nào' : 'Chưa có hội thoại nào'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // Always render chat view when currentView === 'chat'
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
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
          onPress={showConversationDetail}
        >
          <Ionicons name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={getMessageKey}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        inverted={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={handleScroll}
        onLayout={handleListLayout}
        onContentSizeChange={handleContentSizeChange}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#007BFF" /> : null}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { 
        paddingBottom: Math.max(insets.bottom + bottomTabOverflow, 8) 
      }]}>
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

      {/* Conversation Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showDetailModal && !!selectedGroup?.id}
        onRequestClose={hideConversationDetail}
      >
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
          <StatusBar barStyle="light-content" />
          {/* Popup Header (like index.tsx) */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: '#007BFF',
            height: 56,
          }}>
            <TouchableOpacity style={{position: 'absolute', left: 16, zIndex: 10}} onPress={hideConversationDetail}>
              <Text style={{color: 'white', fontSize: 16, fontWeight: '500'}}>Quay lại</Text>
            </TouchableOpacity>
            <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', width: '100%', paddingHorizontal: 50}}>Thông tin hội thoại</Text>
          </View>
          {/* Popup Content */}
          <ScrollView style={{flex: 1, padding: 20}} showsVerticalScrollIndicator={false}>
            {selectedGroup && (
              <View>
                {/* Group Icon and Name */}
                <View style={{alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 20}}>
                  <View style={[{width: 80, height: 80, borderRadius: 40, backgroundColor: selectedGroup.isManager ? 'rgba(255, 107, 53, 0.1)' : 'rgba(0, 123, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12}]}> 
                    <Ionicons
                      name={selectedGroup.isManager ? "person-circle" : "people"}
                      size={48}
                      color={selectedGroup.isManager ? "#FF6B35" : "#007BFF"}
                    />
                  </View>
                  <Text style={{fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8}}>{selectedGroup.groupName || '-'}</Text>
                  <View style={{backgroundColor: '#f8f9fa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16}}>
                    <Text style={{fontSize: 14, color: '#666', fontWeight: '500'}}>
                      {selectedGroup.isManager ? 'Hội thoại quản lý' : 'Hội thoại lớp học'}
                    </Text>
                  </View>
                </View>
                {/* Conversation Details */}
                <View style={{marginBottom: 24}}>
                  <Text style={{fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16}}>Chi tiết</Text>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                    <Ionicons name="people" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>Số thành viên</Text>
                      <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.memberCount || 0} người</Text>
                    </View>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                    <Ionicons name="time" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>Cập nhật cuối</Text>
                      <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.lastMessageTime ? formatDetailTime(selectedGroup.lastMessageTime) : '-'}</Text>
                    </View>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                    <Ionicons name="calendar" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>Ngày tạo</Text>
                      <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.createdAt ? formatDetailTime(selectedGroup.createdAt) : '-'}</Text>
                    </View>
                  </View>
                  {selectedGroup.classInfo && (
                    <View>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                        <Ionicons name="school" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                        <View style={{flex: 1}}>
                          <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>ID Lớp học</Text>
                          <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.classInfo.id || '-'}</Text>
                        </View>
                      </View>
                      <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                        <Ionicons name="book" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                        <View style={{flex: 1}}>
                          <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>ID Khóa học</Text>
                          <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.classInfo.course || '-'}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                    <Ionicons name="pricetag" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>Loại hội thoại</Text>
                      <Text style={{fontSize: 16, color: '#333', fontWeight: '500'}}>{selectedGroup.conversationType?.length ? selectedGroup.conversationType.join(', ') : '-'}</Text>
                    </View>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fa'}}>
                    <Ionicons name="finger-print" size={20} color="#666" style={{marginRight: 12, marginTop: 2}} />
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 14, color: '#666', marginBottom: 2}}>ID Hội thoại</Text>
                      <Text style={{fontSize: 16, color: '#333', fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'}}>{selectedGroup.id || '-'}</Text>
                    </View>
                  </View>
                </View>
                {/* Danh sách message của hội thoại */}
                <View style={{marginTop: 32}}>
                  <Text style={{fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12}}>Tin nhắn gần đây</Text>
                  {detailLoading ? (
                    <ActivityIndicator size="small" color="#007BFF" />
                  ) : (currentDetailConversationId && conversationDetailCache[currentDetailConversationId] ? conversationDetailCache[currentDetailConversationId] : []).length === 0 ? (
                    <Text style={{color: '#888'}}>Không có tin nhắn</Text>
                  ) : (
                    (currentDetailConversationId && conversationDetailCache[currentDetailConversationId] ? conversationDetailCache[currentDetailConversationId] : []).map((msg, idx) => (
                      <View key={msg._id || idx} style={{marginBottom: 12, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10}}>
                        <Text style={{fontWeight: 'bold', color: '#007BFF'}}>{msg.sender_name || 'Người dùng'}</Text>
                        <Text style={{color: '#333', marginVertical: 2}}>{msg.content}</Text>
                        <Text style={{fontSize: 12, color: '#888'}}>{msg.created_at ? new Date(new Date(msg.created_at).getTime() - 7 * 60 * 60 * 1000).toLocaleString('vi-VN') : ''}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  managerIcon: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 64,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  // Media styles
  mediaContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5', // Add background to see container
  },
  messageImage: {
    borderRadius: 8,
    backgroundColor: '#fff', // Add white background for images
  },
});