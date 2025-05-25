import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack, useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { login } from '@/api/login';
import { toastConfig } from '@/components/CustomToast';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin2024@gmail.com');
  const [password, setPassword] = useState('123');
  const [role, setRole] = useState('instructor');
  const navigation = useNavigation();

  useEffect(() => {
    if(role === 'member') {
      setEmail('member1@gmail.com');
    } else if(role === 'instructor') {
      setEmail('admin2024@gmail.com');
    }
  }, [role]);

const handleLogin = async () => {
  try {
    const response = await login(email, password);
    const role_front = response?.data?.user?.role_front;
    if (!Array.isArray(role_front)) {
      throw new Error('User data is invalid or role_front is not an array');
    }
    
    // Check if user has valid role but navigate to tenant selection first
    if ((role === 'member' && role_front.includes('member')) || 
        (role === 'instructor' && role_front.includes('instructor'))) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'select-tenant' }],
        })
      );
    } else {
      throw new Error('Invalid role');
    }
  } catch (error) {
    console.error('Login error:', error);
    Toast.show({
      type: 'error',
      text1: (error as any).message ?? 'Login failed',
    });
  }
};

  return (
    <>
      <Stack.Screen options={{ title: 'Login' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Login</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Picker
          selectedValue={role}
          style={styles.picker}
          onValueChange={(itemValue) => setRole(itemValue)}
        >
          <Picker.Item label="Member" value="member" />
          <Picker.Item label="Instructor" value="instructor" />
        </Picker>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </ThemedView>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  picker: {
    width: '100%',
    marginVertical: 10,
  },
  button: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});