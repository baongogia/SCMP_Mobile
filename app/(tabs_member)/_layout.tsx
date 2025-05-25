import React from 'react';
import { Image, Platform, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Button, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTenantsAvailable } from '@/api/tenants-available';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const navigation = useNavigation();

  const [user, setUser] = React.useState({} as any);
  const [selectedBranch, setSelectedBranch] = React.useState('');
  const [isDropdownVisible, setIsDropdownVisible] = React.useState(false);
  const [branches, setBranches] = React.useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    initializeData();
  }, []);

  // Load selectedBranch from AsyncStorage on mount
  React.useEffect(() => {
    const loadSelectedBranch = async () => {
      try {
        const savedTenant = await AsyncStorage.getItem('tenant');
        if (savedTenant) {
          const tenantObj = JSON.parse(savedTenant);
          if (tenantObj && typeof tenantObj === 'object' && tenantObj.value) {
            setSelectedBranch(tenantObj.value);
          } else {
            setSelectedBranch(tenantObj);
          }
        }
      } catch (error) {
        console.error('Error loading selected branch:', error);
      }
    };
    loadSelectedBranch();
  }, []);

  const initializeData = async () => {
    try {
      setIsInitializing(true);
      
      // Start async operations in parallel
      const [userData, savedTenant] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('tenant')
      ]);

      // Set user data immediately if available
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Set saved tenant selection immediately if available
      if (savedTenant) {
        const tenantObj = JSON.parse(savedTenant);
        if (tenantObj && typeof tenantObj === 'object' && tenantObj.value) {
          setSelectedBranch(tenantObj.value);
        } else {
          setSelectedBranch(tenantObj);
        }
      }

      // Always fetch tenants to get the labels
      await fetchTenantsForDisplay();

    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchTenantsForDisplay = async () => {
    try {
      const token = await AsyncStorage.getItem('loginToken');
      if (!token) return;
      
      const tenantsData = await getTenantsAvailable(token) || [];
      const tenants = tenantsData.map((item: any) => ({
        label: item.tenant_id.title,
        value: item.tenant_id._id
      }));
      setBranches(tenants);
    } catch (error) {
      console.error('Error fetching tenants for display:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('loginToken');
      if (!token) {
        console.error('No token found in AsyncStorage');
        return;
      }
      const tenantsData = await getTenantsAvailable(token) || [];
      const tenants = tenantsData.map((item: any) => ({
        label: item.tenant_id.title,
        value: item.tenant_id._id
      }));
      setBranches(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('tenant');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'index' }],
      })
    );
  };

  const handleBranchSelect = async (branch: any) => {
    setSelectedBranch(branch.value);
    setIsDropdownVisible(false);
    // Store only the value (tenant ID) instead of the whole object
    await AsyncStorage.setItem('tenant', branch.value);
  };

  const getSelectedBranchLabel = () => {
    if (!selectedBranch) return 'Chọn chi nhánh';
    const selected = branches.find(branch => branch.value === selectedBranch);
    return selected ? selected.label : 'Chi nhánh đã chọn';
  };

  const handleDropdownPress = async () => {
    // Always fetch fresh data when dropdown is pressed
    await fetchTenants();
    setIsDropdownVisible(true);
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang khởi tạo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.drawerContent}>
      <View style={styles.userInfo}>
        <Image
          source={{
            uri: (user && user.featured_image) ?
              user?.featured_image[0]?.path : 'https://minio.mangoads.com.vn/demo/d8be589a-d207-40ff-a8ed-8bb4104beb3b.jpg'
          }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={styles.userName}>{user?.role_front}: {user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.branchContainer}>
          <Text style={styles.branchLabel}>Chi nhánh:</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={handleDropdownPress}
            disabled={loading}
          >
            <Text style={styles.dropdownButtonText}>
              {loading ? 'Đang tải...' : getSelectedBranchLabel()}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Button title="Logout" onPress={handleLogout} />
      
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <FlatList
              data={branches}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleBranchSelect(item)}
                >
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Tabs">
        {() => (
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: {
                  position: 'absolute',
                },
                default: {},
              }),
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="chat"
              options={{
                title: 'Chats',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="explore"
              options={{
                title: 'Explore',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
              }}
            />
            <Tabs.Screen
              name="notification"
              options={{
                title: 'Notification',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="qr-screen"
              options={{
                title: 'QR',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
              }}
            />
          </Tabs>
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    marginTop: 50,
    flex: 1,
    padding: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  userName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: 'gray',
  },
  branchContainer: {
    marginTop: 15,
  },
  branchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 200,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});