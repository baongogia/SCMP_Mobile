import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';

import TabLayout from './(tabs_instructor)/_layout';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const navigation = useNavigation();

  const handleLogout = () => {
    // Handle logout logic here
    console.log('Logout');
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
        <Text style={styles.userName}>User Namessss</Text>
        <Text style={styles.userEmail}>user@example.com</Text>
      </View>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Tabs" component={TabLayout} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: 'gray',
  },
});