import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlogListScreen({ navigation }) {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    loadBlogs();
    const unsubscribe = navigation.addListener('focus', loadBlogs);
    return unsubscribe;
  }, [navigation]);

  const loadBlogs = async () => {
    try {
      const storedBlogs = await AsyncStorage.getItem('blogs');
      if (storedBlogs) {
        setBlogs(JSON.parse(storedBlogs));
      }
    } catch (error) {
      console.error('Failed to load blogs:', error);
    }
  };

  const deleteBlog = async (id) => {
    try {
      const updatedBlogs = blogs.filter(blog => blog.id !== id);
      await AsyncStorage.setItem('blogs', JSON.stringify(updatedBlogs));
      setBlogs(updatedBlogs);
    } catch (error) {
      console.error('Failed to delete blog:', error);
      Alert.alert('Error', 'Failed to delete blog');
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete Blog',
      'Are you sure you want to delete this blog?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBlog(id) }
      ]
    );
  };

  const renderBlog = ({ item }) => (
    <View style={styles.blogContainer}>
      <Text style={styles.blogTitle}>{item.title}</Text>
      <Text style={styles.blogDescription}>{item.description}</Text>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => confirmDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={blogs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBlog}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blogs yet. Add your first blog!</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBlog')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  blogContainer: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  blogDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
    lineHeight: 35,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
});
