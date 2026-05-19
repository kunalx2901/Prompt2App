import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddBlogScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const saveBlog = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter both title and description');
      return;
    }

    try {
      const storedBlogs = await AsyncStorage.getItem('blogs');
      const blogs = storedBlogs ? JSON.parse(storedBlogs) : [];
      
      const newBlog = {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };
      
      blogs.push(newBlog);
      await AsyncStorage.setItem('blogs', JSON.stringify(blogs));
      
      // Reset form
      setTitle('');
      setDescription('');
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save blog:', error);
      Alert.alert('Error', 'Failed to save blog');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter blog title"
          maxLength={100}
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter blog description"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        
        <TouchableOpacity style={styles.saveButton} onPress={saveBlog}>
          <Text style={styles.saveButtonText}>Save Blog</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
