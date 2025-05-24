import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function LeaveRequestPopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xin nghỉ phép, xếp lịch</Text>
      <Text style={styles.content}>
        Chức năng này cho phép bạn gửi đơn xin nghỉ phép và sắp xếp lại lịch học.
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
