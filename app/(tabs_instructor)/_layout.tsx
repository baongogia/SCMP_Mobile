import React from 'react';
import { Image, Platform } from 'react-native';
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

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {

  const navigation = useNavigation();

  const [user, setUser] = React.useState({} as any);

  React.useEffect(() => {
    console.log('user', user);
    
    AsyncStorage.getItem('user').then((data) => {
      setUser(JSON.parse(data || '{}'));
    });
  }, []);

  const handleLogout = () => {
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('user');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'index' }],
      })
    );
  };

  return (
    <View style={styles.drawerContent}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: (user && user.featured_image) ? user?.featured_image[0]?.path : '' }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={styles.userName}>{user?.role_front}</Text>
        <Text style={styles.userName}>{user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>
      <Button title="Logout" onPress={handleLogout} />
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
});