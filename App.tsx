/**
 * Todo list demo app
 *
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const STORAGE_KEY = '@todos';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          setTodos(JSON.parse(stored));
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos, loaded]);

  const addTodo = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setTodos(prev => [
      ...prev,
      { id: Date.now().toString(), text: trimmed, completed: false },
    ]);
    setText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.inputRow}>
        <TextInput
          testID="todo-input"
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={text}
          onChangeText={setText}
          onSubmitEditing={addTodo}
          placeholder="Add a todo"
          placeholderTextColor={isDarkMode ? '#888' : '#999'}
          returnKeyType="done"
        />
        <TouchableOpacity
          testID="add-button"
          style={styles.addButton}
          onPress={addTodo}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View testID={`todo-item-${item.id}`} style={styles.row}>
            <TouchableOpacity
              testID={`todo-checkbox-${item.id}`}
              style={styles.checkboxTouchable}
              onPress={() => toggleTodo(item.id)}>
              <View
                style={[styles.checkbox, item.completed && styles.checkboxChecked]}
              />
              <Text
                style={[
                  styles.todoText,
                  isDarkMode && styles.todoTextDark,
                  item.completed && styles.todoTextCompleted,
                ]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`todo-delete-${item.id}`}
              onPress={() => deleteTodo(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#111',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#000',
  },
  inputDark: {
    borderColor: '#555',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007aff',
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007aff',
  },
  checkboxChecked: {
    backgroundColor: '#007aff',
  },
  todoText: {
    fontSize: 16,
    color: '#000',
    flexShrink: 1,
  },
  todoTextDark: {
    color: '#fff',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteText: {
    color: '#ff3b30',
    marginLeft: 12,
  },
});

export default App;
