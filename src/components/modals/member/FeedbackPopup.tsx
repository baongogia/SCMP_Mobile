import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function FeedbackPopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ý kiến khác</Text>
      <Text style={styles.content}>
        Gửi các ý kiến đóng góp khác cho nhà trường.
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
