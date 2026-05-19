import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BlogListScreen from './screens/BlogListScreen';
import AddBlogScreen from './screens/AddBlogScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="BlogList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="BlogList" 
          component={BlogListScreen} 
          options={{ title: 'My Blogs' }}
        />
        <Stack.Screen 
          name="AddBlog" 
          component={AddBlogScreen} 
          options={{ title: 'Add New Blog' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
