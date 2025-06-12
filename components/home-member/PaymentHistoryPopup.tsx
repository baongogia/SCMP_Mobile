import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PopupBase } from './PopupBase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentHistory } from '@/api/member/payment-history';

// Interface for API response
interface ApiCourse {
  _id: string;
  title: string;
  price: number;
  description: string;
  session_number: number;
  session_number_duration: string;
  created_at?: string;
}

interface ApiPayment {
  url: string;
  app_trans_id: string;
}

interface ApiTransaction {
  _id: string;
  type: string;
  course: ApiCourse;
  price: number;
  user?: string;
  created_at: string;
  status: string[];
  payment: ApiPayment;
}

// Interface for transformed payment transaction
interface PaymentTransaction {
  id: string;
  orderCode: string;
  courseName: string;
  amount: number;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'expired';
  date: string;
  description: string;
}

// Transform API data to UI data
const transformTransaction = (apiTransaction: ApiTransaction): PaymentTransaction => {
  try {
    // Handle status array - take first status or default to pending
    const status = apiTransaction.status && apiTransaction.status.length > 0 ? apiTransaction.status[0] : 'pending';
    let transformedStatus: PaymentTransaction['status'] = 'pending';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        transformedStatus = 'completed';
        break;
      case 'pending':
        transformedStatus = 'pending';
        break;
      case 'failed':
      case 'error':
        transformedStatus = 'failed';
        break;
      case 'cancelled':
        transformedStatus = 'cancelled';
        break;
      case 'expired':
        transformedStatus = 'expired';
        break;
      default:
        transformedStatus = 'pending';
    }

    return {
      id: apiTransaction._id || 'unknown',
      orderCode: apiTransaction.payment?.app_trans_id || 'N/A',
      courseName: apiTransaction.course?.title || 'Unknown Course',
      amount: apiTransaction.price || 0,
      paymentMethod: 'ZaloPay',
      status: transformedStatus,
      date: apiTransaction.created_at || new Date().toISOString(),
      description: `Thanh toán ${apiTransaction.course?.title || 'khóa học'}`
    };
  } catch (error) {
    throw error;
  }
};

export function PaymentHistoryPopup() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    // Apply search filter when searchQuery or allTransactions changes
    applySearch();
  }, [searchQuery, allTransactions]);

  const loadTransactions = async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }

      // Get token and tenant from AsyncStorage
      const tokenString = await AsyncStorage.getItem('loginToken');
      const tenantString = await AsyncStorage.getItem('tenant');
      
      if (!tokenString || !tenantString) {
        console.error('No token or tenant found in storage');
        setTransactions([]);
        setAllTransactions([]);
        return;
      }
      const tenant = JSON.parse(tenantString);
      const response = await paymentHistory(tenant.value, tokenString);
      
      // Handle the API response data structure - the API returns transactions directly in response.data
      // or sometimes just as response if it's an array
      let apiData = [];
      if (Array.isArray(response)) {
        apiData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        apiData = response.data.data;
      }
      
      const transformedTransactions = apiData.map((transaction: ApiTransaction, index: number) => {
        try {
          return transformTransaction(transaction);
        } catch (error) {
          return null;
        }
      }).filter(Boolean) as PaymentTransaction[]; // Remove null entries and cast type
      
      if (reset || page === 1) {
        setAllTransactions(transformedTransactions);
        setTransactions(transformedTransactions);
      } else {
        // For future pagination support
        const newAllTransactions = [...allTransactions, ...transformedTransactions];
        setAllTransactions(newAllTransactions);
        setTransactions(newAllTransactions);
      }
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      if (reset || page === 1) {
        setTransactions([]);
        setAllTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (searchQuery.trim() === '') {
      setTransactions(allTransactions);
    } else {
      const filtered = allTransactions.filter(transaction => 
        transaction.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.orderCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTransactions(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions(1, true);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Thành công';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      case 'expired':
        return 'time-outline';
      default:
        return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      case 'expired':
        return '#FF5722';
      default:
        return '#666';
    }
  };

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => (
    <ThemedView style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <ThemedText style={styles.orderCode}>#{item.orderCode}</ThemedText>
          <ThemedText style={styles.courseName} numberOfLines={2}>
            {item.courseName}
          </ThemedText>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <ThemedText style={[styles.status, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <ThemedText style={styles.detailText}>{formatDate(item.date)}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color="#666" />
          <ThemedText style={styles.detailText}>{item.paymentMethod}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <ThemedText style={styles.amount}>{formatCurrency(item.amount)}</ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.description} numberOfLines={2}>
        {item.description}
      </ThemedText>
    </ThemedView>
  );

  const renderHeader = () => (
    <>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên khóa học hoặc mã giao dịch..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#aaa"
        />
        {searchQuery ? (
          <Ionicons name="close-circle" size={20} color="#666" onPress={() => setSearchQuery('')} />
        ) : null}
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={60} color="#ccc" />
      <ThemedText style={styles.emptyStateText}>
        {searchQuery ? 'Không tìm thấy giao dịch nào' : 'Chưa có giao dịch nào'}
      </ThemedText>
      <ThemedText style={styles.emptyStateSubtext}>
        {searchQuery 
          ? 'Thử tìm kiếm với từ khóa khác' 
          : 'Các giao dịch thanh toán của bạn sẽ hiển thị tại đây'
        }
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <PopupBase useScrollView={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <ThemedText style={styles.loadingText}>Đang tải lịch sử giao dịch...</ThemedText>
        </View>
      </PopupBase>
    );
  }

  return (
    <PopupBase useScrollView={false}>
      <View style={styles.container}>
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007BFF']}
              tintColor="#007BFF"
            />
          }
        />
      </View>
    </PopupBase>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  flatListContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 10,
    color: '#888',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 10,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  transactionDetails: {
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});