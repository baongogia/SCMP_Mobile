import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getTenantsAvailable } from '@/api/tenants-available';
import { toastConfig } from '@/components/CustomToast';

export default function SelectTenantScreen() {
  const [tenants, setTenants] = useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigation = useNavigation();

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      const [userData, token] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('loginToken')
      ]);

      if (userData) {
        setUser(JSON.parse(userData));
      }

      if (token) {
        await fetchTenants(token);
      } else {
        Toast.show({
          type: 'error',
          text1: 'No authentication token found',
        });
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load tenant data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async (token: string) => {
    try {
      const tenantsData = await getTenantsAvailable(token) || [];
      const mappedTenants = tenantsData.map((item: any) => ({
        label: item.tenant_id.title,
        value: item.tenant_id._id
      }));
      setTenants(mappedTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch tenants',
      });
    }
  };

  const handleTenantSelect = async (tenant: {label: string, value: string}) => {
    try {
      // This line already saves the tenant to AsyncStorage
      await AsyncStorage.setItem('tenant', JSON.stringify(tenant));
      
      // Navigate based on user role
      const role_front = user?.role_front;
      if (Array.isArray(role_front)) {
        if (role_front.includes('member')) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: '(tabs_member)' }],
            })
          );
        } else if (role_front.includes('instructor')) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: '(tabs_instructor)' }],
            })
          );
        }
      }
    } catch (error) {
      console.error('Error selecting tenant:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to select tenant',
      });
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <ThemedText style={styles.loadingText}>Đang tải danh sách chi nhánh...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Chọn Chi Nhánh' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Chọn Chi Nhánh</ThemedText>
        <ThemedText style={styles.subtitle}>Vui lòng chọn chi nhánh để tiếp tục</ThemedText>
        
        <FlatList
          data={tenants}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tenantItem}
              onPress={() => handleTenantSelect(item)}
            >
              <Text style={styles.tenantText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      </ThemedView>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  tenantItem: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  tenantText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});
