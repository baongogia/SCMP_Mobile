import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function PersonalInfoPopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin cá nhân</Text>
      <Text style={styles.content}>
        Xem và chỉnh sửa thông tin cá nhân của bạn.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
