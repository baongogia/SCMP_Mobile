import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';

const mockNotifications = [
  { id: '1', title: 'Welcome to the app!', content: 'Thanks for joining us.' },
  { id: '2', title: 'Course Update', content: 'Your course has new content.' },
  { id: '3', title: 'Reminder', content: 'Don\'t forget to finish your lesson.' },
  { id: '4', title: 'Promotion', content: 'Check out our latest discounts.' },
  { id: '5', title: 'System Notice', content: 'Scheduled maintenance at 2AM.' },
];

export default function Notification() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 3;

  const filtered = mockNotifications.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const pagedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notification title..."
        value={search}
        onChangeText={text => {
          setSearch(text);
          setCurrentPage(1);
        }}
        placeholderTextColor="#aaa"
      />
      <FlatList
        data={pagedData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.notiCard}>
            <Text style={styles.notiTitle}>{item.title}</Text>
            <Text style={styles.notiContent}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No notifications found.</Text>
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationText}>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </Text>
              <View style={styles.paginationButtons}>
                <Text
                  style={[
                    styles.pageBtn,
                    currentPage === 1 && styles.pageBtnDisabled
                  ]}
                  onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                >
                  {'<'}
                </Text>
                <Text
                  style={[
                    styles.pageBtn,
                    currentPage === totalPages && styles.pageBtnDisabled
                  ]}
                  onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                >
                  {'>'}
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    color: '#222',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  notiCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  notiTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#3162C9',
    marginBottom: 4,
  },
  notiContent: {
    fontSize: 14,
    color: '#444',
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  paginationContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  paginationText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtn: {
    fontSize: 20,
    color: '#3162C9',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  pageBtnDisabled: {
    color: '#bbb',
    backgroundColor: '#eee',
  },
});