import React, { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const navigation = useNavigation();

const handleLogin = async () => {
  try {
    const response = await login(email, password);
    console.log('Login response:', response);

    const role_front = response?.data?.user?.role_front;
    if (!Array.isArray(role_front)) {
      throw new Error('User data is invalid or role_front is not an array');
    }

    if (role === 'member' && role_front.includes('member')) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(tabs_member)' }],
        })
      );
    } else if (role === 'instructor' && role_front.includes('instructor')) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(tabs_instructor)' }],
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