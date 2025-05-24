import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RegulationsPopup() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Các quy định</Text>
      <Text style={styles.content}>
        Xem các quy định của nhà trường.
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
