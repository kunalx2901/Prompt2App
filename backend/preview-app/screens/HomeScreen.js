import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const HomeScreen = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  const addTodo = () => {
    if (text.trim()) {
      setTodos([
        ...todos,
        { id: Date.now().toString(), text: text.trim(), completed: false },
      ]);
      setText('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={[styles.container, theme.container] }>
      <View style={styles.header}>
        <Text style={[styles.title, theme.text]}>Todo App</Text>
        <TouchableOpacity
          style={[styles.themeButton, theme.button]}
          onPress={toggleTheme}
        >
          <Text style={theme.buttonText}>
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, theme.input]}
          placeholder="Add a new task..."
          placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.todoItem, theme.todoItem] }>
            <TouchableOpacity onPress={() => toggleTodo(item.id)}>
              <Text style={styles.checkbox}>
                {item.completed ? '✅' : '⬜'}
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.todoText,
                theme.text,
                item.completed && styles.completedText,
              ]}
            >
              {item.text}
            </Text>
            <TouchableOpacity onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteButton}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent=
          <Text style={[styles.emptyText, theme.text]}>No todos yet. Add one above!</Text>
      />
    </SafeAreaView>
  );
};

const lightTheme = {
  container: { backgroundColor: '#f5f5f5' },
  text: { color: '#333' },
  button: { backgroundColor: '#007AFF' },
  buttonText: { color: '#fff' },
  input: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ddd',
  },
  todoItem: { backgroundColor: '#fff' },
};

const darkTheme = {
  container: { backgroundColor: '#121212' },
  text: { color: '#fff' },
  button: { backgroundColor: '#0a84ff' },
  buttonText: { color: '#fff' },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderColor: '#444',
  },
  todoItem: { backgroundColor: '#1e1e1e' },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  themeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  checkbox: {
    fontSize: 20,
    marginRight: 15,
  },
  todoText: {
    flex: 1,
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    fontSize: 18,
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
  },
});

export default HomeScreen;