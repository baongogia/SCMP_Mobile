import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SchedulePopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thời khóa biểu</Text>
      <Text style={styles.content}>
        Xem thời khóa biểu của bạn tại đây.
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
