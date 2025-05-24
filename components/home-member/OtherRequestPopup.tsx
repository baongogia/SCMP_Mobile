import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function OtherRequestPopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn khác</Text>
      <Text style={styles.content}>
        Chức năng này cho phép bạn gửi các loại đơn từ khác.
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
