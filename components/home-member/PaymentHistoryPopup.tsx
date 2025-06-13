import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Modal, ScrollView, SafeAreaView, StatusBar, Linking, Alert } from 'react-native';
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
  paymentUrl?: string; // Add payment URL field
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
      date: new Date(new Date(apiTransaction.created_at || new Date().toISOString()).getTime() - 7 * 60 * 60 * 1000).toISOString(),
      description: `Thanh toán ${apiTransaction.course?.title || 'khóa học'}`,
      paymentUrl: apiTransaction.payment?.url || undefined // Add payment URL
    };
  } catch (error) {
    throw error;
  }
};

export function PaymentHistoryPopup() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }

      // Get token and tenant from AsyncStorage
      const tokenString = await AsyncStorage.getItem('loginToken');
      const tenantString = await AsyncStorage.getItem('tenant');
      
      if (!tokenString || !tenantString) {
        setTransactions([]);
        return;
      }
      const tenant = JSON.parse(tenantString);
      const response = await paymentHistory(tenant.value, tokenString);
      
      // Handle the API response data structure - the API returns transactions directly in response.data
      // Based on the new structure: data.data[0][0] (nested arrays)
      let apiData = [];
      if (Array.isArray(response)) {
        apiData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        // Check if it's nested arrays structure: data.data[0][0]
        if (response.data.length > 0 && Array.isArray(response.data[0]) && Array.isArray(response.data[0][0])) {
          apiData = response.data[0][0];
        } else {
          apiData = response.data;
        }
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // Check if it's nested arrays structure: data.data.data[0][0]
        if (response.data.data.length > 0 && Array.isArray(response.data.data[0]) && Array.isArray(response.data.data[0][0])) {
          apiData = response.data.data[0][0];
        } else {
          apiData = response.data.data;
        }
      }
      
      const transformedTransactions = apiData.map((transaction: ApiTransaction, index: number) => {
        try {
          return transformTransaction(transaction);
        } catch (error) {
          return null;
        }
      }).filter(Boolean) as PaymentTransaction[]; // Remove null entries and cast type
      
      if (reset || page === 1) {
        setTransactions(transformedTransactions);
      } else {
        // For future pagination support
        const newTransactions = [...transactions, ...transformedTransactions];
        setTransactions(newTransactions);
      }
      
    } catch (error) {
      if (reset || page === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
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

  const handleTransactionPress = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const handlePaymentPress = async (paymentUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(paymentUrl);
      if (supported) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi mở liên kết thanh toán');
    }
  };

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => (
    <View style={styles.touchableContainer}>
      <TouchableOpacity 
        onPress={() => handleTransactionPress(item)}
        activeOpacity={0.7}
        style={styles.transactionItemTouchable}
      >
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
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={60} color="#ccc" />
      <ThemedText style={styles.emptyStateText}>
        Chưa có giao dịch nào
      </ThemedText>
      <ThemedText style={styles.emptyStateSubtext}>
        Các giao dịch thanh toán của bạn sẽ hiển thị tại đây
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
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.flatListContent}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007BFF']}
              tintColor="#007BFF"
            />
          }
        />

        {/* Detail Modal */}
        <Modal
          visible={showDetailModal}
          animationType="slide"
          onRequestClose={closeDetailModal}
          transparent={false}
          statusBarTranslucent={false}
        >
          <SafeAreaView style={styles.modalContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Chi tiết giao dịch</ThemedText>
              <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTransaction ? (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Thông tin đơn hàng</ThemedText>
                  <View style={styles.detailCard}>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Mã giao dịch:</ThemedText>
                      <ThemedText style={styles.detailValue}>#{selectedTransaction.orderCode}</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Trạng thái:</ThemedText>
                      <View style={styles.statusRow}>
                        <Ionicons 
                          name={getStatusIcon(selectedTransaction.status) as any} 
                          size={16} 
                          color={getStatusColor(selectedTransaction.status)} 
                        />
                        <ThemedText style={[styles.detailStatusValue, { color: getStatusColor(selectedTransaction.status) }]}>
                          {getStatusText(selectedTransaction.status)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Ngày tạo:</ThemedText>
                      <ThemedText style={styles.detailValue}>{formatDate(selectedTransaction.date)}</ThemedText>
                    </View>
                  </View>
                </View>

                {/* Course Info */}
                <View style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Thông tin khóa học</ThemedText>
                  <View style={styles.detailCard}>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Tên khóa học:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedTransaction.courseName}</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Mô tả:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedTransaction.description}</ThemedText>
                    </View>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Thông tin thanh toán</ThemedText>
                  <View style={styles.detailCard}>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Phương thức:</ThemedText>
                      <ThemedText style={styles.detailValue}>{selectedTransaction.paymentMethod}</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>Số tiền:</ThemedText>
                      <ThemedText style={[styles.detailValue, styles.amountText]}>
                        {formatCurrency(selectedTransaction.amount)}
                      </ThemedText>
                    </View>
                    {selectedTransaction.status === 'pending' && selectedTransaction.paymentUrl && (
                      <View style={styles.detailItem}>
                        <ThemedText style={styles.detailLabel}>Thanh toán:</ThemedText>
                        <TouchableOpacity
                          style={styles.paymentButton}
                          onPress={() => handlePaymentPress(selectedTransaction.paymentUrl!)}
                        >
                          <Ionicons name="card-outline" size={16} color="#fff" />
                          <ThemedText style={styles.paymentButtonText}>Tiếp tục thanh toán</ThemedText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalContent}>
                <ThemedText>Không có dữ liệu giao dịch</ThemedText>
              </View>
            )}
          </SafeAreaView>
        </Modal>
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
  transactionsList: {
    flex: 1,
  },
  touchableContainer: {
    marginVertical: 3,
  },
  transactionItemTouchable: {
    borderRadius: 8,
  },
  transactionItem: {
    padding: 10,
    borderRadius: 8,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  detailCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  detailStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 2,
    justifyContent: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});