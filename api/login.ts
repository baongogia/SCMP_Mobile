import configs from './config.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function login(email: string, password: string) {
  const response = await fetch(`${configs.API_ENDPOINT}/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  let result = await response.json();
  if (!response.ok) {
    throw new Error('Login failed');
  }
  await AsyncStorage.setItem('loginToken', result.data.accessToken);
  await AsyncStorage.setItem('user', JSON.stringify(result.data.user));
  return result;
}